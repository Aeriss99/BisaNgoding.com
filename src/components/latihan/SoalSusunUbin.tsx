import { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { KalimatBerarti } from './KalimatBerarti';
import { bisaBersuara, ucapkan } from '../../lib/suara';

interface SoalSusunUbinProps {
  type: 'translate_tiles' | 'listen_tiles';
  prompt?: string;
  text?: string;
  tiles: string[];
  newWords?: { word: string; meaning: string }[];
  glossary?: Record<string, string>;
  onAnswerChange: (answer: string[]) => void;
}

export function SoalSusunUbin({ type, prompt, text, tiles, newWords, glossary, onAnswerChange }: SoalSusunUbinProps) {
  const [bank, setBank] = useState<{ id: number; text: string }[]>([]);
  const [jawaban, setJawaban] = useState<{ id: number; text: string }[]>([]);
  const [suaraAda, setSuaraAda] = useState(true);

  useEffect(() => {
    // fisher yates shuffle
    const shuffled = [...tiles].map((text, i) => ({ id: i, text }));
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setBank(shuffled);
    setJawaban([]);
    onAnswerChange([]);
    
    if (type === 'listen_tiles' && text) {
      bisaBersuara().then(bisa => {
        setSuaraAda(bisa);
        if (bisa) ucapkan(text);
      });
    }
  }, [tiles, text, type, prompt]); // reload when question changes

  const pilihUbin = (u: { id: number; text: string }) => {
    setBank(bank.filter(x => x.id !== u.id));
    const newJawaban = [...jawaban, u];
    setJawaban(newJawaban);
    onAnswerChange(newJawaban.map(x => x.text));
  };

  const batalUbin = (u: { id: number; text: string }) => {
    setJawaban(jawaban.filter(x => x.id !== u.id));
    setBank([...bank, u]);
    onAnswerChange(jawaban.filter(x => x.id !== u.id).map(x => x.text));
  };

  const putarSuara = (lambat = false) => {
    if (text) ucapkan(text, lambat);
    if (prompt) ucapkan(prompt, lambat);
  };

  return (
    <div className="flex flex-col h-full gap-6 max-w-2xl mx-auto w-full">
      <div className="flex items-start gap-4">
        {type === 'listen_tiles' ? (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => putarSuara(false)} 
              className="w-16 h-16 bg-[var(--color-primary)] border-[3px] border-black brutal-border rounded-2xl flex items-center justify-center text-black hover:bg-[var(--color-accent)] transition-colors shadow-[4px_4px_0_#111]"
            >
              <Volume2 className="w-8 h-8" />
            </button>
            <button 
              onClick={() => putarSuara(true)} 
              className="w-12 h-12 bg-white border-[3px] border-black brutal-border rounded-xl flex items-center justify-center text-black hover:bg-gray-100 transition-colors shadow-[2px_2px_0_#111]"
            >
              <Volume2 className="w-6 h-6" /> 
              <span className="text-xs font-bold ml-1">pelan</span>
            </button>
            {!suaraAda && (
              <div className="ml-4 flex flex-col">
                <span className="font-space text-lg font-bold">{text}</span>
                <span className="text-xs text-red-500 font-bold">Suara tidak tersedia di perangkat ini</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <button 
              onClick={() => putarSuara(false)} 
              className="mt-1 w-10 h-10 bg-[var(--color-primary)] border-[3px] border-black rounded-xl flex items-center justify-center text-black hover:bg-[var(--color-accent)] transition-colors shrink-0 shadow-[2px_2px_0_#111]"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            {prompt && <KalimatBerarti kalimat={prompt} newWords={newWords} glossary={glossary} />}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 gap-6 mt-4">
        {/* Baris Jawaban */}
        <div className="min-h-[60px] p-2 flex flex-wrap gap-2 border-b-[3px] border-black pb-4">
          {jawaban.map(u => (
            <button
              key={u.id}
              onClick={() => batalUbin(u)}
              className="bg-white border-[3px] border-black shadow-[3px_3px_0_#111] px-4 py-2 font-bold font-space rounded-xl hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#111] transition-all min-h-[44px]"
            >
              {u.text}
            </button>
          ))}
        </div>

        {/* Bank Ubin */}
        <div className="flex flex-wrap gap-3">
          {bank.map(u => (
            <button
              key={u.id}
              onClick={() => pilihUbin(u)}
              className="bg-[var(--color-primary-light)] border-[3px] border-black shadow-[3px_3px_0_#111] px-4 py-2 font-bold font-space rounded-xl hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#111] transition-all min-h-[44px]"
            >
              {u.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
