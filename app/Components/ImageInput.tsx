import React from 'react';

export interface ImageInputProps {
    onFileSelect?: (file: File) => void;
    disabled?: boolean;
}

export function ImageInput({ onFileSelect, disabled }: ImageInputProps) {
  const handleFileChange = (e : React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target) return;
    const file = e.target.files ? e.target.files[0] : null;
    if (file && onFileSelect) {

      onFileSelect(file);
    }
  };

  return (
    <label
      className={`
        flex items-center justify-center p-3 rounded-xl cursor-pointer
        hover:bg-slate-200 text-slate-600
        dark:hover:bg-zinc-700 dark:text-zinc-300
        transition-all duration-200 active:scale-[0.98]
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
      title="Upload Image"
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    </label>
  );
}