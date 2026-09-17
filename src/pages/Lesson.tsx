import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getLesson } from '../lib/content';
import type { Card } from '../types/schema';
import { Check, ChevronRight, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useStorage } from '../hooks/useStorage';
import { RunnableCardComponent, CodeChallengeCardComponent } from '../components/cards/InteractiveCards';

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const lesson = getLesson(lessonId || '');
  const { markLessonCompleted } = useStorage();
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [challengePassed, setChallengePassed] = useState(false);

  if (!lesson) {
    return <div className="p-8 text-center text-red-500">Pelajaran tidak ditemukan</div>;
  }

  const card = lesson.cards[currentCardIndex];
  const progressPercent = Math.round(((currentCardIndex + 1) / lesson.cards.length) * 100);

  const nextCard = () => {
    setShowExplanation(false);
    setIsAnswerCorrect(null);
    setChallengePassed(false);
    if (currentCardIndex < lesson.cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      markLessonCompleted(lesson.id);
      navigate(`/module/${lesson.moduleId}`);
    }
  };

  const handleMultipleChoice = (selectedIndex: number, correctIndex: number) => {
    const correct = selectedIndex === correctIndex;
    setIsAnswerCorrect(correct);
    setShowExplanation(true);
  };

  const renderCardContent = (c: Card) => {
    switch (c.type) {
      case 'theory':
        return (
          <div className="prose prose-blue max-w-none">
            <ReactMarkdown>{c.content}</ReactMarkdown>
          </div>
        );
      
      case 'runnable':
        return <RunnableCardComponent card={c} />;

      case 'multiple_choice':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">{c.question}</h3>
            <div className="space-y-2">
              {c.options.map((opt, i) => (
                <button
                  key={i}
                  disabled={showExplanation}
                  onClick={() => handleMultipleChoice(i, c.answer)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    showExplanation
                      ? i === c.answer
                        ? 'border-green-500 bg-green-50'
                        : isAnswerCorrect === false && i !== c.answer
                        ? 'border-red-500 bg-red-50 opacity-50'
                        : 'border-gray-200 opacity-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {showExplanation && (
              <div className={`p-4 rounded-lg mt-4 ${isAnswerCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <div className="font-bold flex items-center gap-2 mb-1">
                  {isAnswerCorrect ? <Check className="w-5 h-5"/> : <X className="w-5 h-5" />}
                  {isAnswerCorrect ? 'Benar!' : 'Kurang Tepat!'}
                </div>
                <p>{c.explanation}</p>
                {isAnswerCorrect && (
                  <button onClick={nextCard} className="mt-3 bg-white px-4 py-2 rounded shadow-sm text-sm font-bold w-full">
                    Lanjut
                  </button>
                )}
              </div>
            )}
          </div>
        );

      case 'fill_blank':
        return (
          <div className="space-y-4">
            <h3 className="font-bold">Lengkapi kode berikut:</h3>
            <div className="p-4 bg-gray-100 rounded-lg font-mono text-sm whitespace-pre-wrap">
              {c.code}
            </div>
            <p className="text-sm text-gray-500">Fitur interaktif untuk tipe ini akan disempurnakan.</p>
            <button onClick={() => setChallengePassed(true)} className="text-sm text-blue-500">Lewati untuk sekarang</button>
          </div>
        );
        
      case 'code_challenge':
        return <CodeChallengeCardComponent card={c} onSuccess={() => setChallengePassed(true)} />;

      case 'summary':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-xl">Ringkasan Pelajaran</h3>
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

  const isQuizCard = card.type === 'multiple_choice' || card.type === 'fill_blank' || card.type === 'code_challenge';
  
  // Multiple choice shows its own 'next' button when correct, but code challenge / fill blank can use the footer one if passed
  const showFooterNextButton = !isQuizCard || (card.type === 'code_challenge' && challengePassed) || (card.type === 'fill_blank' && challengePassed);
  
  return (
    <div className="flex flex-col h-screen bg-gray-50 md:bg-gray-100 items-center">
      <div className="w-full max-w-xl h-full bg-white flex flex-col shadow-xl relative">
        {/* Header */}
        <header className="p-4 border-b flex items-center gap-4 bg-white z-10 sticky top-0">
          <Link to={`/module/${lesson.moduleId}`} className="text-gray-500 hover:text-gray-900">
            <X className="w-6 h-6" />
          </Link>
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 pb-32">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderCardContent(card)}
          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 border-t bg-white absolute bottom-0 left-0 right-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {showFooterNextButton ? (
            <button
              onClick={nextCard}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {currentCardIndex === lesson.cards.length - 1 ? 'Selesai' : 'Lanjut'}
              {currentCardIndex !== lesson.cards.length - 1 && <ChevronRight className="w-5 h-5" />}
            </button>
          ) : (
            <div className="text-center text-sm font-medium text-gray-400 py-3">
              Selesaikan tantangan di atas untuk lanjut
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
