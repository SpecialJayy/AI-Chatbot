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
          className="hover:text-white transition-colors select-none cursor-pointer"
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

export function ChatBubble({ text, sender, timestamp}: ChatBubbleProps) {
  const isClient = sender === "client";

  return (
    <div className={`flex w-full ${isClient ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`px-4 py-2.5 text-sm flex flex-col gap-0.5 ${
          isClient
            ? "max-w-[85%] bg-blue-600 text-white rounded-2xl rounded-tr-none shadow-sm "
            : "w-full bg-transparent text-slate-800 dark:text-zinc-100 px-0"
        }`}
      >
        {typeof text === "string" ? (
          <div className="prose dark:prose-invert max-w-none text-sm [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>h1]:text-xl [&>h1]:font-bold [&>h2]:text-lg [&>h2]:font-bold [&>h3]:text-base [&>h3]:font-bold">
          <ReactMarkdown
            components={{
              p({ children }) {
                return <span className="block">{children}</span>;
              },
              code({ className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                const codeString = String(children).replace(/\n$/, "");
              
                const hasNewlines = codeString.includes("\n");
                const isBlock = match || hasNewlines;
              
                if (isBlock) {
                  return (
                    <CodeBlock
                      language={match ? match[1] : "text"}
                      code={codeString}
                    />
                  );
                }
              
                return (
                  <code
                    className="bg-black/10 dark:bg-white/10 rounded px-1.5 py-0.5 text-xs font-mono inline"
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
          </div>
        ) : (
          <div className="break-words whitespace-pre-line">{text}</div>
        )}

        {
        (timestamp !== undefined) && (
          <span className={`text-[10px] self-end mt-0.5 text-slate-400`}>
            {timestamp}
          </span>
        )
      }
      </div>
    </div>
  );
}