import OpenAI from "openai";
import { NextResponse } from 'next/server';
import { tools, toolHandlers } from "./tools";

const openai = new OpenAI({
  baseURL: "http://localhost:13305/v1/",
  apiKey: process.env.OPENAI_API_KEY || "ollama",
});

async function executeToolCalls(toolCalls: any[]) {
  const toolMessages = [];
  const validToolCalls = toolCalls.filter(Boolean);

  for (const toolCall of validToolCalls) {
    const handler = toolHandlers[toolCall.function.name];
    
    if (handler) {
      const args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
      const result = await handler(args);
      
      toolMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }
  return { validToolCalls, toolMessages };
}

export async function POST(request: Request) {
  try {
    const { model, messages, temperature } = await request.json();
    const encoder = new TextEncoder();

    const customStream = new ReadableStream({
      async start(controller) {
        
        // Rekurencyjna funkcja strumieniująca
        async function processStream(currentMessages: any[]) {
          const responseStream = await openai.chat.completions.create({
            model,
            messages: currentMessages,
            stream: true,
            temperature,
            tools,
            stream_options: { include_usage: true },
          });

          let promptTokens = 0;
          let completionTokens = 0;
          let toolCalls: any[] = [];

          for await (const chunk of responseStream) {
            if (chunk.usage) {
              promptTokens = chunk.usage.prompt_tokens;
              completionTokens = chunk.usage.completion_tokens;
            }

            const deltaToolCalls = chunk.choices[0]?.delta?.tool_calls;
            if (deltaToolCalls) {
              // Agregacja fragmentów wywołań narzędzi (pozostawiona z Twojego kodu)
              for (const toolCall of deltaToolCalls) {
                if (!toolCall.function) continue;
                if (toolCall.id) {
                  toolCalls[toolCall.index] = {
                    id: toolCall.id,
                    type: "function",
                    function: { name: toolCall.function.name, arguments: "" }
                  };
                }
                if (toolCall.function?.arguments) {
                  toolCalls[toolCall.index].function.arguments += toolCall.function.arguments;
                }
              }
              continue;
            }

            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(JSON.stringify({ message: { content } }) + "\n"));
            }
          }

          // Dynamiczne wywołanie narzędzi bez instrukcji "if"
          if (toolCalls.length > 0) {
            const { validToolCalls, toolMessages } = await executeToolCalls(toolCalls);
            
            currentMessages.push({ role: "assistant", tool_calls: validToolCalls });
            currentMessages.push(...toolMessages);
            
            return await processStream(currentMessages);
          }

          const finalPayload = JSON.stringify({
            message: { content: "" },
            done: true,
            usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens }
          }) + "\n";

          controller.enqueue(encoder.encode(finalPayload));
          controller.close();
        }

        await processStream(messages);
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