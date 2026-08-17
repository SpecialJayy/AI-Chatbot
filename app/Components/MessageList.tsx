import React, { useEffect, useRef } from "react";
import { MessageBubble } from "../Config/Interfaces";
import { ChatBubble } from "./ChatBubble";

interface Props {
  chat: MessageBubble[];
  isLoading: boolean;
}

export const MessageList: React.FC<Props> = ({ chat, isLoading }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, isLoading]);

  return (
    <div className="flex w-full mb-32 max-w-3xl gap-2 flex-col">
      {chat.map((msgObj, i) => {
        const isAgent = i % 2 !== 0;
        const isWaitingForFirstChunk = isAgent && i === chat.length - 1 && isLoading && msgObj.text === "";

        return (
          <div key={i} className={`flex flex-col ${isAgent ? "items-start" : "items-end"} my-1`}>
            {/* Render User Uploaded Images */}
            {!isAgent && msgObj.imageUrls && msgObj.imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 justify-end">
                {msgObj.imageUrls.map((url, imgIdx) => (
                  <img
                    key={imgIdx}
                    src={url}
                    alt={`Uploaded ${imgIdx}`}
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
    </div>
  );
};