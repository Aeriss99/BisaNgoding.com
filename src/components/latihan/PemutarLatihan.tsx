import { useState, useEffect, useRef } from 'react';
import { X, Check, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import type { Lesson } from '../../types/schema';
import { useProgress } from '../../context/ProgressContext';
import { mulaiLatihan, setelahJawab, progres, sudahSelesai, cekUbin, cekKetik, type StatusLatihan } from '../../lib/latihan';

import { SoalSusunUbin } from './SoalSusunUbin';
import { SoalPasangan } from './SoalPasangan';
import { SoalKetik } from './SoalKetik';
import { SoalPilihan } from './SoalPilihan';

interface PemutarLatihanProps {
  lesson: Lesson;
}

export function PemutarLatihan({ lesson }: PemutarLatihanProps) {
  const navigate = useNavigate();
  const { markLessonCompleted, addXP } = useProgress();
  
  const [fase, setFase] = useState<'intro' | 'main' | 'selesai'>('intro');
  const [showTips, setShowTips] = useState(false);
  const [showConfirmQuit, setShowConfirmQuit] = useState(false);
  
  const [status, setStatus] = useState<StatusLatihan>(() => mulaiLatihan(lesson.cards.length));
  
  // State for current question answering
  const [jawaban, setJawaban] = useState<any>(null); // depends on card type
  const [sedangDiperiksa, setSedangDiperiksa] = useState(false);
  const [hasilPeriksa, setHasilPeriksa] = useState<'benar' | 'hampir' | 'salah' | null>(null);
  const [pesanHasil, setPesanHasil] = useState<string>('');
  const [completedOnce, setCompletedOnce] = useState(false); // To ensure we only give XP once

  // Scroll to bottom helper
  const bottomRef = useRef<HTMLDivElement>(null);

  // Restart if lesson changes
  useEffect(() => {
    setFase('intro');
    setStatus(mulaiLatihan(lesson.cards.length));
    setShowTips(false);
    setShowConfirmQuit(false);
    setJawaban(null);
    setSedangDiperiksa(false);
    setHasilPeriksa(null);
    setCompletedOnce(false);
  }, [lesson.id]);

  const cardIndex = status.antrean[status.posisi];
  const card = lesson.cards[cardIndex];

  const handleMulai = () => {
    setFase('main');
  };

  const handlePeriksa = () => {
    if (sedangDiperiksa || jawaban === null) return;
    
    let benar = false;
    let hasil: 'benar' | 'hampir' | 'salah' = 'salah';
    let pesan = '';
    
    if (card.type === 'translate_tiles' || card.type === 'listen_tiles') {
      benar = cekUbin(jawaban as string[], card.answers);
      hasil = benar ? 'benar' : 'salah';
      if (!benar) {
        pesan = card.answers[0].join(' ');
      }
    } else if (card.type === 'type_translation') {
      const { hasil: h, terdekat } = cekKetik(jawaban as string, card.answers);
      hasil = h;
      benar = (h === 'benar' || h === 'hampir');
      if (h === 'hampir') {
        pesan = terdekat;
      } else if (h === 'salah') {
        pesan = card.answers[0];
      }
    } else if (card.type === 'multiple_choice') {
      benar = (jawaban as number) === card.answer;
      hasil = benar ? 'benar' : 'salah';
      if (!benar) {
        pesan = card.options[card.answer];
      }
    } else if (card.type === 'match_pairs') {
      // should not use periksa button, but just in case
      return; 
    }
    
    setHasilPeriksa(hasil);
    if (hasil === 'salah' && (card as any).explanation) {
      setPesanHasil(pesan + '\\n\\n' + (card as any).explanation);
    } else {
      setPesanHasil(pesan);
    }
    
    setSedangDiperiksa(true);
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleLanjut = () => {
    const isBenar = hasilPeriksa === 'benar' || hasilPeriksa === 'hampir';
    const nextStatus = setelahJawab(status, isBenar);
    
    if (sudahSelesai(nextStatus)) {
      setFase('selesai');
      if (!completedOnce) {
        markLessonCompleted(lesson.id);
        const allCorrectFirstTry = nextStatus.salahPertama.size === 0;
        addXP(10 + (allCorrectFirstTry ? 5 : 0));
        setCompletedOnce(true);
      }
    } else {
      setStatus(nextStatus);
      setSedangDiperiksa(false);
      setHasilPeriksa(null);
      setJawaban(null);
    }
  };

  // Keyboard support for Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        // Prevent default only if we are taking action
        if (fase === 'main' && card?.type !== 'type_translation') {
          // Inside SoalKetik we handle enter separately, but we also want global Enter to submit or next
          if (sedangDiperiksa) {
            e.preventDefault();
            handleLanjut();
          } else if (jawaban !== null && card?.type !== 'match_pairs') {
            e.preventDefault();
            handlePeriksa();
          }
        } else if (fase === 'main' && sedangDiperiksa) {
          e.preventDefault();
          handleLanjut();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fase, sedangDiperiksa, jawaban, card, status]);

  const quit = () => navigate(`/kelas/${lesson.moduleId.split('-').slice(0,-1).join('-') || 'english'}`);

  if (fase === 'intro') {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-main)] flex flex-col p-4 md:p-8 relative">
        <button 
          onClick={quit}
          className="absolute top-4 left-4 p-2 bg-white brutal-border rounded-xl hover:bg-gray-100"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full gap-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-space font-extrabold mb-4">{lesson.title}</h1>
            <p className="font-barlow text-xl text-gray-600 font-bold">
              {lesson.cards.length} Latihan · ~{lesson.estimatedMinutes} menit
            </p>
          </div>
          
          <div className="flex flex-col w-full gap-4">
            {lesson.tips && (
              <button 
                onClick={() => setShowTips(true)}
                className="brutal-btn bg-white py-4 w-full text-lg"
              >
                Baca Tips Dulu
              </button>
            )}
            <button 
              onClick={handleMulai}
              className="brutal-btn bg-[var(--color-primary)] py-4 w-full text-lg"
            >
              Mulai Latihan
            </button>
          </div>
        </div>

        {showTips && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full max-h-[80vh] overflow-y-auto brutal-border-3 p-6 rounded-xl shadow-[8px_8px_0_#111]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-space text-2xl font-bold">Tips</h2>
                <button onClick={() => setShowTips(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X /></button>
              </div>
              <div className="prose prose-p:my-2 prose-h3:mt-4">
                <ReactMarkdown>{lesson.tips || ''}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (fase === 'selesai') {
    const akurasi = Math.round(((lesson.cards.length - status.salahPertama.size) / lesson.cards.length) * 100);
    const xpBase = 10;
    const xpBonus = status.salahPertama.size === 0 ? 5 : 0;
    
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-main)] flex flex-col p-4 md:p-8">
        <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full gap-8">
          <div className="text-center mb-4">
            <h2 className="text-3xl md:text-4xl font-space font-extrabold text-[var(--color-success)] mb-2">Pelajaran Selesai!</h2>
            <p className="font-barlow text-xl text-gray-600 font-bold">Kerja bagus.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-[var(--color-accent)] border-[3px] border-black p-6 rounded-xl shadow-[4px_4px_0_#111] text-center">
              <div className="text-sm font-bold mb-1">TOTAL XP</div>
              <div className="text-3xl font-space text-white drop-shadow-[2px_2px_0_#111]">+{xpBase + xpBonus}</div>
              {xpBonus > 0 && <div className="text-xs font-bold text-white mt-1">Sempurna! +5</div>}
            </div>
            <div className="bg-white border-[3px] border-black p-6 rounded-xl shadow-[4px_4px_0_#111] text-center">
              <div className="text-sm font-bold mb-1">AKURASI</div>
              <div className="text-3xl font-space text-[var(--color-success)]">{akurasi}%</div>
            </div>
          </div>

          {lesson.newWords && lesson.newWords.length > 0 && (
            <div className="w-full bg-white border-[3px] border-black rounded-xl p-6 shadow-[4px_4px_0_#111] mt-4">
              <h3 className="font-space font-bold mb-4">Kata Baru:</h3>
              <div className="flex flex-wrap gap-2">
                {lesson.newWords.map((nw, i) => (
                  <div key={i} className="bg-yellow-100 border-2 border-black px-3 py-1 font-bold text-sm">
                    {nw.word} = {nw.meaning}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="max-w-lg mx-auto w-full pt-4">
          <button 
            onClick={() => navigate(`/module/${lesson.moduleId}`)}
            className="w-full brutal-btn bg-[var(--color-primary)] py-4 text-lg"
          >
            Lanjut
          </button>
        </div>
      </div>
    );
  }

  // fase === 'main'
  const progressPercent = progres(status, lesson.cards.length) * 100;

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-main)] flex flex-col">
      {/* Top Bar */}
      <div className="p-4 md:p-6 flex items-center gap-4 max-w-4xl mx-auto w-full">
        <button 
          onClick={() => {
            if (status.selesai.size > 0 || status.posisi > 0) setShowConfirmQuit(true);
            else quit();
          }}
          className="p-2 hover:bg-gray-200 rounded-xl"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex-1 bg-gray-200 h-4 rounded-full border-2 border-black overflow-hidden relative">
          <div 
            className="absolute top-0 left-0 bottom-0 bg-[var(--color-success)] border-r-2 border-black transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 pb-32">
        {card.type === 'translate_tiles' && (
          <SoalSusunUbin type="translate_tiles" prompt={card.prompt} tiles={card.tiles} newWords={lesson.newWords} glossary={lesson.glossary} onAnswerChange={(ans) => { if(!sedangDiperiksa) setJawaban(ans.length > 0 ? ans : null) }} />
        )}
        {card.type === 'listen_tiles' && (
          <SoalSusunUbin type="listen_tiles" text={card.text} tiles={card.tiles} onAnswerChange={(ans) => { if(!sedangDiperiksa) setJawaban(ans.length > 0 ? ans : null) }} />
        )}
        {card.type === 'match_pairs' && (
          <SoalPasangan 
            pairs={card.pairs} 
            onCorrect={() => {
              setHasilPeriksa('benar');
              setSedangDiperiksa(true);
              setTimeout(() => {
                const nextStatus = setelahJawab(status, true);
                if (sudahSelesai(nextStatus)) {
                  setFase('selesai');
                  if (!completedOnce) {
                    markLessonCompleted(lesson.id);
                    const allCorrectFirstTry = nextStatus.salahPertama.size === 0;
                    addXP(10 + (allCorrectFirstTry ? 5 : 0));
                    setCompletedOnce(true);
                  }
                } else {
                  setStatus(nextStatus);
                  setSedangDiperiksa(false);
                  setHasilPeriksa(null);
                  setJawaban(null);
                }
              }, 1500);
            }} 
            onWrong={() => {
              // mark this question as wrong on first try without submitting
              setStatus(prev => {
                const newSalah = new Set(prev.salahPertama);
                newSalah.add(prev.antrean[prev.posisi]);
                return { ...prev, salahPertama: newSalah };
              });
            }}
          />
        )}
        {card.type === 'type_translation' && (
          <SoalKetik prompt={card.prompt} newWords={lesson.newWords} glossary={lesson.glossary} onAnswerChange={(v) => { if(!sedangDiperiksa) setJawaban(v.trim() ? v : null) }} onEnter={() => {
            if (sedangDiperiksa) handleLanjut();
            else if (jawaban !== null) handlePeriksa();
          }} />
        )}
        {card.type === 'multiple_choice' && (
          <SoalPilihan question={card.question} options={card.options} onSelect={(idx) => { if(!sedangDiperiksa) setJawaban(idx) }} />
        )}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Bottom Panel */}
      {card.type !== 'match_pairs' && (
        <div className={`fixed bottom-0 left-0 right-0 border-t-[3px] border-black transition-colors duration-200 z-30 pb-[env(safe-area-inset-bottom)]
          ${sedangDiperiksa && (hasilPeriksa === 'benar' || hasilPeriksa === 'hampir') ? 'bg-green-100' : 
            sedangDiperiksa && hasilPeriksa === 'salah' ? 'bg-red-100' : 'bg-white'}`}
          aria-live="polite"
        >
          <div className="max-w-4xl mx-auto px-4 py-4 md:px-8 md:py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            {/* Feedback Message */}
            <div className="flex-1 min-w-0 font-space w-full">
              {!sedangDiperiksa ? null : (
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-1">
                    {(hasilPeriksa === 'benar' || hasilPeriksa === 'hampir') ? (
                      <Check className="w-8 h-8 text-green-700" strokeWidth={3} />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-700" strokeWidth={3} />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <h3 className={`text-xl md:text-2xl font-bold mb-1 ${hasilPeriksa === 'salah' ? 'text-red-700' : 'text-green-700'}`}>
                      {hasilPeriksa === 'benar' ? 'Benar!' : 
                       hasilPeriksa === 'hampir' ? 'Hampir benar' : 'Jawaban yang benar:'}
                    </h3>
                    {pesanHasil && (
                      <div className={`text-sm md:text-base font-bold whitespace-pre-wrap leading-relaxed ${hasilPeriksa === 'salah' ? 'text-red-900' : 'text-green-900'}`}>
                        {hasilPeriksa === 'hampir' && <span className="font-normal opacity-80 block mb-1">Perhatikan ejaannya:</span>}
                        {pesanHasil}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={sedangDiperiksa ? handleLanjut : handlePeriksa}
              disabled={!sedangDiperiksa && jawaban === null}
              className={`w-full md:w-auto min-w-[160px] px-8 py-3.5 md:py-4 font-bungee text-lg md:text-xl border-[3px] border-black transition-all shadow-[4px_4px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#111] rounded-xl shrink-0
                ${sedangDiperiksa ? (hasilPeriksa === 'salah' ? 'bg-red-500 text-white' : 'bg-green-500 text-white') : 
                  (jawaban !== null ? 'bg-[var(--color-primary)] text-black' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none border-gray-400')}
              `}
            >
              {sedangDiperiksa ? 'LANJUT' : 'PERIKSA'}
            </button>
          </div>
        </div>
      )}

      {/* Confirm Quit Dialog */}
      {showConfirmQuit && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-[3px] border-black shadow-[8px_8px_0_#111] p-6 max-w-sm w-full rounded-xl flex flex-col gap-4">
            <h3 className="font-space text-xl font-bold">Progres pelajaran ini akan hilang. Keluar?</h3>
            <div className="flex flex-col gap-3 mt-4">
              <button 
                onClick={quit}
                className="brutal-btn bg-red-500 text-white w-full py-3 font-bold"
              >
                Keluar
              </button>
              <button 
                onClick={() => setShowConfirmQuit(false)}
                className="brutal-btn bg-white w-full py-3 text-gray-600 font-bold border-gray-300"
              >
                Tetap Belajar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
