import { useState, useEffect, useRef } from 'react';
import { KalimatBerarti } from './KalimatBerarti';

interface SoalKetikProps {
  prompt: string;
  newWords?: { word: string; meaning: string }[];
  glossary?: Record<string, string>;
  onAnswerChange: (answer: string) => void;
  onEnter: () => void;
}

export function SoalKetik({ prompt, newWords, glossary, onAnswerChange, onEnter }: SoalKetikProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue('');
    onAnswerChange('');
    inputRef.current?.focus();
  }, [prompt]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    onAnswerChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <div className="flex items-start">
        <KalimatBerarti kalimat={prompt} newWords={newWords} glossary={glossary} />
      </div>
      
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Ketik jawabanmu di sini..."
        className="w-full min-h-[120px] p-4 text-lg font-space border-[3px] border-black rounded-xl shadow-[4px_4px_0_#111] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)] resize-none"
      />
    </div>
  );
}
