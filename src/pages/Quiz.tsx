import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { X, RotateCcw, AlertTriangle } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import type { QuizQuestion } from '../types/schema';
import {
  prepareQuiz,
  calculateScore,
  isPassingScore,
  PASSING_SCORE,
} from '../lib/quizLogic';
import CodeMirror from '@uiw/react-codemirror';
import { java } from '@codemirror/lang-java';

export default function QuizPage() {
  const { moduleId } = useParams();
  const { saveQuizScore, addXP, touchActivity } = useProgress();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for quiz execution
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Load quiz from content
    const loadQuiz = async () => {
      try {
        const mods = await import.meta.glob('../../content/**/quiz.json');
        let foundUrl = null;
        for (const path in mods) {
          if (
            path.includes(`-${moduleId}/quiz.json`) ||
            path.includes(`/${moduleId}/quiz.json`)
          ) {
            foundUrl = path;
            break;
          }
        }

        if (!foundUrl) {
          setError('Quiz belum tersedia.');
          setLoading(false);
          return;
        }

        const mod: any = await mods[foundUrl]();
        const quizData = mod.default || mod;

        if (!quizData || !Array.isArray(quizData) || quizData.length === 0) {
          setError('Quiz belum tersedia.');
          setLoading(false);
          return;
        }

        setQuestions(prepareQuiz(quizData, 20));
      } catch (err) {
        setError('Quiz belum tersedia.');
      }
      setLoading(false);
    };

    loadQuiz();
  }, [moduleId]);

  const handleSelect = (optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setIsFinished(true);
    const score = calculateScore(questions, answers);
    const passed = isPassingScore(score);

    touchActivity();
    saveQuizScore(moduleId || '', score, passed);
    if (passed) {
      addXP(50); // Big XP bonus for passing quiz
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Memuat quiz...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full space-y-4">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
          <h2 className="text-xl font-bold">{error}</h2>
          <Link
            to={`/module/${moduleId}`}
            className="inline-block bg-blue-600 text-white font-bold py-2 px-6 rounded-xl"
          >
            Kembali ke Modul
          </Link>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const correctCount = questions.filter(
      (q, i) => answers[i] === q.answer
    ).length;
    const score = calculateScore(questions, answers);
    const passed = isPassingScore(score);

    return (
      <div className="max-w-2xl mx-auto p-4 py-8 space-y-8 relative z-0">
        <svg
          className="fixed inset-0 w-full h-full pointer-events-none z-[-1] opacity-[0.06]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50vw" cy="50vh" r="40vw" fill="var(--color-primary)" />
        </svg>
        <div className="brutal-card p-8 rounded-2xl text-center space-y-6">
          {passed ? (
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
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto bg-[var(--color-danger)] brutal-border text-white">
              <X className="w-12 h-12" />
            </div>
          )}
          <div>
            <h2 className="text-3xl font-extrabold mb-2">
              {passed ? 'Lulus!' : 'Belum Lulus'}
            </h2>
            <p className="text-gray-700 font-bold">
              Skor Anda: <span className="text-black text-xl">{score}%</span>
            </p>
            <p className="text-sm text-gray-500 mt-1 font-bold">
              Syarat lulus: {PASSING_SCORE}%
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 brutal-btn bg-white hover:bg-gray-100 text-gray-800 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> Ulangi
            </button>
            <Link
              to={`/module/${moduleId}`}
              className="flex-1 brutal-btn bg-[var(--color-primary)] text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center"
            >
              Selesai
            </Link>
          </div>
        </div>

        {/* Review wrong answers */}
        <div className="space-y-4">
          <h3 className="font-bold text-xl px-2">Pembahasan Jawaban Salah</h3>
          {questions.map((q, i) => {
            if (answers[i] === q.answer) return null;
            return (
              <div
                key={i}
                className="bg-white border border-red-200 rounded-xl p-6 space-y-4"
              >
                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold">
                    {i + 1}
                  </div>
                  <div className="font-bold text-lg">{q.question}</div>
                </div>
                {q.code && (
                  <div className="border rounded-lg overflow-hidden border-gray-300">
                    <CodeMirror
                      value={q.code}
                      extensions={[java()]}
                      theme="light"
                      readOnly={true}
                    />
                  </div>
                )}
                <div className="space-y-2 pl-11">
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm">
                    <span className="font-bold text-red-700">
                      Jawaban Anda:{' '}
                    </span>
                    {q.options[answers[i]] || 'Tidak dijawab'}
                  </div>
                  <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-sm">
                    <span className="font-bold text-green-700">
                      Jawaban Benar:{' '}
                    </span>
                    {q.options[q.answer]}
                  </div>
                </div>
                <div className="pl-11 mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="font-bold text-gray-800">Penjelasan:</span>{' '}
                  {q.explanation}
                </div>
              </div>
            );
          })}
          {correctCount === questions.length && (
            <p className="text-center text-gray-500 py-4">
              Luar biasa! Tidak ada jawaban yang salah.
            </p>
          )}
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const hasAnswered = answers[currentIndex] !== undefined;

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg-base)] items-center md:py-6 relative z-0">
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none z-[-1] opacity-[0.06]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50vw" cy="50vh" r="40vw" fill="var(--color-accent)" />
      </svg>
      <div className="w-full h-full max-w-[100vw] sm:max-w-xl md:max-w-3xl md:h-[95vh] md:rounded-2xl bg-white flex flex-col brutal-border relative overflow-hidden">
        <header className="p-4 border-b-[2px] border-[var(--color-text-main)] flex items-center gap-4 bg-[var(--color-accent)]">
          <Link
            to={`/module/${moduleId}`}
            className="text-[var(--color-text-main)] hover:scale-110 transition-transform"
          >
            <X className="w-6 h-6" />
          </Link>
          <div className="flex-1 font-bold text-center">
            Soal {currentIndex + 1} dari {questions.length}
          </div>
          <div className="w-6" />
        </header>

        <main className="flex-1 overflow-y-auto p-6 pb-32 space-y-6">
          <h3 className="font-bold text-xl">{q.question}</h3>

          {q.code && (
            <div className="border rounded-lg overflow-hidden border-gray-300">
              <CodeMirror
                value={q.code}
                extensions={[java()]}
                theme="light"
                readOnly={true}
                basicSetup={{ lineNumbers: true }}
              />
            </div>
          )}

          <div className="space-y-3">
            {q.options.map((opt, i) => {
              const isSelected = answers[currentIndex] === i;
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-800 font-medium'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </main>

        <footer className="p-4 border-t bg-white">
          <button
            disabled={!hasAnswered}
            onClick={handleNext}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center transition-colors"
          >
            {currentIndex === questions.length - 1
              ? 'Selesai & Lihat Hasil'
              : 'Selanjutnya'}
          </button>
        </footer>
      </div>
    </div>
  );
}
