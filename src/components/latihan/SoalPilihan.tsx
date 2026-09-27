import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface SoalPilihanProps {
  question: string;
  options: string[];
  onSelect: (index: number | null) => void;
}

export function SoalPilihan({ question, options, onSelect }: SoalPilihanProps) {
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    setSelected(null);
    onSelect(null);
  }, [question]);

  const handleSelect = (idx: number) => {
    setSelected(idx);
    onSelect(idx);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <div className="text-xl font-bold font-space prose prose-p:my-0">
        <ReactMarkdown>{question}</ReactMarkdown>
      </div>

      <div className="flex flex-col gap-3">
        {options.map((opt, i) => {
          const isSelected = selected === i;
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`flex items-center min-h-[44px] p-4 font-space font-bold text-left border-[3px] border-black rounded-xl transition-all shadow-[4px_4px_0_#111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#111] ${
                isSelected 
                  ? 'bg-[var(--color-primary)] text-black' 
                  : 'bg-white text-black'
              }`}
            >
              <div className={`w-6 h-6 rounded-full border-[3px] border-black flex items-center justify-center mr-4 shrink-0 bg-white`}>
                {isSelected && <div className="w-3 h-3 bg-black rounded-full" />}
              </div>
              <div className="prose prose-sm prose-p:my-0">
                <ReactMarkdown>{opt}</ReactMarkdown>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
