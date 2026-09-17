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
        <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <div className="text-sm text-blue-600 font-medium">Modul {mod.order}</div>
          <h1 className="text-xl font-bold">{mod.title}</h1>
        </div>
      </header>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {lessons.length === 0 && (
          <div className="p-8 text-center text-gray-500">
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
                className="flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              >
                <div className="w-8 flex-shrink-0 text-center font-bold text-gray-400">{i + 1}</div>
                <div className="flex-1 px-4 font-medium text-gray-900">{lesson.title}</div>
                <div className="flex-shrink-0 text-gray-400">
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </Link>
            );
          } else {
            return (
              <div
                key={lesson.id}
                title="Selesaikan pelajaran sebelumnya dulu"
                className="flex items-center p-4 border-b border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed select-none"
              >
                <div className="w-8 flex-shrink-0 text-center font-bold text-gray-400">{i + 1}</div>
                <div className="flex-1 px-4 font-medium text-gray-500">{lesson.title}</div>
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
                className="flex items-center p-4 border-t-2 border-gray-100 hover:bg-blue-50 cursor-pointer bg-blue-50/50"
              >
                <div className="w-8 flex-shrink-0 text-center font-bold text-blue-400">
                  <Trophy className="w-5 h-5 mx-auto" />
                </div>
                <div className="flex-1 px-4 font-bold text-blue-900">
                  Quiz Akhir Modul
                  {quizScore && (
                    <span
                      className={`ml-3 text-xs px-2 py-1 rounded-full ${
                        quizScore.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      Skor: {quizScore.score}%
                    </span>
                  )}
                </div>
                <div className="flex-shrink-0 text-gray-400">
                  {quizScore?.passed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </Link>
            );
          } else {
            return (
              <div
                title="Selesaikan semua pelajaran dulu"
                className="flex items-center p-4 border-t-2 border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed select-none"
              >
                <div className="w-8 flex-shrink-0 text-center font-bold text-gray-400">
                  <Trophy className="w-5 h-5 mx-auto" />
                </div>
                <div className="flex-1 px-4 font-bold text-gray-500">
                  Quiz Akhir Modul
                  <span className="ml-3 text-xs font-normal text-gray-400">
                    (Selesaikan semua pelajaran dulu)
                  </span>
                </div>
                <div className="flex-shrink-0 text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
}
