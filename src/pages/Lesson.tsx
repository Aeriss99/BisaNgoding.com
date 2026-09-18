import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLesson, getLessonsForModule } from '../lib/content';
import type { Card } from '../types/schema';
import { Check, ChevronRight, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useProgress } from '../context/ProgressContext';
import { initCheerpJ } from '../lib/javaRunner';
import { RunnableCardComponent, CodeChallengeCardComponent } from '../components/cards/InteractiveCards';
import { FillBlankCardComponent, PredictOutputCardComponent, ReorderCardComponent } from '../components/cards/QuizCards';

import { Mermaid } from '../components/ui/Mermaid';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function LessonPage() {
  useEffect(() => {
    initCheerpJ().catch(console.error);
  }, []);

  const { lessonId } = useParams();
  const lesson = getLesson(lessonId || '');
  const { markLessonCompleted, addXP, touchActivity } = useProgress();
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [challengePassed, setChallengePassed] = useState(false);
  const [isLessonFinished, setIsLessonFinished] = useState(false);
  const [attemptsPerCard, setAttemptsPerCard] = useState<Record<number, number>>({});

  useEffect(() => {
    setCurrentCardIndex(0);
    setShowExplanation(false);
    setIsAnswerCorrect(null);
    setChallengePassed(false);
    setIsLessonFinished(false);
    setAttemptsPerCard({});
  }, [lessonId]);

  if (!lesson) {
    return <div className="p-8 text-center text-red-500">Pelajaran tidak ditemukan</div>;
  }

  const progressPercent = Math.round(((currentCardIndex + 1) / lesson.cards.length) * 100);

  const nextCard = () => {
    setShowExplanation(false);
    setIsAnswerCorrect(null);
    setChallengePassed(false);
    touchActivity();
    if (currentCardIndex < lesson.cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
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
      setCurrentCardIndex(prev => prev - 1);
    }
  };

  const handleMultipleChoice = (selectedIndex: number, correctIndex: number) => {
    const correct = selectedIndex === correctIndex;
    const currentAttempts = attemptsPerCard[currentCardIndex] || 0;
    const newAttempts = currentAttempts + 1;
    setAttemptsPerCard(prev => ({ ...prev, [currentCardIndex]: newAttempts }));
    
    setIsAnswerCorrect(correct);
    setShowExplanation(true);
    if (correct) {
      setChallengePassed(true);
      if (newAttempts === 1) addXP(2); // XP bonus for first try
    }
  };

  const handleChallengeSuccess = (attempts: number) => {
    setChallengePassed(true);
    setAttemptsPerCard(prev => ({ ...prev, [currentCardIndex]: attempts }));
    if (attempts === 1) addXP(5); // XP bonus for first try
  };

  const renderCardContent = (c: Card) => {
    switch (c.type) {
      case 'theory':
        return (
          <div className="prose prose-blue max-w-none">
            {c.image && (
              <div className="my-4 flex justify-center">
                <img src={c.image.src.startsWith('http') ? c.image.src : `/images/${c.image.src}`} alt={c.image.alt} className="max-w-full h-auto rounded-lg" />
              </div>
            )}
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre: ({ children }: any) => <>{children}</>,
                table: ({ children }: any) => (
                  <div className="overflow-x-auto my-4 rounded-xl brutal-border brutal-card">
                    <table className="min-w-full text-sm text-left">{children}</table>
                  </div>
                ),
                thead: ({ children }: any) => <thead className="bg-[var(--color-accent)] text-[var(--color-text-main)] font-extrabold border-b-[2px] border-[var(--color-text-main)]">{children}</thead>,
                tbody: ({ children }: any) => <tbody className="divide-y-[2px] divide-[var(--color-text-main)] bg-white">{children}</tbody>,
                tr: ({ children }: any) => <tr className="hover:bg-gray-50 transition-colors">{children}</tr>,
                th: ({ children }: any) => <th className="px-4 py-3 whitespace-nowrap">{children}</th>,
                td: ({ children }: any) => <td className="px-4 py-3">{children}</td>,
                code({ className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  if (match && match[1] === 'mermaid') {
                    return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                  }
                  if (match) {
                    return (
                      <pre className="bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto text-sm brutal-border shadow-[4px_4px_0_#1A1A1A] my-4">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    );
                  }
                  return (
                    <code className="bg-[var(--color-accent)] text-[var(--color-text-main)] px-1.5 py-0.5 rounded-md text-sm font-mono border border-[var(--color-text-main)]" {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {c.content}
            </ReactMarkdown>
          </div>
        );
      
      case 'runnable':
        return <RunnableCardComponent card={c} />;

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
              <div className={`p-4 rounded-xl mt-4 brutal-border ${isAnswerCorrect ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--color-danger)] text-white'}`}>
                <div className="font-bold flex items-center gap-2 mb-1">
                  {isAnswerCorrect ? <Check className="w-5 h-5"/> : <X className="w-5 h-5" />}
                  {isAnswerCorrect ? 'Benar!' : 'Kurang Tepat!'}
                </div>
                <p>{c.explanation}</p>
                {isAnswerCorrect && (
                  <button onClick={nextCard} className="mt-3 bg-white px-4 py-2 rounded-xl text-[var(--color-text-main)] text-sm font-bold w-full brutal-btn">
                    Lanjut
                  </button>
                )}
                {!isAnswerCorrect && (
                  <button onClick={() => setShowExplanation(false)} className="mt-3 bg-white px-4 py-2 rounded shadow-sm text-sm font-bold w-full">
                    Coba Lagi
                  </button>
                )}
              </div>
            )}
          </div>
        );

      case 'fill_blank':
        return <FillBlankCardComponent card={c} onSuccess={handleChallengeSuccess} />;
        
      case 'predict_output':
        return <PredictOutputCardComponent card={c} onSuccess={handleChallengeSuccess} />;

      case 'reorder':
        return <ReorderCardComponent card={c} onSuccess={handleChallengeSuccess} />;
        
      case 'code_challenge':
        return <CodeChallengeCardComponent card={c} onSuccess={handleChallengeSuccess} />;

      case 'summary':
        return (
          <div className="space-y-4">
            <h3 className="font-extrabold text-xl md:text-2xl">Ringkasan Pelajaran</h3>
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
    const allModuleLessons = getLessonsForModule(lesson.moduleId).filter(l => !l.title.includes(' - Pelajaran ') && !l.title.includes('TODO'));
    const currentIndex = allModuleLessons.findIndex(l => l.id === lesson.id);
    const nextLesson = currentIndex >= 0 && currentIndex < allModuleLessons.length - 1 ? allModuleLessons[currentIndex + 1] : null;

    return (
      <div className="flex flex-col h-screen bg-[var(--color-bg-base)] items-center justify-center p-4 text-center">
        <div className="brutal-card p-8 rounded-2xl max-w-sm w-full space-y-6">
          <div className="w-20 h-20 bg-[var(--color-success)] text-white rounded-full flex items-center justify-center mx-auto brutal-border">
            <Check className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Pelajaran Selesai!</h2>
            <p className="text-gray-600">+10 XP</p>
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
              to={`/module/${lesson.moduleId}`}
              className="w-full block brutal-btn bg-[var(--color-primary)] text-white font-extrabold py-3 px-6 rounded-xl"
            >
              Kembali ke Modul
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
  const isQuizCard = card.type === 'multiple_choice' || card.type === 'fill_blank' || card.type === 'code_challenge' || card.type === 'predict_output' || card.type === 'reorder';
  
  // Multiple choice shows its own 'next' button when correct, but code challenge / fill blank can use the footer one if passed
  const showFooterNextButton = !isQuizCard || challengePassed;
  
  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg-base)] items-center md:py-6">
      <div className="w-full max-w-xl md:max-w-4xl h-full md:h-auto md:min-h-[80vh] md:rounded-2xl bg-white flex flex-col brutal-border relative overflow-hidden">
        {/* Header */}
        <header className="p-4 border-b flex items-center gap-4 bg-white z-10 sticky top-0">
          <Link to={`/module/${lesson.moduleId}`} className="text-gray-500 hover:text-gray-900">
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-32 text-base md:text-lg">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ErrorBoundary>
              {renderCardContent(card)}
            </ErrorBoundary>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 border-t-2 border-[var(--color-text-main)] bg-[var(--color-bg-base)] absolute bottom-0 left-0 right-0 z-10 shadow-[0_-4px_0_#1A1A1A] pb-[calc(1rem+env(safe-area-inset-bottom))]">
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
                {currentCardIndex === lesson.cards.length - 1 ? 'Selesai' : 'Lanjut'}
                {currentCardIndex !== lesson.cards.length - 1 && <ChevronRight className="w-5 h-5" />}
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
