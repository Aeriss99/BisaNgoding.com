import { useState, useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { KalimatBerarti } from './KalimatBerarti';
import { ucapkan, hentikanSuara } from '../../lib/suara';

interface SoalKetikProps {
  prompt: string;
  /** en-id = kalimat soal berbahasa Inggris, jadi ada tombol untuk mendengarnya. */
  direction?: 'en-id' | 'id-en';
  newWords?: { word: string; meaning: string }[];
  glossary?: Record<string, string>;
  onAnswerChange: (answer: string) => void;
  onEnter: () => void;
}

export function SoalKetik({ prompt, direction, newWords, glossary, onAnswerChange, onEnter }: SoalKetikProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue('');
    onAnswerChange('');
    inputRef.current?.focus();
    return () => hentikanSuara();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <p className="font-space font-bold text-lg">
        {direction === 'id-en' ? 'Tulis dalam bahasa Inggris' : 'Tulis artinya dalam bahasa Indonesia'}
      </p>
      <div className="flex items-start gap-3">
        {direction === 'en-id' && (
          <button
            type="button"
            onClick={() => void ucapkan(prompt)}
            aria-label="Dengarkan kalimat"
            className="mt-1 w-10 h-10 bg-[var(--color-primary)] border-[3px] border-black rounded-xl flex items-center justify-center text-black hover:bg-[var(--color-accent)] transition-colors shrink-0 shadow-[2px_2px_0_#111]"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        )}
        <KalimatBerarti kalimat={prompt} newWords={newWords} glossary={glossary} />
      </div>

      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Ketik jawabanmu di sini..."
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className="w-full min-h-[120px] p-4 text-lg font-space border-[3px] border-black rounded-xl shadow-[4px_4px_0_#111] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)] resize-none"
      />
    </div>
  );
}
