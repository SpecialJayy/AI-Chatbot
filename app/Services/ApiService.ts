import { ChatMessage, ImageContentPart, loadingArgs, OllamaModel } from "../Config/Interfaces";
import { MessageContent } from "../Config/Types";

export class ApiService {
    private setIsLoading: (value: boolean) => void;

    constructor({ setIsLoading }: loadingArgs) {
        this.setIsLoading = setIsLoading;
    }

    // Main entry point orchestrating the chat request pipeline.
    async sendMessage(
        msg: string, 
        model: string, 
        onChunk: (text: string) => void,
        temperature: number,     
        system?: string,
        images?: File[],
        context?: ChatMessage[]
    ): Promise<{ content: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
        this.setIsLoading(true);

        try {
            const b64Images = await this.processImages(images);
            const messages = this.buildMessagePayload(msg, system, b64Images, context);
            const response = await this.fetchChatResponse(model, messages, b64Images, temperature);
            
            return await this.processStream(response, onChunk);
        } catch (error) {
            console.error("Failed to stream message:", error);
            throw error; 
        } finally {
            this.setIsLoading(false);
        }
    }

    // Converts an array of File objects into Base64 strings concurrently.
    private async processImages(images?: File[]): Promise<string[]> {
        if (!images || images.length === 0) return [];
        return Promise.all(images.map(img => this.convertFileToBase64(img)));
    }

    // Constructs the ordered message array required by the API.
    private buildMessagePayload(msg: string, system?: string, b64Images?: string[], context?: ChatMessage[]): any[] {
        const messages: any[] = [];
        
        if (system) messages.push({ role: 'system', content: system });
        if (context) messages.push(...context);

        let content: MessageContent = msg;

        // Formats the message content to include base64 images if they exist.
        if (b64Images && b64Images.length > 0) {
            content = [
                { type: "text", text: msg },
                ...b64Images.map((img): ImageContentPart => ({
                    type: "image_url",
                    image_url: { url: img }
                }))
            ];
        }

        messages.push({ role: "user", content });
        return messages;
    }

    // Initiates the POST request to the chat API endpoint.
    private async fetchChatResponse(model: string, messages: any[], b64Images: string[], temperature: number): Promise<Response> {
        const response = await fetch(`./api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                messages,
                stream: true,
                temperature,
                thinking: false,
                images: b64Images,
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
    }

    // Reads and parses the response stream, firing callbacks for chunks and logging usage.
    private async processStream(response: Response, onChunk: (text: string) => void): Promise<{ content: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
        const reader = response.body?.getReader();
        if (!reader) return { content: "", usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } };

        const decoder = new TextDecoder();      
        let fullContent = "";
        let buffer = "";
        const usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
        
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; 
        
            for (const line of lines) {
                if (line.trim() === "") continue;
                const maybeUsage = this.parseStreamLine(line, onChunk, (newText) => fullContent += newText);
                if (maybeUsage) {
                    usage.prompt_tokens = maybeUsage.prompt_tokens ?? usage.prompt_tokens;
                    usage.completion_tokens = maybeUsage.completion_tokens ?? usage.completion_tokens;
                    usage.total_tokens = maybeUsage.total_tokens ?? usage.total_tokens;
                }
            }
        }
    
        // Handles any remaining data left in the buffer after the stream closes.
        if (buffer.trim() !== "") {
            const maybeUsage = this.parseStreamLine(buffer, onChunk, (newText) => fullContent += newText);
            if (maybeUsage) {
                usage.prompt_tokens = maybeUsage.prompt_tokens ?? usage.prompt_tokens;
                usage.completion_tokens = maybeUsage.completion_tokens ?? usage.completion_tokens;
                usage.total_tokens = maybeUsage.total_tokens ?? usage.total_tokens;
            }
        }

        return { content: fullContent, usage };
    }

    // Safely parses a single line of the JSON stream to extract content or usage data.
    private parseStreamLine(line: string, onChunk: (text: string) => void, appendContent: (text: string) => void): { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined {
        try {
            const parsed = JSON.parse(line);

            if (parsed.message?.content) {
                const newText = parsed.message.content;
                appendContent(newText);
                onChunk(newText);
            }

            if (parsed.usage) {
                return {
                    prompt_tokens: parsed.usage.prompt_tokens,
                    completion_tokens: parsed.usage.completion_tokens,
                    total_tokens: parsed.usage.total_tokens,
                };
            }

        } catch (e) {
            console.error("Error parsing stream chunk", e, line);
        }
        return undefined;
    }

    async getModels(): Promise<OllamaModel[]> {
        try {
          const res = await fetch("http://localhost:11434/api/tags", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          if (!res.ok) throw new Error(`Network error: ${res.status}`);
          const data = await res.json();
          return data.models || [];
        } catch (err) {
          console.error(`Fetch issue: ${err}`);
          return [];
        }
      }

    async getActiveModels(): Promise<string[]> {
        const headers = new Headers();
        headers.set("Content-Type", "application/json");

        const request = new Request("http://localhost:11434/api/ps", {
            method: "GET",
            headers: headers,
        });

        return fetch(request)
            .then(res => {
                if (!res.ok) throw new Error(`Network error: ${res.status}`);
                return res.json();
            })
            .then(res => res.models)
            .catch(err => {
                console.error(`Fetch issue: ${err}`);
                return [];
            });
    }

    // Promisified FileReader to convert a file to a Base64 encoded string.
    public convertFileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          resolve(reader.result as string);
        };

        reader.onerror = (error) => {
          reject(error);
        };

        reader.readAsDataURL(file);
      });
    };
}