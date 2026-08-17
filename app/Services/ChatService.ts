import { CONTEXT_METHOD } from "../Config/Enums";
import { MessageBubble, ChatMessage, TextContentPart, ImageContentPart } from "../Config/Interfaces";

export const tokenize = (text: string): number => {
  return Math.ceil((text?.length || 0) / 3);
};

export const createContext = (
  method: CONTEXT_METHOD,
  currentChat: MessageBubble[],
  systemPrompt: string
): { newContextMessages: ChatMessage[]; calculatedLimit: number } => {
  let newContextMessages: ChatMessage[] = [];
  let calculatedLimit = 0;

  if (method === CONTEXT_METHOD.NONE) {
    return { newContextMessages, calculatedLimit: tokenize(systemPrompt) };
  }

  // Get sliding window slice
  const windowSize = parseInt(CONTEXT_METHOD.SLIDING_WINDOW as any) || 10;
  const tempChat = currentChat.slice(-windowSize);

  for (const [index, msgObj] of tempChat.entries()) {
    const contentParts: (TextContentPart | ImageContentPart)[] = [
      { type: "text", text: msgObj.text },
    ];

    if (msgObj.imageUrls?.length) {
      msgObj.imageUrls.forEach((url) => {
        contentParts.push({ type: "image_url", image_url: { url } });
      });
    }

    newContextMessages.push({
      role: index % 2 === 0 ? "user" : "agent",
      content: contentParts,
    });

    calculatedLimit += msgObj.tokens ?? tokenize(msgObj.text);
  }

  calculatedLimit += tokenize(systemPrompt);
  
  return { newContextMessages, calculatedLimit };
};