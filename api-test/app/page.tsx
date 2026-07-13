"use client"
import React, { useRef, useEffect } from "react"; // 1. Dodano importy
import { ChatInput } from "./Components/ChatInput";
import { ApiService } from "./Services/ApiService";
import { ModelSelection } from "./Components/ModelSelection";
import { ActiveModels } from "./Components/ActiveModels";
import { ChatBubble } from "./Components/ChatBubble";
import { Settings } from "./Components/Settings";
import { options } from "./Config/Config";

export default function Home() {
  const [msg, setMsg] = React.useState("");
  const [model, setModel] = React.useState("llama3.2:3b");
  const [isLoading, setIsLoading] = React.useState(false);
  const [chat, setChat] = React.useState<string[]>([])
  const [temperature, setTemperature] = React.useState(1);

  // 2. Tworzymy referencję do dołu czatu
  const chatEndRef = useRef<HTMLDivElement>(null);

  const apiService = React.useMemo(() => new ApiService({ setIsLoading }), []);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // 3. useEffect uruchamiający przewijanie po każdej zmianie w czacie
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, isLoading]); // Reaguje na nowe wiadomości oraz na efekt "Thinking..."

  const setAnswer = (textOrFn: string | ((prev: string) => string)) => {
   setChat((prevChat) => {
     if (prevChat.length === 0) return prevChat;
     
     const updatedChat = [...prevChat];
     const lastIndex = updatedChat.length - 1;

     if (typeof textOrFn === "function") {
       updatedChat[lastIndex] = textOrFn(updatedChat[lastIndex]);
     } else {
       updatedChat[lastIndex] = textOrFn;
     }
     
     return updatedChat;
   });
  };

  const animateText = async (message: string) => {
    setAnswer(""); 
    for (const char of message) {
      setAnswer((prev) => prev + char);
      await delay(15); 
    }
  };

  const sendMessage = async (messageToSend: string, currentModel: string) => {
    setChat((chat) => [...chat, messageToSend]);
    setChat((chat) => [...chat, ""])

    const start = Date.now();

    const options: options = {
      "temperature":temperature,
    }

    let res = await apiService.sendMessage(messageToSend, currentModel,options); 
    const end = Date.now();
    const ans = `${res}\n\nwykonano w: ${(end - start) / 1000}s`;
    
    await animateText(ans);
  };

  const handleTriggerSubmit = () => {
    if (!msg.trim() || isLoading) return;
    sendMessage(msg, model);
    setMsg("");
  };

  return (
    <div className="overflow-auto flex flex-col-reverse">
    <div className="flex flex-col flex-1 items-center justify-end min-h-screen bg-gradient-to-br from-slate-500 to-slate-100 font-sans dark:from-zinc-950 dark:to-zinc-900 gap-8 p-6">

      <ActiveModels apiService={apiService}/>

      <div className="flex w-full mb-20 max-w-3xl gap-2 flex-col"> 
        {
          chat.map((message, i) => {
            const isAgent = i % 2 !== 0;
            const isLastElement = i === chat.length - 1;
            // USUNIĘTO: stary document.body.scrollTop stąd
            return (
              <ChatBubble 
                key={i}
                sender={isAgent ? "agent" : "client"} 
                text={
                  isAgent && isLastElement && isLoading && message === "" ? (
                    <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-400 py-1">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                      <span>Thinking...</span>
                    </div>
                  ) : (
                    message
                  )
                }
              />
            );
          })
        }
        <div ref={chatEndRef} />
        <Settings sliderValue={temperature} setSliderValue={setTemperature}/>
      </div>

      <div className="fixed bottom-0 m-2 flex flex-cols sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-3xl p-3 rounded-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-white/20 dark:border-zinc-800/50 shadow-xl shadow-slate-200/50 dark:shadow-none">
        <ModelSelection model={model} setModel={setModel} apiService={apiService}/>
        <ChatInput msg={msg} setMsg={setMsg} onSubmit={handleTriggerSubmit} />
        <button
          className="flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-5 rounded-xl shadow-lg shadow-blue-500/20 dark:shadow-none transition-all duration-200 active:scale-[0.98] hover:cursor-pointer disabled:opacity-50"
          onClick={handleTriggerSubmit}
          disabled={isLoading || !msg.trim()}
        >
          Send
        </button>
      </div>
    </div>
    </div>
  );
}