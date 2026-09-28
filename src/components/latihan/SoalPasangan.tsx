import { useState, useEffect, useRef } from 'react';
import { ucapkan, adaRekaman, hentikanSuara } from '../../lib/suara';

interface MatchPairsProps {
  pairs: { en: string; id: string }[];
  onCorrect: () => void;
  onWrong: () => void;
}

type Item = { text: string; pairId: number };

function acak<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Logika pencocokan ada di handler klik, bukan di useEffect.
// Versi sebelumnya memanggil onWrong() dari useEffect yang ikut bergantung pada onWrong;
// karena onWrong selalu fungsi baru setiap render, salah pasang memicu render berulang tanpa henti.
export function SoalPasangan({ pairs, onCorrect, onWrong }: MatchPairsProps) {
  const [leftCol, setLeftCol] = useState<Item[]>(() => acak(pairs.map((p, i) => ({ text: p.en, pairId: i }))));
  const [rightCol, setRightCol] = useState<Item[]>(() => acak(pairs.map((p, i) => ({ text: p.id, pairId: i }))));
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(() => new Set());
  const [errorPair, setErrorPair] = useState<{ left: number; right: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLeftCol(acak(pairs.map((p, i) => ({ text: p.en, pairId: i }))));
    setRightCol(acak(pairs.map((p, i) => ({ text: p.id, pairId: i }))));
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatched(new Set());
    setErrorPair(null);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      hentikanSuara();
    };
  }, [pairs]);

  const cocokkan = (kiri: number, kanan: number) => {
    if (kiri === kanan) {
      const baru = new Set(matched).add(kiri);
      setMatched(baru);
      setSelectedLeft(null);
      setSelectedRight(null);
      if (baru.size === pairs.length) {
        timer.current = setTimeout(onCorrect, 300);
      }
    } else {
      onWrong();
      setErrorPair({ left: kiri, right: kanan });
      timer.current = setTimeout(() => {
        setErrorPair(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 500);
    }
  };

  const handleLeftClick = (item: Item) => {
    if (matched.has(item.pairId) || errorPair) return;
    // Kolom kiri berbahasa Inggris: ketuk = dengar pelafalannya (kalau rekamannya ada).
    if (adaRekaman(item.text)) void ucapkan(item.text);
    if (selectedLeft === item.pairId) {
      setSelectedLeft(null);
    } else if (selectedRight !== null) {
      cocokkan(item.pairId, selectedRight);
    } else {
      setSelectedLeft(item.pairId);
    }
  };

  const handleRightClick = (item: Item) => {
    if (matched.has(item.pairId) || errorPair) return;
    if (selectedRight === item.pairId) {
      setSelectedRight(null);
    } else if (selectedLeft !== null) {
      cocokkan(selectedLeft, item.pairId);
    } else {
      setSelectedRight(item.pairId);
    }
  };

  const kelas = (pairId: number, sisi: 'left' | 'right') => {
    const cls =
      'min-h-[44px] p-3 font-space font-bold border-[3px] border-black rounded-xl text-center w-full transition-all flex items-center justify-center ';
    const terpilih = sisi === 'left' ? selectedLeft === pairId : selectedRight === pairId;
    if (matched.has(pairId)) return cls + 'bg-green-100 text-green-800 border-green-800 opacity-50 cursor-default';
    if (errorPair && errorPair[sisi] === pairId) return cls + 'bg-red-200 border-red-500 animate-pulse';
    if (terpilih)
      return (
        cls +
        (sisi === 'left' ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-primary)]') +
        ' shadow-[2px_2px_0_#111] translate-x-[1px] translate-y-[1px]'
      );
    return cls + 'bg-white hover:bg-gray-50 shadow-[4px_4px_0_#111]';
  };

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
      <p className="font-space font-bold text-lg px-2">Pasangkan kata dengan artinya</p>
      <div className="grid grid-cols-2 gap-4 md:gap-8 w-full px-2">
        <div className="flex flex-col gap-3">
          {leftCol.map((item) => (
            <button
              type="button"
              key={`l-${item.pairId}`}
              onClick={() => handleLeftClick(item)}
              className={kelas(item.pairId, 'left')}
            >
              {item.text}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {rightCol.map((item) => (
            <button
              type="button"
              key={`r-${item.pairId}`}
              onClick={() => handleRightClick(item)}
              className={kelas(item.pairId, 'right')}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
