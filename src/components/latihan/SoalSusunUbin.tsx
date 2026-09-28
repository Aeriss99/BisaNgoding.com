import { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { KalimatBerarti } from './KalimatBerarti';
import { ucapkan, hentikanSuara, type HasilSuara } from '../../lib/suara';

interface SoalSusunUbinProps {
  type: 'translate_tiles' | 'listen_tiles';
  /** Hanya untuk translate_tiles. en-id = kalimat soal berbahasa Inggris (bisa didengar). */
  direction?: 'en-id' | 'id-en';
  prompt?: string;
  text?: string;
  tiles: string[];
  newWords?: { word: string; meaning: string }[];
  glossary?: Record<string, string>;
  onAnswerChange: (answer: string[]) => void;
}

type Ubin = { id: number; text: string };

function acak(tiles: string[]): Ubin[] {
  const hasil = tiles.map((text, i) => ({ id: i, text }));
  for (let i = hasil.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [hasil[i], hasil[j]] = [hasil[j], hasil[i]];
  }
  return hasil;
}

export function SoalSusunUbin({ type, direction, prompt, text, tiles, newWords, glossary, onAnswerChange }: SoalSusunUbinProps) {
  const [bank, setBank] = useState<Ubin[]>(() => acak(tiles));
  const [jawaban, setJawaban] = useState<Ubin[]>([]);
  // null = belum dicoba. Pesan hanya muncul kalau suara benar-benar gagal diputar.
  const [suara, setSuara] = useState<HasilSuara | null>(null);
  const [tampilkanTeks, setTampilkanTeks] = useState(false);

  // Teks bahasa Inggris yang dibacakan untuk soal ini (null = soal ini tidak punya suara).
  const teksDidengar = type === 'listen_tiles' ? text ?? null : direction === 'en-id' ? prompt ?? null : null;

  const putar = (lambat = false) => {
    if (!teksDidengar) return;
    ucapkan(teksDidengar, lambat).then(setSuara);
  };

  useEffect(() => {
    setBank(acak(tiles));
    setJawaban([]);
    setSuara(null);
    setTampilkanTeks(false);
    onAnswerChange([]);
    if (type === 'listen_tiles' && text) {
      ucapkan(text).then(setSuara);
    }
    return () => hentikanSuara();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiles, text, type, prompt]);

  const pilihUbin = (u: Ubin) => {
    const baru = [...jawaban, u];
    setBank(bank.filter((x) => x.id !== u.id));
    setJawaban(baru);
    onAnswerChange(baru.map((x) => x.text));
  };

  const batalUbin = (u: Ubin) => {
    const baru = jawaban.filter((x) => x.id !== u.id);
    setJawaban(baru);
    setBank([...bank, u]);
    onAnswerChange(baru.map((x) => x.text));
  };

  return (
    <div className="flex flex-col h-full gap-6 max-w-2xl mx-auto w-full">
      {type === 'listen_tiles' ? (
        <div className="flex flex-col gap-3">
          <p className="font-space font-bold text-lg">Dengarkan, lalu susun kalimatnya</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => putar(false)}
              aria-label="Putar suara"
              className="w-16 h-16 bg-[var(--color-primary)] border-[3px] border-black rounded-2xl flex items-center justify-center text-black hover:bg-[var(--color-accent)] transition-colors shadow-[4px_4px_0_#111]"
            >
              <Volume2 className="w-8 h-8" />
            </button>
            <button
              type="button"
              onClick={() => putar(true)}
              aria-label="Putar suara pelan"
              className="h-12 px-3 bg-white border-[3px] border-black rounded-xl flex items-center justify-center gap-1 text-black hover:bg-gray-100 transition-colors shadow-[2px_2px_0_#111]"
            >
              <Volume2 className="w-5 h-5" />
              <span className="text-xs font-bold">pelan</span>
            </button>
          </div>

          {suara === 'diblokir' && (
            <p className="text-sm font-bold text-gray-700">Ketuk tombol speaker untuk mendengarkan.</p>
          )}
          {suara === 'gagal' && (
            <div className="flex flex-col items-start gap-2 bg-yellow-50 border-2 border-black rounded-xl p-3">
              <span className="text-sm font-bold">
                Suara tidak bisa diputar di perangkat ini. Periksa volume, atau baca kalimatnya saja.
              </span>
              {tampilkanTeks ? (
                <span className="font-space text-lg font-bold">{text}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setTampilkanTeks(true)}
                  className="text-sm font-bold underline"
                >
                  Tampilkan kalimatnya
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
        <p className="font-space font-bold text-lg">Terjemahkan kalimat ini</p>
        <div className="flex items-start gap-3">
          {teksDidengar && (
            <button
              type="button"
              onClick={() => putar(false)}
              aria-label="Dengarkan kalimat"
              className="mt-1 w-10 h-10 bg-[var(--color-primary)] border-[3px] border-black rounded-xl flex items-center justify-center text-black hover:bg-[var(--color-accent)] transition-colors shrink-0 shadow-[2px_2px_0_#111]"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          )}
          {prompt && <KalimatBerarti kalimat={prompt} newWords={newWords} glossary={glossary} />}
        </div>
        </div>
      )}

      <div className="flex flex-col flex-1 gap-6 mt-2">
        {/* Baris jawaban */}
        <div className="min-h-[60px] p-2 flex flex-wrap gap-2 border-b-[3px] border-black pb-4">
          {jawaban.map((u) => (
            <button
              type="button"
              key={u.id}
              onClick={() => batalUbin(u)}
              className="bg-white border-[3px] border-black shadow-[3px_3px_0_#111] px-4 py-2 font-bold font-space rounded-xl hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#111] transition-all min-h-[44px]"
            >
              {u.text}
            </button>
          ))}
        </div>

        {/* Bank ubin */}
        <div className="flex flex-wrap gap-3">
          {bank.map((u) => (
            <button
              type="button"
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
