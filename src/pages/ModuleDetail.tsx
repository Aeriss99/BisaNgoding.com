import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle, Trophy, Lock } from 'lucide-react';
import { getModule, getVisibleLessons, getQuizQuestions } from '../lib/content';
import { useProgress } from '../context/ProgressContext';

export default function ModuleDetail() {
  const { moduleId } = useParams();
  const mod = getModule(moduleId || '');
  const { progress } = useProgress();

  if (!mod) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-500">Modul tidak ditemukan.</p>
        <Link to="/" className="inline-block bg-blue-600 text-white font-bold py-2 px-6 rounded-xl">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const lessons = getVisibleLessons(mod.id);
  const quizTersedia = !!getQuizQuestions(mod.id);
  const quizScore = progress.quizScores?.[mod.id];

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4 mb-6">
        <Link to="/" className="p-2 brutal-btn bg-white rounded-full flex items-center justify-center">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <div className="text-sm text-[var(--color-primary)] font-bold">Modul {mod.order}</div>
          <h1 className="text-2xl font-extrabold">{mod.title}</h1>
        </div>
      </header>

      <div className="grid gap-3">
        {lessons.length === 0 && (
          <div className="p-8 text-center text-gray-500 brutal-card rounded-xl">
            Belum ada pelajaran yang tersedia dalam modul ini.
          </div>
        )}

        {lessons.map((lesson, i) => {
          const isCompleted = progress.completedLessons.includes(lesson.id);
          
          let isUnlocked = progress.unlockAll;
          if (!isUnlocked) {
            if (i === 0) {
              isUnlocked = true;
            } else {
              const prevLessonId = lessons[i - 1].id;
              isUnlocked = progress.completedLessons.includes(prevLessonId) || isCompleted;
            }
          }

          if (isUnlocked) {
            return (
              <Link
                key={lesson.id}
                to={`/lesson/${lesson.id}`}
                className="flex items-center p-4 rounded-xl brutal-card cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[var(--color-text-main)] brutal-border bg-[var(--color-accent)]">{i + 1}</div>
                <div className="flex-1 px-4 font-bold text-gray-900">{lesson.title}</div>
                <div className="flex-shrink-0 text-gray-400">
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-[var(--color-success)] drop-shadow-[1px_1px_0_#1A1A1A]" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-[var(--color-primary)]" />
                  )}
                </div>
              </Link>
            );
          } else {
            return (
              <div
                key={lesson.id}
                title="Selesaikan pelajaran sebelumnya dulu"
                className="flex items-center p-4 rounded-xl brutal-card-locked opacity-75 cursor-not-allowed select-none"
              >
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-gray-500 brutal-border bg-gray-200">{i + 1}</div>
                <div className="flex-1 px-4 font-bold text-gray-500">{lesson.title}</div>
                <div className="flex-shrink-0 text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
              </div>
            );
          }
        })}

        {lessons.length > 0 && quizTersedia && (() => {
          const allCompleted = lessons.every(l => progress.completedLessons.includes(l.id));
          const isQuizUnlocked = progress.unlockAll || allCompleted;

          if (isQuizUnlocked) {
            return (
              <Link
                to={`/quiz/${mod.id}`}
                className="flex items-center p-4 rounded-xl brutal-card !bg-[var(--color-primary)] cursor-pointer mt-4"
              >
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-[var(--color-accent)] brutal-border">
                  <Trophy className="w-6 h-6 text-black" />
                </div>
                <div className="flex-1 px-4 font-bold text-white">
                  Quiz Akhir Modul
                  {quizScore && (
                    <span
                      className={`ml-3 text-xs px-2 py-1 rounded-full brutal-border text-black ${
                        quizScore.passed ? 'bg-[var(--color-success)]' : 'bg-[var(--color-danger)]'
                      }`}
                    >
                      Skor: {quizScore.score}%
                    </span>
                  )}
                </div>
                <div className="flex-shrink-0 text-white">
                  {quizScore?.passed ? (
                    <CheckCircle className="w-6 h-6 text-[var(--color-success)] drop-shadow-[1px_1px_0_#1A1A1A]" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-white" />
                  )}
                </div>
              </Link>
            );
          } else {
            return (
              <div
                title="Selesaikan semua pelajaran dulu"
                className="flex items-center p-4 rounded-xl brutal-card-locked opacity-75 cursor-not-allowed select-none mt-4"
              >
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-300 brutal-border">
                  <Trophy className="w-6 h-6 text-gray-500" />
                </div>
                <div className="flex-1 px-4 font-bold text-gray-500">
                  Quiz Akhir Modul
                  <span className="block sm:inline sm:ml-3 text-xs font-normal text-gray-500 mt-1 sm:mt-0">
                    (Selesaikan semua pelajaran dulu)
                  </span>
                </div>
                <div className="flex-shrink-0 text-gray-400">
                  <Lock className="w-6 h-6" />
                </div>
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
}
