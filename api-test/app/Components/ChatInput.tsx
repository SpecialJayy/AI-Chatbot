'use client'
import React, { useEffect, useRef } from "react";

interface ChatInputProps {
  msg: string;
  setMsg: (value: string) => void;
  onSubmit: () => void;
}

export function ChatInput({ msg, setMsg, onSubmit }: ChatInputProps){

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMsg(e.target.value);

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; 
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`; 
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault(); 
    onSubmit();
    };
   }

    useEffect(() => {
      if (!msg && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }, [msg]);

    return(
    <textarea
        ref={textareaRef}
        className="flex-1 min-w-0 bg-transparent text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 text-sm py-3 px-2 resize-none focus:outline-none overflow-y-auto max-h-[200px]"
        placeholder="Type here..."
        value={msg}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        rows={1} 
      />
    );
}