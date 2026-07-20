import OpenAI from "openai";
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  baseURL: "http://localhost:11434/v1/",
  apiKey: process.env.OPENAI_API_KEY || "ollama",
});

export async function POST(request: Request) {
  try {
    const { model, messages, stream, temperature } = await request.json();

    const responseStream = await openai.chat.completions.create({
      model: model,
      messages: messages,
      stream: true, 
      temperature: temperature,
    });

    const encoder = new TextEncoder();

    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const content = chunk.choices[0]?.delta?.content || "";
            
            if (content) {
              const payload = JSON.stringify({
                message: { content: content }
              }) + "\n"; 

              controller.enqueue(encoder.encode(payload));
            }
          }
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