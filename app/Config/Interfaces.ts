import { MessageContent } from "./Types";

export interface ChatMessage {
  role: "user" | "agent" | "system";
  content: MessageContent;
}

export interface loadingArgs {
    setIsLoading: (value:boolean)=>void
}
export interface TextContentPart {
  type: "text";
  text: string;
}

export interface ImageContentPart {
  type: "image_url";
  image_url: {
    url: string; 
  };
}

export interface MessageBubble {
  text: string;
  timestamp?: string; 
  imageUrls?: string[];
  tokens?: number;
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: Record<string, any>;
}