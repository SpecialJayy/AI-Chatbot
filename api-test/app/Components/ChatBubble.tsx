import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface ChatBubbleProps {
  text: React.ReactNode;
  sender: "client" | "agent";
  timestamp?: string;
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 overflow-hidden rounded-md bg-[#1e1e1e] text-left">
      <div className="flex items-center justify-between bg-zinc-800 px-4 py-1.5 text-xs text-zinc-300">
        <span className="uppercase select-none">{language || "text"}</span>
        <button
          onClick={handleCopy}
          className="hover:text-white transition-colors select-none"
        >
          {copied ? "Skopiowano!" : "Kopiuj kod"}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          background: "transparent",
          padding: "1rem",
          fontSize: "0.875rem",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export function ChatBubble({ text, sender, timestamp }: ChatBubbleProps) {
  const isClient = sender === "client";

  return (
    <div className={`flex w-full ${isClient ? "justify-end" : "justify-start"} mb-2`}>
      <div
        // Zwiększyłem lekko max-w (np. z 70% na 85%), aby bloki kodu lepiej wyglądały, 
        // ale możesz przywrócić max-w-[70%] jeśli wolisz.
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm flex flex-col gap-0.5
          ${
            isClient
              ? "bg-blue-600 text-white rounded-tr-none"
              : "bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 rounded-tl-none"
          }`}
      >
        {typeof text === "string" ? (
          <ReactMarkdown
            components={{
              // Nadpisujemy domyślne renderowanie tagu <code>
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                const codeString = String(children).replace(/\n$/, "");

                // Jeśli to blok kodu (nie inline) i ma określony język (lub po prostu znaczniki ```)
                if (!inline && match) {
                  return <CodeBlock language={match[1]} code={codeString} />;
                }
                
                // Jeśli ktoś wpisał kod bez języka, np. same ```
                if (!inline && !match) {
                    return <CodeBlock language="text" code={codeString} />;
                }

                // Renderowanie zwykłego kodu inline: `np. tak`
                return (
                  <code
                    className="bg-black/10 dark:bg-white/10 rounded px-1 py-0.5"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {text}
          </ReactMarkdown>
        ) : (
          <div className="break-words whitespace-pre-line">{text}</div>
        )}

        {timestamp && (
          <span
            className={`text-[10px] self-end mt-0.5 ${
              isClient ? "text-blue-200" : "text-slate-400"
            }`}
          >
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}