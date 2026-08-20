import OpenAI from "openai";
import { NextResponse } from 'next/server';
import { z } from "zod/v4";

const openai = new OpenAI({
  baseURL: "http://localhost:13305/v1/",
  apiKey: process.env.OPENAI_API_KEY || "ollama",
});

//TODO: change that to be dynamic if time allows

//schema for structured output

// export const schema = z.object({
//   name: z.string().describe("Name of the event"),
//   type: z.string().describe("Type of the event, example: conference, concert"),
//   start_date: z.string().describe("Date at which the event starts"),
//   end_date: z.string().nullable().describe("Date at which the event ends"),
//   hour: z.string().nullable().describe("Time of the event, format HH:MM"),
//   place: z.string().describe("Place at which the event will take place"),
//   city: z.string().describe("City where the event will take place"),
//   ticket_price: z.number().describe("Price of the cheapest ticket option"),
//   event_organizer: z.string().describe("organizer responsible for the event"),
//   description: z.string().describe("Brief description of the event, and activities"),
//   tags: z.array(z.string()).describe("Tags associated with the event, used for example a search engine")
// });

export async function POST(request: Request) {
  try {
    const { model, messages, temperature } = await request.json();
    const responseStream = await openai.chat.completions.create({
      model: model,
      messages: messages,
      stream: true,
      temperature: temperature,
      // response_format: {
      //   type: "json_schema",
      //   json_schema: {
      //     name: "schema",
      //     strict: true,
      //     schema: schema.toJSONSchema()
      //   }
      // },
      stream_options: {
        include_usage: true,
      },
    });

    const encoder = new TextEncoder();

    const customStream = new ReadableStream({
      async start(controller) {

        let propmtTokens = 0;
        let completionTokens = 0;

        try {
          for await (const chunk of responseStream) {

            if (chunk.usage) {
              propmtTokens = chunk.usage.prompt_tokens;
              completionTokens = chunk.usage.completion_tokens;
            }

            const content = chunk.choices[0]?.delta?.content || "";

            if (content) {
              const payload = JSON.stringify({
                message: { content: content }
              }) + "\n";

              controller.enqueue(encoder.encode(payload));
            }
          }

          const finalPayload = JSON.stringify({
            message: { content: "" },
            done: true,
            usage: {
              prompt_tokens: propmtTokens,
              completion_tokens: completionTokens,
              total_tokens: propmtTokens + completionTokens
            }
          }) + "\n";

          controller.enqueue(encoder.encode(finalPayload));

        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(customStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}