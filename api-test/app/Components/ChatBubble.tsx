interface ChatBubbleProps {
  text: React.ReactNode; 
  sender: "client" | "agent";
  timestamp?: string;
}

export function ChatBubble({ text, sender, timestamp }: ChatBubbleProps) {
  const isClient = sender === "client";

  return (
    <div className={`flex w-full ${isClient ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm flex flex-col gap-0.5
          ${
            isClient
              ? "bg-blue-600 text-white rounded-tr-none"
              : "bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 rounded-tl-none"
          }`}
      >
        <div className="break-words whitespace-pre-line">{text}</div>
        
        {timestamp && (
          <span className={`text-[10px] self-end mt-0.5 ${isClient ? "text-blue-200" : "text-slate-400"}`}>
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}