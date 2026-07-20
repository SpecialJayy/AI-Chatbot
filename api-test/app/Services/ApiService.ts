import OpenAI from "openai"
interface loadingArgs {
    setIsLoading: (value:boolean)=>void
}

export class ApiService {
    private setIsLoading: (value: boolean) => void;

    constructor({ setIsLoading }: loadingArgs) {
        this.setIsLoading = setIsLoading;
    }

    async sendMessage(
        msg: string, 
        model: string, 
        onChunk: (text: string) => void,
        temperature:number,     
        system?: string | undefined,
    ): Promise<string> {
        this.setIsLoading(true);
    
        const messages: any[] = [];
        if (system) {
            messages.push({ role: 'system', content: system });
        }
        messages.push({ role: 'user', content: msg });

        try {
            
            const response = await fetch(`./api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    stream: true,
                    temperature: temperature,
                    thinking: false,
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();      
            let fullContent = "";

            if (reader) {
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                
                    buffer = lines.pop() || ""; 
                
                    for (const line of lines) {
                        if (line.trim() === "") continue;
                        try {
                            const parsed = JSON.parse(line);
                            if (parsed.message?.content) {
                                const newText = parsed.message.content;
                                fullContent += newText;
                                onChunk(newText);
                            }
                        } catch (e) {
                            console.error("Error parsing stream chunk", e, line);
                        }
                    }
                }
            
                if (buffer.trim() !== "") {
                    try {
                        const parsed = JSON.parse(buffer);
                        if (parsed.message?.content) {
                            fullContent += parsed.message.content;
                            onChunk(parsed.message.content);
                        }
                    } catch (e) {
                        console.error("Error parsing final chunk", e);
                    }
                }
            }           

                        return fullContent;

                    } catch (error) {
                        console.error("Failed to stream message:", error);
                        throw error; 
                    } finally {
                        this.setIsLoading(false);
                    }
                }

    async getModels(): Promise<string[]> {
        const headers = new Headers();
        headers.set("Content-Type", "application/json");

        const request = new Request("http://localhost:11434/api" + "/tags", {
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

    async getActiveModels(): Promise<string[]> {
        const headers = new Headers();
        headers.set("Content-Type", "application/json");

        const request = new Request("http://localhost:11434/api" + "/ps", {
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
}