"use client";
import React, { useRef, useEffect, useCallback, useState } from "react";
import { ChatInput } from "./Components/ChatInput";
import { ApiService } from "./Services/ApiService";
import { ModelSelection } from "./Components/ModelSelection";
import { ActiveModels } from "./Components/ActiveModels";
import { ChatBubble } from "./Components/ChatBubble";
import { Settings } from "./Components/Settings";
import { ImageInput } from "./Components/ImageInput";
import { CONTEXT_METHOD } from "./Config/Enums";
import {
  ChatMessage,
  ImageContentPart,
  MessageBubble,
  TextContentPart,
} from "./Config/Interfaces";
import { ContextMonitor } from "./Components/ContextMonitor";
import { ModelCapabilities } from "./Config/Types";
import { Capability } from "./Components/Capability";

export default function Home() {
  const [msg, setMsg] = React.useState("");
  const [model, setModel] = React.useState("");
  const [modelCapabilities, setModelCapabilities] = React.useState<ModelCapabilities | "">("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [chat, setChat] = React.useState<MessageBubble[]>([]);

  const [context, setContext] = React.useState<ChatMessage[]>([]);
  const [contextLimit, setContextLimit] = React.useState(0);

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
        text: updatedChat[lastIndex].text + chunk,
      };

      return updatedChat;
    });
  };

  const sendMessage = async (
    messageToSend: string,
    currentModel: string,
    system?: string,
    images?: File[],
  ) => {
    let imageUrls: string[] = [];
    if (images && images.length > 0) {
      imageUrls = await Promise.all(
        images.map((file) => apiService.convertFileToBase64(file)),
      );
    }

    const newUserMsg = { text: messageToSend, imageUrls };
    const newAgentMsg = { text: "" };
    const updatedChat = [...chat, newUserMsg, newAgentMsg];

    setChat(updatedChat);

    const start = Date.now();

    const { newContextMessages, calculatedLimit } = await createContext(
      CONTEXT_METHOD.SLIDING_WINDOW,
      updatedChat,
    );

    console.log("Context sent to api", newContextMessages);

    const result = await apiService.sendMessage(
      messageToSend,
      currentModel,
      onChunk,
      temperature,
      system,
      images,
      newContextMessages,
    );

    const end = Date.now();
    const durationS = ((end - start) / 1000).toFixed(2) + "s";

    setChat((prev) => {
      if (prev.length < 2) return prev;
      const updated = [...prev];

      const userIndex = updated.length - 2;
      updated[userIndex] = {
        ...updated[userIndex],
        tokens: result?.usage?.prompt_tokens,
      };

      const agentIndex = updated.length - 1;
      updated[agentIndex] = {
        ...updated[agentIndex],
        timestamp: durationS,
        tokens: result?.usage?.completion_tokens,
      };

      return updated;
    });

    if (newContextMessages && calculatedLimit !== undefined) {
      setContext(newContextMessages);
      setContextLimit(calculatedLimit);
    }
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
      const imageFiles = filesArray.filter((file) =>
        file.type.startsWith("image/"),
      );

      if (imageFiles.length > 0) {
        setSelectedImages((prev) => [...prev, ...imageFiles]);
      }
    }
  }, []);

  const removeImage = (indexToRemove: number) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  useEffect(() => {
    if (msg.length > 50 || msg.includes("\n")) {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [msg]);

  const fetchCapabilities = async () => {
    try {
      const capabilities = await apiService.getModelCapabilities(model);
      setModelCapabilities(capabilities);
    } catch (error) {
      console.error("Failed to fetch capabilities:", error);
    }
  };
  
  const fetchDefaultTemperature = async () => {
    try {
      const temperature = await apiService.getModelDefaultTemperature(model);
      setTemperature(temperature);
    } catch (error) {
      console.error("Failed to fetch capabilities:", error);
    }
  };

  //on model change
  useEffect(() => {
    if (model) {
      fetchCapabilities();
      fetchDefaultTemperature();
    }
  }, [model]);

  const createContext = async (
    method: CONTEXT_METHOD,
    currentChat: MessageBubble[],
  ) => {
    const tempChat: MessageBubble[] = [];
    let calculatedLimit = 0;
    let newContextMessages: ChatMessage[] = [];

    switch (method) {
      case CONTEXT_METHOD.NONE:
        newContextMessages = [];
        break;
      case CONTEXT_METHOD.SLIDING_WINDOW:
        for (const [index, msgObj] of currentChat
          .slice(-parseInt(CONTEXT_METHOD.SLIDING_WINDOW as any))
          .entries()) {
          tempChat.push(msgObj);
        }
        break;
    }

    console.log("Temp Chat for context:", tempChat);

    for (const [index, msgObj] of tempChat.entries()) {
      const contentParts: (TextContentPart | ImageContentPart)[] = [
        {
          type: "text",
          text: msgObj.text,
        },
      ];

      if (msgObj.imageUrls && msgObj.imageUrls.length > 0) {
        for (const url of msgObj.imageUrls) {
          contentParts.push({
            type: "image_url",
            image_url: { url },
          });
        }
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

  const tokenize = (text: string): number => {
    return Math.ceil(text.length / 3);
  };

  const isVision = () => {
    return (
      typeof modelCapabilities === "object" &&
      modelCapabilities !== null &&
      modelCapabilities.vision === true
    );
  };

  return (
    <div
      className="overflow-auto flex flex-col-reverse h-screen"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <img
        src={"favicon.ico"}
        className="fixed top-0 left-0 w-10 m-3 select-none pointer-events-none"
        draggable={false}
      />

      <div className="flex flex-col flex-1 items-center justify-end min-h-screen font-sans dark:from-zinc-950 dark:to-zinc-900 gap-8 p-6">
        <ActiveModels apiService={apiService} />

        <div className="flex w-full mb-32 max-w-3xl gap-2 flex-col">
          {chat.map((msgObj, i) => {
            const isAgent = i % 2 !== 0;
            const isLastElement = i === chat.length - 1;
            const isWaitingForFirstChunk =
              isAgent && isLastElement && isLoading && msgObj.text === "";

            return (
              <div
                key={i}
                className={`flex flex-col ${isAgent ? "items-start" : "items-end"} my-1`}
              >
                {!isAgent &&
                  msgObj.imageUrls &&
                  msgObj.imageUrls.length > 0 && (
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
          })}
          <div ref={chatEndRef} />
          <Settings
            sliderValue={temperature}
            setSliderValue={setTemperature}
            systemPrompt={systemPrompt}
            setSystemPrompt={setSystemPrompt}
          />
        </div>

        {/* Bottom Section */}
        <div className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-[1fr_auto_1fr] items-end w-full max-w-7xl p-3 mx-auto">
          {/* Model capabilities (Left Column - right aligned so it hugs the center bar) */}
          <div className="flex flex-row items-center gap-2 shrink-0 mb-2 justify-self-end pr-3">
            {typeof modelCapabilities === "object" &&
              Object.entries(modelCapabilities)
                .filter(([_, value]) => value)
                .map(([key]) => <Capability key={key} capability={key} />)}
          </div>

          {/* Whole bar (Center Column - guarantees absolute screen centering) */}
          <div className="flex flex-col gap-3 w-[768px] shrink-0 justify-self-center p-3 rounded-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-white/20 dark:border-zinc-800/50 shadow-xl shadow-slate-200/50 dark:shadow-none">
            {/* Images */}
            {selectedImages.length > 0 && (
              <div className="flex gap-3 px-1 py-2 overflow-x-auto w-full border-b border-slate-100 dark:border-zinc-800/50 mb-1">
                {selectedImages.map((file, idx) => (
                  <div key={idx} className="relative group shrink-0">
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md transition-transform active:scale-95 z-10"
                      aria-label="Remove image"
                    >
                      <svg
                        xmlns="http://w3.org"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-3.5 h-3.5"
                      >
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

            {/* Input Bar */}
            <div
              className={`transition-all duration-200 w-full flex ${
                isExpanded ? "flex-col gap-3" : "flex-row items-center gap-2"
              }`}
            >
              {/* Input Field (Stays on top when expanded) */}
              <div
                className={`w-full ${isExpanded ? "order-1" : "order-2 flex-1 min-w-0"}`}
              >
                <ChatInput
                  msg={msg}
                  setMsg={setMsg}
                  onSubmit={handleTriggerSubmit}
                />
              </div>

              {/* Bottom Action Row (Combines model selection and buttons inline when expanded) */}
              <div
                className={
                  isExpanded
                    ? "order-2 flex items-center justify-between w-full gap-2"
                    : "contents"
                }
              >
                {/* Model Selection */}
                <div
                  className={`flex items-center gap-2 ${!isExpanded ? "order-1" : ""}`}
                >
                  <ModelSelection
                    model={model}
                    setModel={setModel}
                    apiService={apiService}
                  />
                </div>

                {/* Buttons (Image Input & Submit) */}
                <div
                  className={`flex items-center gap-2 ${!isExpanded ? "order-3" : ""}`}
                >
                  <ImageInput
                    onFileSelect={(file) => {
                      setSelectedImages((prev) => [...prev, file]);
                    }}
                    disabled={!isVision()}
                  />
                  <button
                    className="w-min flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-5 rounded-xl shadow-lg shadow-blue-500/20 dark:shadow-none transition-all duration-200 active:scale-[0.98] hover:cursor-pointer disabled:opacity-50"
                    onClick={handleTriggerSubmit}
                    disabled={isLoading || !msg.trim()}
                  >
                    <svg
                      xmlns="http://w3.org"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-arrow-up"
                      viewBox="0 0 16 16"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Context monitor (Right Column - left aligned to stay next to center bar) */}
          <div className="shrink-0 mb-2 justify-self-start pl-3">
            <ContextMonitor context={contextLimit} />
          </div>
        </div>
      </div>
    </div>
  );
}