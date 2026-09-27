import { useState } from 'react';

interface KalimatBerartiProps {
  kalimat: string;
  newWords?: { word: string; meaning: string }[];
  glossary?: Record<string, string>;
}

export function KalimatBerarti({ kalimat, newWords = [], glossary = {} }: KalimatBerartiProps) {
  // Pecah kalimat jadi array kata (dengan tetap menjaga tanda baca)
  const tokens = kalimat.split(/(\s+)/);
  const [popover, setPopover] = useState<{ word: string, meaning: string, index: number } | null>(null);

  // We want to match up to 3 words from glossary (frasa terpanjang dulu)
  // We'll iterate through words and check if word[i..i+3] is in glossary
  
  const wordsOnly = tokens.filter(t => t.trim().length > 0);
  // Match index mapping
  const matchInfo: Record<number, { length: number, meaning: string, isNew: boolean }> = {};
  
  for (let i = 0; i < wordsOnly.length; i++) {
    if (matchInfo[i]) continue; // already matched as part of a phrase

    // try length 3, 2, 1
    for (let len = 3; len >= 1; len--) {
      if (i + len > wordsOnly.length) continue;
      
      const phrase = wordsOnly.slice(i, i + len).join(' ');
      // clean punctuation for dictionary lookup
      const cleanPhrase = phrase.toLowerCase().replace(/[.,!?]/g, '');
      
      let meaning = glossary[cleanPhrase];
      let isNew = false;
      
      if (!meaning) {
        const nw = newWords.find(nw => nw.word.toLowerCase() === cleanPhrase);
        if (nw) {
          meaning = nw.meaning;
          isNew = true;
        }
      }
      
      if (meaning) {
        for (let j = 0; j < len; j++) {
          matchInfo[i + j] = { length: len, meaning, isNew };
        }
        break; // stop checking shorter lengths
      }
    }
  }

  let wordIndex = -1;

  return (
    <div className="flex flex-wrap items-center relative text-xl font-bold font-space">
      {tokens.map((token, i) => {
        if (!token.trim()) {
          return <span key={i} className="whitespace-pre">{token}</span>;
        }
        wordIndex++;
        const info = matchInfo[wordIndex];
        
        if (info) {
          return (
            <span 
              key={i}
              className={`relative cursor-pointer border-b-2 border-dotted border-gray-400 ${info.isNew ? 'bg-yellow-100' : ''}`}
              onClick={() => setPopover(popover?.index === i ? null : { word: token, meaning: info.meaning, index: i })}
            >
              {token}
              {popover?.index === i && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-[var(--color-text-main)] text-white text-sm px-3 py-1.5 rounded-lg shadow-lg z-10 font-sans font-medium text-center">
                  {info.meaning}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--color-text-main)] rotate-45"></div>
                </div>
              )}
            </span>
          );
        }

        return <span key={i}>{token}</span>;
      })}
    </div>
  );
}
