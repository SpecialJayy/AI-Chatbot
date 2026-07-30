import OpenAI from "openai";
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  baseURL: "http://localhost:11434/v1/",
  apiKey: process.env.OPENAI_API_KEY || "ollama",
});

export async function POST(request: Request) {
  try {
    const { model, messages, temperature } = await request.json();

    const responseStream = await openai.chat.completions.create({
      model: model,
      messages: messages,
      stream: true, 
      temperature: temperature,
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