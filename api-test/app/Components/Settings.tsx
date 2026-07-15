'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie'; 

interface SettingsProps {
  sliderValue: number;
  setSliderValue: (value: number) => void;

  systemPrompt: string;
  setSystemPrompt: (value: string) => void;
}

export function Settings({
  sliderValue,
  setSliderValue,
  systemPrompt,
  setSystemPrompt
}: SettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedPrompt = Cookies.get('system_prompt');
    if (savedPrompt) {
      setSystemPrompt(savedPrompt);
    }
  }, [setSystemPrompt]);

  //TODO: change that for a save button
  const handlePromptChange = (value: string) => {
    setSystemPrompt(value);
    Cookies.set('system_prompt', value, { expires: 7, sameSite: 'strict' });
  };

  return (
    <div className="fixed right-0 bottom-0 m-3 text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Ustawienia"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.754c-.29.218-.437.57-.394.925.006.048.01.096.01.145 0 .048-.004.096-.01.145-.043.355.104.707.394.925l1.003.754a1.125 1.125 0 0 1 .26 1.43l-1.296 2.247a1.125 1.125 0 0 1-1.37.49l-1.216-.456a1.125 1.125 0 0 0-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281a1.125 1.125 0 0 0-.646-.87a6.555 6.555 0 0 1-.22-.127a1.125 1.125 0 0 0-1.074-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.43l1.003-.754c.29-.218.437-.57.394-.925a3.48 3.48 0 0 1-.01-.145c0-.048.004-.096.01-.145.043-.355-.104-.707-.394-.925l-1.003-.754a1.125 1.125 0 0 1-.26-1.43l1.296-2.247a1.125 1.125 0 0 1 1.37-.49l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      </button>

      {/* Menu rozwijane */}
      {isOpen && (
        <div className="absolute right-full bottom-0 mr-3 w-64 origin-bottom-right rounded-2xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-md p-4 shadow-xl border border-gray-100 dark:border-gray-800/60 focus:outline-none transition-all">
          <div className="space-y-4">
            {/* Nagłówek menu */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Model Settings
              </h3>
            </div>

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* Kontrolka 1: Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-300">
                <span>Temperature</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{sliderValue}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500 focus:outline-none"
              />
            </div>

            {/* Kontrolka 2: Textarea (System Prompt) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block">
                System Prompt 
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-sm bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y min-h-[80px]"
                placeholder="Type your system prompt here..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}