import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import {
  getLesson,
  getModule,
  coursesData,
  checkModuleUnlocked,
} from '../lib/content';
import type { Card } from '../types/schema';
import { Check, Lock, X } from 'lucide-react';
import { Ikon } from '../components/ui/IkonDesain';
import { infoMateri, labelKartu, langkahBerikutnya } from '../lib/materi';
import MenuRamping from '../components/layout/MenuRamping';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useProgress } from '../context/ProgressContext';
import { initCheerpJ } from '../lib/javaRunner';
import {
  RunnableCardComponent,
  CodeChallengeCardComponent,
} from '../components/cards/InteractiveCards';
import {
  FillBlankCardComponent,
  PredictOutputCardComponent,
  ReorderCardComponent,
  UnderstandingCheckCardComponent,
} from '../components/cards/QuizCards';
import { HtmlPreviewCardComponent } from '../components/cards/HtmlPreviewCard';
import { HtmlCssPreviewCardComponent } from '../components/cards/HtmlCssPreviewCard';

const Mermaid = lazy(() =>
  import('../components/ui/Mermaid').then((m) => ({ default: m.Mermaid }))
);
import { ErrorBoundary } from '../components/ErrorBoundary';
import { PemutarLatihan } from '../components/latihan/PemutarLatihan';

function CodeBlockWithCopy({ children, className, ...props }: any) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group max-w-full">
      <pre 
        className="m-0 px-5 py-[18px] bg-[#1d1d1b] text-[#f5f1e6] rounded-[10px] font-mono text-[13px] leading-[21px] lg:text-[15px] lg:leading-6 overflow-x-auto"
        style={{ whiteSpace: 'pre', tabSize: 4 }}
      >
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2 py-1 bg-[#2B2D30] border border-[var(--color-text-main)] rounded text-[#DFE1E5] text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:bg-[#3B3D40]"
      >
        {copied ? 'Tersalin' : <>Salin</>}
      </button>
    </div>
  );
}

export default function LessonPage() {
  useEffect(() => {
    initCheerpJ().catch(console.error);
  }, []);

  const { lessonId } = useParams();
  const lesson = getLesson(lessonId || '');
  const {
    progress,
    markLessonCompleted,
    markCheckPassed,
    addXP,
    touchActivity,
  } = useProgress();

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [challengePassed, setChallengePassed] = useState(false);
  const [isLessonFinished, setIsLessonFinished] = useState(false);
  const [attemptsPerCard, setAttemptsPerCard] = useState<
    Record<number, number>
  >({});

  useEffect(() => {
    setCurrentCardIndex(0);
    setShowExplanation(false);
    setIsAnswerCorrect(null);
    setChallengePassed(false);
    setIsLessonFinished(false);
    setAttemptsPerCard({});
  }, [lessonId]);

  if (!lesson) {
    return (
      <div className="p-8 text-center text-red-500">
        Pelajaran tidak ditemukan
      </div>
    );
  }

  const mod = getModule(lesson.moduleId);
  if (mod && !checkModuleUnlocked(mod, progress)) {
    return <Navigate to={`/kelas/${mod.courseId || 'java'}`} replace />;
  }

  // Pengecekan kunci berlaku juga untuk pelajaran latihan (English)
  if (lesson.mode === 'latihan') {
    return <PemutarLatihan lesson={lesson} />;
  }

  const course = coursesData.find((c) => c.id === (mod?.courseId || 'java'));
  const language = course?.language || 'java';

  const nextCard = () => {
    setShowExplanation(false);
    setIsAnswerCorrect(null);
    setChallengePassed(false);
    touchActivity();
    if (currentCardIndex < lesson.cards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      markLessonCompleted(lesson.id);
      setIsLessonFinished(true);
    }
  };

  const prevCard = () => {
    if (isLessonFinished) {
      setIsLessonFinished(false);
      return;
    }
    if (currentCardIndex > 0) {
      setShowExplanation(false);
      setIsAnswerCorrect(null);
      setChallengePassed(true); // Treat previous cards as passed since they were already done
      setCurrentCardIndex((prev) => prev - 1);
    }
  };

  const handleMultipleChoice = (
    selectedIndex: number,
    correctIndex: number
  ) => {
    const correct = selectedIndex === correctIndex;
    const currentAttempts = attemptsPerCard[currentCardIndex] || 0;
    const newAttempts = currentAttempts + 1;
    setAttemptsPerCard((prev) => ({
      ...prev,
      [currentCardIndex]: newAttempts,
    }));

    setIsAnswerCorrect(correct);
    setShowExplanation(true);
    if (correct) {
      setChallengePassed(true);
      if (newAttempts === 1) addXP(2); // XP bonus for first try
    }
  };

  const handleChallengeSuccess = (attempts: number) => {
    setChallengePassed(true);
    setAttemptsPerCard((prev) => ({ ...prev, [currentCardIndex]: attempts }));
    if (attempts === 1) addXP(5); // XP bonus for first try
  };

  const handleCheckSuccess = (attempts: number) => {
    setChallengePassed(true);
    markCheckPassed(lesson.id);
    if (attempts === 1) addXP(5);
  };

  const handleRequireRecheck = () => {
    // Cari index kartu understanding_check di pelajaran ini
    const checkIdx = lesson.cards.findIndex(
      (c) => c.type === 'understanding_check'
    );
    if (checkIdx !== -1) {
      setCurrentCardIndex(checkIdx);
      setChallengePassed(false);
    } else {
      // Jika tidak ada cek pemahaman, kembali ke teori awal
      setCurrentCardIndex(0);
      setChallengePassed(false);
    }
  };

  const renderCardContent = (c: Card) => {
    switch (c.type) {
      case 'theory':
        return (
          <div className="flex flex-col gap-3.5 lg:gap-[18px] text-[16px] leading-[26px] lg:text-[18px] lg:leading-[30px] [&_p]:m-0 [&_h3]:m-0 [&_h3]:font-space [&_h3]:font-bold [&_h3]:text-[20px] [&_h3]:leading-7 [&_h4]:m-0 [&_h4]:font-bold [&_ul]:m-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:m-0 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_strong]:font-bold [&_a]:underline [&_blockquote]:m-0 [&_blockquote]:pl-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--color-text-main)]">
            {c.image && (
              <div className="my-4 flex justify-center">
                <img
                  src={
                    c.image.src.startsWith('http')
                      ? c.image.src
                      : `/images/${c.image.src}`
                  }
                  alt={c.image.alt}
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            )}
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre: ({ children }: any) => <>{children}</>,
                table: ({ children }: any) => (
                  <div className="overflow-x-auto my-4 rounded-xl brutal-border brutal-card">
                    <table className="min-w-full text-sm text-left">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }: any) => (
                  <thead className="bg-[var(--color-accent)] text-[var(--color-text-main)] font-extrabold border-b-[2px] border-[var(--color-text-main)]">
                    {children}
                  </thead>
                ),
                tbody: ({ children }: any) => (
                  <tbody className="divide-y-[2px] divide-[var(--color-text-main)] bg-white">
                    {children}
                  </tbody>
                ),
                tr: ({ children }: any) => (
                  <tr className="hover:bg-gray-50 transition-colors">
                    {children}
                  </tr>
                ),
                th: ({ children }: any) => (
                  <th className="px-4 py-3 whitespace-nowrap">{children}</th>
                ),
                td: ({ children }: any) => (
                  <td className="px-4 py-3">{children}</td>
                ),
                code({ className, children, node, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isRun =
                    node?.data?.meta?.includes('run') ||
                    props.node?.data?.meta?.includes('run') ||
                    (typeof props.children === 'string'
                      ? false
                      : props.node?.meta?.includes('run'));

                  if (match && match[1] === 'mermaid') {
                    return (
                      <Suspense fallback={<div className="text-sm text-gray-400">Memuat diagram...</div>}>
                        <div className="overflow-x-auto max-w-full">
                          <Mermaid chart={String(children).replace(/\n$/, '')} />
                        </div>
                      </Suspense>
                    );
                  }
                  if (match && isRun) {
                    const matchedLang = match[1];
                    const explicitLang = (matchedLang === 'js' || matchedLang === 'javascript') ? 'javascript' : (matchedLang === 'java' ? 'java' : language);
                    return (
                      <RunnableCardComponent
                        card={{
                          type: 'runnable',
                          code: String(children).replace(/\n$/, ''),
                        }}
                        mini={true}
                        language={explicitLang}
                        lessonRunnable={lesson.runnable !== false}
                      />
                    );
                  }
                  if (match) {
                    return (
                      <CodeBlockWithCopy className={className} {...props}>
                        {children}
                      </CodeBlockWithCopy>
                    );
                  }
                  return (
                    <code
                      className="font-mono bg-[var(--color-primary-light)] text-[var(--color-text-main)] px-1.5 py-px border border-[var(--color-text-main)] rounded"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {c.content}
            </ReactMarkdown>
          </div>
        );

      case 'runnable':
        return <RunnableCardComponent card={c} language={language} lessonRunnable={lesson.runnable !== false} />;

      case 'html_preview':
        return <HtmlPreviewCardComponent card={c} />;

      case 'html_css_preview':
        return <HtmlCssPreviewCardComponent card={c} />;

      case 'understanding_check':
        return (
          <UnderstandingCheckCardComponent
            card={c}
            onSuccess={handleCheckSuccess}
            onNavigateToTheory={() => setCurrentCardIndex(0)}
            language={language}
          />
        );

      case 'multiple_choice':
        return (
          <div className="space-y-4">
            <h3 className="font-extrabold text-lg md:text-xl">{c.question}</h3>
            <div className="space-y-2">
              {c.options.map((opt, i) => (
                <button
                  key={i}
                  disabled={showExplanation}
                  onClick={() => handleMultipleChoice(i, c.answer)}
                  className={`w-full text-left p-4 rounded-xl transition-colors brutal-btn bg-white ${
                    showExplanation
                      ? i === c.answer
                        ? 'bg-[var(--color-success)] text-white'
                        : isAnswerCorrect === false && i !== c.answer
                          ? 'bg-[var(--color-danger)] text-white opacity-50'
                          : 'opacity-50'
                      : 'hover:bg-[var(--color-accent)]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {showExplanation && (
              <div
                className={`p-4 rounded-xl mt-4 brutal-border ${isAnswerCorrect ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--color-danger)] text-white'}`}
              >
                <div className="font-bold flex items-center gap-2 mb-1">
                  {isAnswerCorrect ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <X className="w-5 h-5" />
                  )}
                  {isAnswerCorrect ? 'Benar!' : 'Kurang Tepat!'}
                </div>
                <p>{c.explanation}</p>
                {isAnswerCorrect && (
                  <button
                    onClick={nextCard}
                    className="mt-3 bg-white px-4 py-2 rounded-xl text-[var(--color-text-main)] text-sm font-bold w-full brutal-btn"
                  >
                    Lanjut
                  </button>
                )}
                {!isAnswerCorrect && (
                  <button
                    onClick={() => setShowExplanation(false)}
                    className="mt-3 bg-white px-4 py-2 rounded shadow-sm text-sm font-bold w-full"
                  >
                    Coba Lagi
                  </button>
                )}
              </div>
            )}
          </div>
        );

      case 'fill_blank':
        return (
          <FillBlankCardComponent card={c} onSuccess={handleChallengeSuccess} />
        );

      case 'predict_output':
        return (
          <PredictOutputCardComponent
            card={c}
            onSuccess={handleChallengeSuccess}
            language={language}
          />
        );

      case 'reorder':
        return (
          <ReorderCardComponent card={c} onSuccess={handleChallengeSuccess} />
        );

      case 'code_challenge': {
        const hasCheck = lesson.cards.some(
          (c) => c.type === 'understanding_check'
        );
        const passedCheck =
          progress.passedChecks?.includes(lesson.id) ||
          progress.completedLessons.includes(lesson.id);

        if (hasCheck && !passedCheck && !progress.unlockAll) {
          return (
            <div className="flex flex-col items-center justify-center text-center p-8 h-full">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="font-space text-2xl mb-2">Tantangan Terkunci</h3>
              <p className="font-sans text-gray-600 font-medium">
                Selesaikan Cek Pemahaman dulu, supaya kamu siap menulis kodenya
                sendiri.
              </p>
              <button
                onClick={handleRequireRecheck}
                className="mt-6 brutal-btn bg-[var(--color-primary)] text-white font-bold py-3 px-6 rounded-xl"
              >
                Ke Cek Pemahaman
              </button>
            </div>
          );
        }

        return (
          <CodeChallengeCardComponent
            card={c}
            onSuccess={handleChallengeSuccess}
            onNavigateToTheory={() => setCurrentCardIndex(0)}
            onRequireRecheck={handleRequireRecheck}
            language={language}
          />
        );
      }

      case 'summary':
        return (
          <div className="space-y-4">
            <h3 className="font-extrabold text-xl md:text-2xl">
              Ringkasan Pelajaran
            </h3>
            <ul className="list-disc pl-5 space-y-2">
              {c.points.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </div>
        );

      default:
        return <div>Tipe kartu belum didukung.</div>;
    }
  };

  if (isLessonFinished) {
    const nextStep = langkahBerikutnya(lesson);
    const info = infoMateri(lesson);

    return (
      <div className="min-h-dvh flex flex-col bg-[var(--color-bg-base)] leading-[normal]">
        <MenuRamping 
          kembaliKe={info.kembaliKe} 
          kembaliLabel={info.judulModul} 
          judul={info.nomor ? `${info.nomor} · ${lesson.title}` : lesson.title}
          posisi={lesson.cards.length - 1} 
          total={lesson.cards.length} 
        />
        <div className="flex-1 flex flex-col bg-[var(--color-bg-base)] items-center justify-center p-4 text-center relative z-0">
          <svg
            className="fixed inset-0 w-full h-full pointer-events-none z-[-1] opacity-[0.06]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50vw" cy="50vh" r="40vw" fill="var(--color-success)" />
          </svg>
          <div className="brutal-card p-4 md:p-8 rounded-2xl max-w-md w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-center mb-6">
              <img
                src={`${import.meta.env.BASE_URL}illustrations/undraw_done_erdp.svg`}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="pointer-events-none w-full max-w-[200px]"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
            
            <h2 className="font-space font-bold text-[24px] md:text-[26px] mb-3 mt-0">Pelajaran selesai!</h2>
            
            <div className="flex items-center gap-2 mb-8 flex-wrap justify-center">
              <span className="text-[14px] font-bold text-[#5a5a5a]">{info.nomor ? `${info.nomor} · ${lesson.title}` : lesson.title}</span>
              <span className="px-2 py-0.5 border-2 border-[var(--color-text-main)] rounded-full bg-[var(--color-primary-light)] font-mono font-bold text-[13px] whitespace-nowrap">+10 XP</span>
            </div>

            <Link
              to={nextStep.url}
              autoFocus
              className="w-full min-h-[56px] py-1.5 border-[3px] border-[var(--color-text-main)] rounded-xl bg-[var(--color-primary)] shadow-[4px_4px_0_var(--color-text-main)] flex flex-col items-center justify-center text-[var(--color-text-main)] no-underline transition-[transform,box-shadow] duration-150 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[6px_6px_0_var(--color-text-main)] motion-safe:active:translate-x-[3px] motion-safe:active:translate-y-[3px] motion-safe:active:shadow-[1px_1px_0_var(--color-text-main)] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-main)] mb-3"
            >
              <div className="flex items-center gap-2 font-space font-bold text-[18px]">
                {nextStep.judul} <Ikon nama="arrow" ukuran={20} tebal={2.5} />
              </div>
              <span className="font-sans font-normal text-[14px] leading-tight mt-0.5">{nextStep.keterangan}</span>
            </Link>

            {nextStep.jenis !== 'kelas' && (
              <Link
                to={info.kembaliKe}
                className="w-full h-[52px] border-2 border-[var(--color-text-main)] rounded-xl bg-white flex items-center justify-center font-bold text-[16px] text-[var(--color-text-main)] no-underline transition-[transform,box-shadow] duration-150 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[6px_6px_0_var(--color-text-main)] motion-safe:active:translate-x-[3px] motion-safe:active:translate-y-[3px] motion-safe:active:shadow-[1px_1px_0_var(--color-text-main)] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-main)] mb-2"
              >
                Kembali ke kelas
              </Link>
            )}

            <button
              onClick={() => {
                setIsLessonFinished(false);
                setCurrentCardIndex(0);
                setChallengePassed(false);
                setShowExplanation(false);
                setIsAnswerCorrect(null);
              }}
              className="text-[14px] text-[#5a5a5a] hover:text-[var(--color-text-main)] underline mt-4 bg-transparent border-none p-0 cursor-pointer font-medium"
            >
              Ulangi materi ini
            </button>
          </div>
        </div>
      </div>
    );
  }

  const card = lesson.cards[currentCardIndex];
  const isQuizCard =
    card.type === 'multiple_choice' ||
    card.type === 'fill_blank' ||
    card.type === 'code_challenge' ||
    card.type === 'predict_output' ||
    card.type === 'reorder' ||
    card.type === 'understanding_check';

  // Multiple choice shows its own 'next' button when correct, but code challenge / fill blank can use the footer one if passed
  const showFooterNextButton = !isQuizCard || challengePassed;

  const info = infoMateri(lesson);
  const judulMenu = info.nomor ? `${info.nomor} · ${lesson.title}` : lesson.title;

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg-base)] leading-[normal]">
      <MenuRamping 
        kembaliKe={info.kembaliKe} 
        kembaliLabel={info.judulModul} 
        judul={judulMenu}
        posisi={currentCardIndex} 
        total={lesson.cards.length} 
      />
      
      {/* Content */}
      <main className="flex-1 w-full flex flex-col items-center px-4 pt-5 pb-[110px] lg:px-8 lg:pt-12 lg:pb-12">
        <article className="w-full flex flex-col gap-3.5 lg:max-w-[760px] lg:gap-[18px] lg:p-9 lg:border-[3px] lg:border-[var(--color-text-main)] lg:rounded-2xl lg:bg-white lg:shadow-[6px_6px_0_var(--color-text-main)]">
          <div className="lg:hidden text-[13px] text-[#5a5a5a]">{info.judulModul}{info.nomor ? ` · ${info.nomor}` : ''}</div>
          <div className="font-mono text-[13px] font-bold tracking-[1px] text-[#5a5a5a]">{labelKartu(card.type)}</div>
          <h2 className="m-0 font-space font-bold text-[24px] leading-[30px] lg:text-[30px] lg:leading-9">{lesson.title}</h2>
          <div key={currentCardIndex} className="motion-safe:animate-in fade-in slide-in-from-bottom-4 duration-300 w-full">
            <ErrorBoundary>{renderCardContent(card)}</ErrorBoundary>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 px-4 pt-3 pb-[calc(20px+env(safe-area-inset-bottom))] bg-[var(--color-bg-base)] border-t-[3px] border-[var(--color-text-main)] lg:sticky lg:justify-center lg:gap-4 lg:h-[88px] lg:px-8 lg:py-0">
        <button
          onClick={prevCard}
          disabled={currentCardIndex === 0}
          className="hidden lg:flex w-[180px] h-[52px] border-2 border-[var(--color-text-main)] rounded-xl bg-white items-center justify-center font-bold text-[16px] disabled:opacity-40 disabled:cursor-not-allowed transition-[transform,background-color] duration-150 hover:bg-[var(--color-bg-base)] motion-safe:active:translate-y-[2px] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-main)] disabled:hover:bg-white disabled:active:translate-y-0"
        >
          Sebelumnya
        </button>
        {currentCardIndex > 0 && (
          <button 
            aria-label="Kartu sebelumnya"
            onClick={prevCard}
            className="lg:hidden w-14 h-14 shrink-0 border-2 border-[var(--color-text-main)] rounded-xl bg-white flex items-center justify-center transition-[transform,background-color] duration-150 hover:bg-[var(--color-bg-base)] motion-safe:active:translate-y-[2px] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-main)] disabled:hover:bg-white disabled:active:translate-y-0"
          >
            <Ikon nama="back" ukuran={22} tebal={2.5} />
          </button>
        )}
        
        {showFooterNextButton ? (
          <button
            onClick={nextCard}
            className="flex-1 lg:flex-none lg:w-[400px] h-14 lg:h-[52px] border-[3px] border-[var(--color-text-main)] rounded-xl bg-[var(--color-primary)] shadow-[4px_4px_0_var(--color-text-main)] flex items-center justify-center gap-2 font-space font-bold text-[18px] transition-[transform,box-shadow] duration-150 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[6px_6px_0_var(--color-text-main)] motion-safe:active:translate-x-[3px] motion-safe:active:translate-y-[3px] motion-safe:active:shadow-[1px_1px_0_var(--color-text-main)] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-main)]"
          >
            {currentCardIndex === lesson.cards.length - 1 ? 'Selesai' : 'Lanjut'}
            {currentCardIndex === lesson.cards.length - 1 ? (
              <Ikon nama="check" ukuran={20} tebal={2.5} />
            ) : (
              <Ikon nama="arrow" ukuran={20} tebal={2.5} />
            )}
          </button>
        ) : (
          <div className="flex-1 lg:flex-none lg:w-[400px] h-14 lg:h-[52px] border-2 border-dashed border-[#8a857a] rounded-xl bg-[#efeadf] text-[#4d4a44] flex items-center justify-center px-3 text-center text-[14px] font-bold">
            Selesaikan latihan di atas untuk lanjut
          </div>
        )}
      </footer>
    </div>
  );
}
