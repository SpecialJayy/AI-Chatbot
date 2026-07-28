"use client"
import React, { useRef, useEffect, useCallback } from "react"; 
import { ChatInput } from "./Components/ChatInput";
import { ApiService } from "./Services/ApiService";
import { ModelSelection } from "./Components/ModelSelection";
import { ActiveModels } from "./Components/ActiveModels";
import { ChatBubble } from "./Components/ChatBubble";
import { Settings } from "./Components/Settings";
import { ImageInput } from "./Components/ImageInput";

interface ChatMessage {
  text: string;
  timestamp?: string; 
  imageUrls?: string[];
}

export default function Home() {
  const [msg, setMsg] = React.useState("");
  const [model, setModel] = React.useState("llama3.2:3b");
  const [isLoading, setIsLoading] = React.useState(false);
  
  const [chat, setChat] = React.useState<ChatMessage[]>([]);
  
  const [temperature, setTemperature] = React.useState(1);
  const [systemPrompt, setSystemPrompt] = React.useState("");
  const [selectedImages, setSelectedImages] = React.useState<File[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const apiService = React.useMemo(() => new ApiService({ setIsLoading }), []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, isLoading]); 

  const onChunk = (chunk: string) => {
    setChat((prevChat) => {
      if (prevChat.length === 0) return prevChat;

      const updatedChat = [...prevChat];
      const lastIndex = updatedChat.length - 1;
    
      updatedChat[lastIndex] = {
        ...updatedChat[lastIndex],
        text: updatedChat[lastIndex].text + chunk
      };
      
      return updatedChat;
    });
  };

  const sendMessage = async (messageToSend: string, currentModel: string, system?: string, images?: File[]) => {
    const imageUrls = images ? images.map((file) => URL.createObjectURL(file)) : [];

    setChat((prev) => [...prev, { text: messageToSend, imageUrls }]);
    setChat((prev) => [...prev, { text: "" }]);

    const start = Date.now();

    await apiService.sendMessage(messageToSend, currentModel, onChunk, temperature, system, images); 

    const end = Date.now();
    const durationS = ((end - start) / 1000).toFixed(2) + "s";

    setChat((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        timestamp: durationS
      };
      return updated;
    });
  };

  const handleTriggerSubmit = () => {
    if (!msg.trim() || isLoading) return;
    sendMessage(msg, model, systemPrompt, selectedImages);
    setMsg("");
    setSelectedImages([]);
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      const imageFiles = filesArray.filter(file => file.type.startsWith("image/"));
      
      if (imageFiles.length > 0) {
        setSelectedImages(prev => [...prev, ...imageFiles]);
      }
    }
  }, []);

  const removeImage = (indexToRemove: number) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div 
      className="overflow-auto flex flex-col-reverse h-screen"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <img src={"favicon.ico"} className="fixed top-0 left-0 w-10 m-3 select-none pointer-events-none" draggable={false}/>
      
      <div className="flex flex-col flex-1 items-center justify-end min-h-screen font-sans dark:from-zinc-950 dark:to-zinc-900 gap-8 p-6">
        
        <ActiveModels apiService={apiService}/>

        <div className="flex w-full mb-32 max-w-3xl gap-2 flex-col"> 
          {
            chat.map((msgObj, i) => {
              const isAgent = i % 2 !== 0;
              const isLastElement = i === chat.length - 1;
              const isWaitingForFirstChunk = isAgent && isLastElement && isLoading && msgObj.text === "";

              return (
                <div key={i} className={`flex flex-col ${isAgent ? "items-start" : "items-end"} my-1`}>
                  {!isAgent && msgObj.imageUrls && msgObj.imageUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 justify-end">
                      {msgObj.imageUrls.map((url, imgIdx) => (
                        <img 
                          key={imgIdx} 
                          src={url} 
                          alt={`Uploaded content ${imgIdx}`} 
                          className="max-w-[200px] max-h-[200px] object-cover rounded-2xl border border-slate-300 dark:border-zinc-700 shadow-sm"
                        />
                      ))}
                    </div>
                  )}

                  <ChatBubble 
                    sender={isAgent ? "agent" : "client"} 
                    timestamp={msgObj.timestamp} 
                    text={
                      isWaitingForFirstChunk ? (
                        <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-400 py-1">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </span>
                          <span>Thinking...</span>
                        </div>
                      ) : (
                        msgObj.text
                      )
                    }
                  />
                </div>
              );
            })
          }
          <div ref={chatEndRef} />
          <Settings sliderValue={temperature} setSliderValue={setTemperature} systemPrompt={systemPrompt} setSystemPrompt={setSystemPrompt}/>
        </div>

        <div className="fixed bottom-0 m-2 flex flex-col gap-3 w-full max-w-3xl p-3 rounded-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-white/20 dark:border-zinc-800/50 shadow-xl shadow-slate-200/50 dark:shadow-none">
          
          {selectedImages.length > 0 && (
            <div className="flex gap-3 px-1 py-2 overflow-x-auto">
              {selectedImages.map((file, idx) => (
                <div key={idx} className="relative group shrink-0">
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md transition-transform active:scale-95 z-10"
                    aria-label="Remove image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  </button>
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Selected ${idx}`}
                    className="w-16 h-16 object-cover rounded-xl border-2 border-slate-200 dark:border-zinc-700 shadow-sm"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
            <ModelSelection model={model} setModel={setModel} apiService={apiService}/>
            <ChatInput msg={msg} setMsg={setMsg} onSubmit={handleTriggerSubmit} />
            <ImageInput onFileSelect={(file) => {
              setSelectedImages((prev) => [...prev, file]);
            }}/>
            <button
              className="w-min flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-5 rounded-xl shadow-lg shadow-blue-500/20 dark:shadow-none transition-all duration-200 active:scale-[0.98] hover:cursor-pointer disabled:opacity-50"
              onClick={handleTriggerSubmit}
              disabled={isLoading || !msg.trim()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-up" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5"/>
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}