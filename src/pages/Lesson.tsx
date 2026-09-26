import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  getLesson,
  getLessonsForModule,
  getModule,
  coursesData,
  checkModuleUnlocked,
} from '../lib/content';
import type { Card } from '../types/schema';
import { Check, ChevronRight, X, Lock, Copy } from 'lucide-react';
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

const Mermaid = lazy(() =>
  import('../components/ui/Mermaid').then((m) => ({ default: m.Mermaid }))
);
import { ErrorBoundary } from '../components/ErrorBoundary';

function CodeBlockWithCopy({ children, className, ...props }: any) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <pre className="bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto text-sm brutal-border shadow-[4px_4px_0_#1A1A1A] m-0">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2 py-1 bg-[#2B2D30] border border-[var(--color-text-main)] rounded text-[#DFE1E5] text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:bg-[#3B3D40]"
      >
        {copied ? 'Tersalin' : <><Copy className="w-3 h-3" /> Salin</>}
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

  const course = coursesData.find((c) => c.id === (mod?.courseId || 'java'));
  const language = course?.language || 'java';

  const progressPercent = Math.round(
    ((currentCardIndex + 1) / lesson.cards.length) * 100
  );

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
          <div className="prose prose-blue max-w-none lg:max-w-[70ch] lg:mx-auto">
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
                        <Mermaid chart={String(children).replace(/\n$/, '')} />
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
                      className="bg-[var(--color-accent)] text-[var(--color-text-main)] px-1.5 py-0.5 rounded-md text-sm font-mono border border-[var(--color-text-main)]"
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
    const allModuleLessons = getLessonsForModule(lesson.moduleId).filter(
      (l) => !l.title.includes(' - Pelajaran ') && !l.title.includes('TODO')
    );
    const currentIndex = allModuleLessons.findIndex((l) => l.id === lesson.id);
    const nextLesson =
      currentIndex >= 0 && currentIndex < allModuleLessons.length - 1
        ? allModuleLessons[currentIndex + 1]
        : null;

    return (
      <div className="flex flex-col h-screen bg-[var(--color-bg-base)] items-center justify-center p-4 text-center relative z-0">
        <svg
          className="fixed inset-0 w-full h-full pointer-events-none z-[-1] opacity-[0.06]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50vw" cy="50vh" r="40vw" fill="var(--color-success)" />
        </svg>
        <div className="brutal-card p-8 rounded-2xl max-w-sm w-full space-y-6">
          <div className="flex justify-center mb-2">
            <img
              src={`${import.meta.env.BASE_URL}illustrations/undraw_done_erdp.svg`}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="pointer-events-none w-full max-w-[200px]"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Pelajaran Selesai!</h2>
            <p className="text-gray-600 font-bold">+10 XP</p>
          </div>
          <div className="space-y-3">
            {nextLesson && (
              <Link
                to={`/lesson/${nextLesson.id}`}
                className="w-full block brutal-btn bg-[var(--color-success)] text-[var(--color-text-main)] font-extrabold py-3 px-6 rounded-xl"
              >
                Pelajaran Berikutnya
              </Link>
            )}
            <Link
              to={`/kelas/${course?.id || 'java'}`}
              className="w-full block brutal-btn bg-[var(--color-primary)] text-white font-extrabold py-3 px-6 rounded-xl"
            >
              Kembali ke Kelas
            </Link>
            <button
              onClick={prevCard}
              className="w-full brutal-btn bg-white text-[var(--color-text-main)] font-bold py-3 px-6 rounded-xl"
            >
              Ulangi Pelajaran
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

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-base)] items-center lg:py-0">
      <div className="w-full max-w-xl lg:max-w-4xl h-screen lg:min-h-screen lg:h-auto lg:rounded-none bg-white flex flex-col brutal-border lg:border-y-0 relative overflow-hidden">
        {/* Header */}
        <header className="p-4 border-b flex items-center gap-4 bg-white z-10 sticky top-0">
          <Link
            to={`/kelas/${course?.id || 'java'}`}
            className="text-gray-500 hover:text-gray-900"
          >
            <X className="w-6 h-6" />
          </Link>
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-3 brutal-border overflow-hidden">
              <div
                className="bg-[var(--color-primary)] h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 pb-32 lg:pb-10 text-base md:text-lg flex flex-col">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full lg:my-auto">
            <ErrorBoundary>{renderCardContent(card)}</ErrorBoundary>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 border-t-2 border-[var(--color-text-main)] bg-[var(--color-bg-base)] absolute lg:static lg:mt-auto bottom-0 left-0 right-0 z-10 lg:shadow-none shadow-[0_-4px_0_#1A1A1A] pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-4 w-full">
          {showFooterNextButton ? (
            <div className="flex gap-2">
              <button
                onClick={prevCard}
                disabled={currentCardIndex === 0}
                className="brutal-btn bg-white text-gray-800 font-bold py-3 px-4 rounded-xl flex items-center justify-center disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                onClick={nextCard}
                className="flex-1 brutal-btn bg-[var(--color-primary)] text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2"
              >
                {currentCardIndex === lesson.cards.length - 1
                  ? 'Selesai'
                  : 'Lanjut'}
                {currentCardIndex !== lesson.cards.length - 1 && (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={prevCard}
                disabled={currentCardIndex === 0}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
              >
                Kembali
              </button>
              <div className="flex-1 text-center flex items-center justify-center text-sm font-medium text-gray-400 py-3 bg-gray-50 rounded-xl">
                Selesaikan latihan di atas untuk lanjut
              </div>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
