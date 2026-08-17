"use client";
import { useEffect, useState, useMemo } from "react";
import { ApiService } from "./Services/ApiService";
import { CONTEXT_METHOD } from "./Config/Enums";
import { MessageBubble } from "./Config/Interfaces";
import { ModelCapabilities } from "./Config/Types";

// Components
import { ChatInput } from "./Components/ChatInput";
import { ModelSelection } from "./Components/ModelSelection";
import { ActiveModels } from "./Components/ActiveModels";
import { Settings } from "./Components/Settings";
import { ImageInput } from "./Components/ImageInput";
import { ContextMonitor } from "./Components/ContextMonitor";
import { Capability } from "./Components/Capability";
import { MessageList } from "./Components/MessageList";

// Utils & Hooks
import { createContext } from "./Services/ChatService";
import { useImageUpload } from "./Services/ImageUploadService";

export default function Home() {
  // 1. Core State
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState<MessageBubble[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contextLimit, setContextLimit] = useState(0);

  // 2. Settings & Model State
  const [model, setModel] = useState("");
  const [modelCapabilities, setModelCapabilities] = useState<ModelCapabilities | "">("");
  const [temperature, setTemperature] = useState(1);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [jsonSchema, setJsonSchema] = useState("");

  const apiService = useMemo(() => new ApiService({ setIsLoading }), []);
  const { selectedImages, setSelectedImages, handleDragOver, handleDrop, removeImage, clearImages } = useImageUpload();

  const isExpanded = msg.length > 50 || msg.includes("\n");
  const isVisionEnabled = typeof modelCapabilities === "object" && modelCapabilities?.vision === true;

  // 3. Effects
  useEffect(() => {
    if (!model) return;

    // Fetch capabilities and default temperature seamlessly 
    apiService.getModelCapabilities(model).then(setModelCapabilities).catch(console.error);
    apiService.getModelDefaultTemperature(model).then(setTemperature).catch(console.error);
  }, [model, apiService]);

  // 4. Chat Handlers
  const handleChunk = (chunk: string) => {
    setChat((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const last = updated.length - 1;
      updated[last] = { ...updated[last], text: updated[last].text + chunk };
      return updated;
    });
  };

  const handleSendMessage = async () => {
    if (!msg.trim() || isLoading) return;

    // 2. Prepare User Message (Image conversion, etc.)
    const imageUrls = selectedImages.length > 0
      ? await Promise.all(selectedImages.map((file) => apiService.convertFileToBase64(file)))
      : [];

    const updatedChat = [...chat, { text: msg, imageUrls }, { text: "" }];
    setChat(updatedChat);
    setMsg("");
    clearImages();

    // 3. Create Context & Send Request
    const start = Date.now();
    const { newContextMessages, calculatedLimit } = createContext(CONTEXT_METHOD.SLIDING_WINDOW, updatedChat, systemPrompt);
    setContextLimit(calculatedLimit);

    try {
      // Pass the PARSED schema, not the string
      const result = await apiService.sendMessage(
        msg, model, handleChunk, temperature, systemPrompt, selectedImages, newContextMessages
      );

      const durationS = ((Date.now() - start) / 1000).toFixed(2) + "s";
      setChat((prev) => {
        const updated = [...prev];
        if (updated.length >= 2) {
          updated[updated.length - 2].tokens = result?.usage?.prompt_tokens;
          updated[updated.length - 1].timestamp = durationS;
          updated[updated.length - 1].tokens = result?.usage?.completion_tokens;
        }
        return updated;
      });
    } catch (apiError) {
      console.error("API Error:", apiError);
    }
  };

  // 5. Render
  return (
    <div className="overflow-auto flex flex-col-reverse h-screen" onDragOver={handleDragOver} onDrop={handleDrop}>
      <img src={"favicon.ico"} className="fixed top-0 left-0 w-10 m-3 select-none pointer-events-none" draggable={false} alt="logo" />

      <div className="flex flex-col flex-1 items-center justify-end min-h-screen font-sans dark:from-zinc-950 dark:to-zinc-900 gap-8 p-6">
        <ActiveModels apiService={apiService} />

        {/* Chat Area */}
        <MessageList chat={chat} isLoading={isLoading} />
        <Settings
          sliderValue={temperature} setSliderValue={setTemperature}
          systemPrompt={systemPrompt} setSystemPrompt={setSystemPrompt}
          jsonSchema={jsonSchema} setJsonSchema={setJsonSchema}
        />

        {/* Bottom Input Area */}
        <div className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-[1fr_auto_1fr] items-end w-full max-w-7xl p-3 mx-auto">

          {/* Capabilities */}
          <div className="flex flex-row items-center gap-2 shrink-0 mb-2 justify-self-end pr-3">
            {typeof modelCapabilities === "object" && Object.entries(modelCapabilities)
              .filter(([_, value]) => value)
              .map(([key]) => <Capability key={key} capability={key} />)}
          </div>

          {/* Main Input Wrapper */}
          <div className="flex flex-col gap-3 w-[768px] shrink-0 justify-self-center p-3 rounded-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-white/20 dark:border-zinc-800/50 shadow-xl shadow-slate-200/50 dark:shadow-none">

            {/* Selected Images Preview */}
            {selectedImages.length > 0 && (
              <div className="flex gap-3 px-1 py-2 overflow-x-auto w-full border-b border-slate-100 dark:border-zinc-800/50 mb-1">
                {selectedImages.map((file, idx) => (
                  <div key={idx} className="relative group shrink-0">
                    <button onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md z-10">✕</button>
                    <img src={URL.createObjectURL(file)} alt={`Selected ${idx}`} className="w-16 h-16 object-cover rounded-xl border-2 border-slate-200 dark:border-zinc-700 shadow-sm" />
                  </div>
                ))}
              </div>
            )}

            {/* Input & Controls */}
            <div className={`transition-all duration-200 w-full flex ${isExpanded ? "flex-col gap-3" : "flex-row items-center gap-2"}`}>
              <div className={`w-full ${isExpanded ? "order-1" : "order-2 flex-1 min-w-0"}`}>
                <ChatInput msg={msg} setMsg={setMsg} onSubmit={handleSendMessage} />
              </div>

              <div className={isExpanded ? "order-2 flex items-center justify-between w-full gap-2" : "contents"}>
                <div className={`flex items-center gap-2 ${!isExpanded ? "order-1" : ""}`}>
                  <ModelSelection model={model} setModel={setModel} apiService={apiService} />
                </div>

                <div className={`flex items-center gap-2 ${!isExpanded ? "order-3" : ""}`}>
                  <ImageInput onFileSelect={(file) => setSelectedImages((prev) => [...prev, file])} disabled={!isVisionEnabled} />

                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !msg.trim()}
                    className="w-min flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-5 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <svg xmlns="http://w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path fillRule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Context Monitor */}
          <div className="shrink-0 mb-2 justify-self-start pl-3">
            <ContextMonitor context={contextLimit} />
          </div>

        </div>
      </div>
    </div>
  );
}