import { useState, useEffect } from 'react';

interface MatchPairsProps {
  pairs: { en: string; id: string }[];
  onCorrect: () => void;
  onWrong: () => void;
}

export function SoalPasangan({ pairs, onCorrect, onWrong }: MatchPairsProps) {
  const [leftCol, setLeftCol] = useState<{ text: string, pairId: number }[]>([]);
  const [rightCol, setRightCol] = useState<{ text: string, pairId: number }[]>([]);
  
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null); // pairId
  const [selectedRight, setSelectedRight] = useState<number | null>(null); // pairId
  
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [errorPair, setErrorPair] = useState<{ left: number | null, right: number | null } | null>(null);

  useEffect(() => {
    const left = pairs.map((p, i) => ({ text: p.en, pairId: i }));
    const right = pairs.map((p, i) => ({ text: p.id, pairId: i }));
    
    const shuffle = (arr: any[]) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    
    setLeftCol(shuffle([...left]));
    setRightCol(shuffle([...right]));
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatched(new Set());
    setErrorPair(null);
  }, [pairs]);

  useEffect(() => {
    if (selectedLeft !== null && selectedRight !== null) {
      if (selectedLeft === selectedRight) {
        // match
        const newMatched = new Set(matched).add(selectedLeft);
        setMatched(newMatched);
        setSelectedLeft(null);
        setSelectedRight(null);
        if (newMatched.size === pairs.length) {
          setTimeout(onCorrect, 300);
        }
      } else {
        // mismatch
        onWrong();
        setErrorPair({ left: selectedLeft, right: selectedRight });
        setTimeout(() => {
          setErrorPair(null);
          setSelectedLeft(null);
          setSelectedRight(null);
        }, 500);
      }
    }
  }, [selectedLeft, selectedRight, matched, pairs.length, onCorrect, onWrong]);

  const handleLeftClick = (pairId: number) => {
    if (matched.has(pairId) || errorPair) return;
    if (selectedLeft === pairId) setSelectedLeft(null);
    else setSelectedLeft(pairId);
  };

  const handleRightClick = (pairId: number) => {
    if (matched.has(pairId) || errorPair) return;
    if (selectedRight === pairId) setSelectedRight(null);
    else setSelectedRight(pairId);
  };

  const getLeftClass = (pairId: number) => {
    let cls = "min-h-[44px] p-3 font-space font-bold border-[3px] border-black rounded-xl text-center w-full transition-all flex items-center justify-center ";
    if (matched.has(pairId)) return cls + "bg-green-100 text-green-800 border-green-800 opacity-50 cursor-default";
    if (errorPair?.left === pairId) return cls + "bg-red-200 border-red-500 animate-pulse";
    if (selectedLeft === pairId) return cls + "bg-[var(--color-accent)] shadow-[2px_2px_0_#111] translate-x-[1px] translate-y-[1px]";
    return cls + "bg-white hover:bg-gray-50 shadow-[4px_4px_0_#111]";
  };

  const getRightClass = (pairId: number) => {
    let cls = "min-h-[44px] p-3 font-space font-bold border-[3px] border-black rounded-xl text-center w-full transition-all flex items-center justify-center ";
    if (matched.has(pairId)) return cls + "bg-green-100 text-green-800 border-green-800 opacity-50 cursor-default";
    if (errorPair?.right === pairId) return cls + "bg-red-200 border-red-500 animate-pulse";
    if (selectedRight === pairId) return cls + "bg-[var(--color-primary)] shadow-[2px_2px_0_#111] translate-x-[1px] translate-y-[1px]";
    return cls + "bg-white hover:bg-gray-50 shadow-[4px_4px_0_#111]";
  };

  return (
    <div className="grid grid-cols-2 gap-4 md:gap-8 max-w-2xl mx-auto w-full px-2">
      <div className="flex flex-col gap-3">
        {leftCol.map(item => (
          <button
            key={`l-${item.pairId}`}
            onClick={() => handleLeftClick(item.pairId)}
            className={getLeftClass(item.pairId)}
          >
            {item.text}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {rightCol.map(item => (
          <button
            key={`r-${item.pairId}`}
            onClick={() => handleRightClick(item.pairId)}
            className={getRightClass(item.pairId)}
          >
            {item.text}
          </button>
        ))}
      </div>
    </div>
  );
}
