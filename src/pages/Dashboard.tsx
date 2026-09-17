import { Link } from 'react-router-dom';
import modulesData from '../../content/modules.json';
import { BookOpen, CheckCircle, ChevronRight, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { getLessonsForModule } from '../lib/content';

export default function Dashboard() {
  const { progress, daysUntilReset } = useProgress();
  
  const totalLessons = modulesData.reduce((sum, m) => sum + m.lessonCount, 0);
  const completedLessons = progress.completedLessons.length;
  const progressPercent = Math.round((completedLessons / totalLessons) * 100) || 0;

  // Find next lesson to continue
  let nextLessonUrl = `/module/${modulesData[0].id}`;
  if (completedLessons > 0) {
    const lastLessonId = progress.completedLessons[progress.completedLessons.length - 1];
    let foundMod = modulesData.find(m => lastLessonId.startsWith(m.id));
    if (!foundMod) {
      foundMod = modulesData.find(m => lastLessonId.startsWith('java-') && m.id === 'dasar');
    }
    if (foundMod) {
      const allModLessons = getLessonsForModule(foundMod.id).filter(l => !l.title.includes(' - Pelajaran ') && !l.title.includes('TODO'));
      const lastIndex = allModLessons.findIndex(l => l.id === lastLessonId);
      if (lastIndex !== -1 && lastIndex < allModLessons.length - 1) {
        nextLessonUrl = `/lesson/${allModLessons[lastIndex + 1].id}`;
      } else if (lastIndex === allModLessons.length - 1 && !progress.quizScores[foundMod.id]?.passed) {
        nextLessonUrl = `/quiz/${foundMod.id}`;
      } else {
        const nextModIndex = modulesData.findIndex(m => m.id === foundMod.id) + 1;
        if (nextModIndex < modulesData.length && modulesData[nextModIndex].status === 'ready') {
          const nextModLessons = getLessonsForModule(modulesData[nextModIndex].id).filter(l => !l.title.includes(' - Pelajaran ') && !l.title.includes('TODO'));
          if (nextModLessons.length > 0) {
            nextLessonUrl = `/lesson/${nextModLessons[0].id}`;
          }
        }
      }
    }
  } else {
    // No completed lessons, just go to first lesson of first module
    const firstModLessons = getLessonsForModule(modulesData[0].id).filter(l => !l.title.includes(' - Pelajaran ') && !l.title.includes('TODO'));
    if (firstModLessons.length > 0) {
      nextLessonUrl = `/lesson/${firstModLessons[0].id}`;
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold mb-2">Belajar Java</h1>
        <p className="text-gray-600">Dari pemula sampai mahir dengan interaktif.</p>
      </header>

      {progress.justReset && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold">Progres direset otomatis.</span> Kamu tidak aktif dalam waktu lama, jadi semua progres, XP, dan streak dikembalikan ke awal.
          </div>
        </div>
      )}

      {!progress.justReset && daysUntilReset !== null && daysUntilReset <= 2 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 flex items-start gap-3">
          <RefreshCw className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold">Peringatan:</span> Progresmu akan direset otomatis dalam {daysUntilReset} hari jika tidak ada aktivitas belajar.
          </div>
        </div>
      )}

      {/* Total Progress */}
      <section className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div>
          <div className="flex justify-between text-sm font-medium mb-2">
            <span>Progres Total</span>
            <span className="text-blue-600">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-right">
            {completedLessons} / {totalLessons} pelajaran selesai
          </div>
        </div>
        <Link 
          to={nextLessonUrl}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          Lanjutkan Belajar <ChevronRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Module List */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold">Daftar Modul</h2>
        <div className="grid gap-4">
          {modulesData.map((mod) => {
            const allLessons = getLessonsForModule(mod.id);
            const validLessons = allLessons.filter(l => !l.title.includes(' - Pelajaran ') && !l.title.includes('TODO'));
            const modCompletedCount = validLessons.filter(l => progress.completedLessons.includes(l.id)).length;
            const isCompleted = modCompletedCount === validLessons.length && validLessons.length > 0;
            const estimatedMins = validLessons.reduce((sum, l) => sum + (l.estimatedMinutes || 5), 0);
            
            let isUnlocked = true; // Semua modul bisa diklik jika bukan draft

            const isDraft = mod.status === 'draft';
            const modQuizPassed = progress.quizScores[mod.id]?.passed;
            const isCompletedWithQuiz = isCompleted && modQuizPassed;

            return (
              <Link 
                key={mod.id} 
                to={isUnlocked && !isDraft ? `/module/${mod.id}` : '#'}
                className={`block p-4 rounded-xl border ${
                  isUnlocked && !isDraft
                    ? 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer' 
                    : 'bg-gray-50 border-gray-100 opacity-70 cursor-not-allowed'
                }`}
              >
                <div className="flex gap-4 items-start">
                  <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    isCompletedWithQuiz ? 'bg-green-100 text-green-600' :
                    isUnlocked && !isDraft ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {mod.order}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold ${!isUnlocked || isDraft ? 'text-gray-500' : 'text-gray-900'}`}>
                        {mod.title}
                      </h3>
                      {isDraft && (
                        <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          Segera Hadir
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {modCompletedCount}/{validLessons.length || mod.lessonCount} pelajaran
                      </span>
                      <span className="flex items-center gap-1">
                        {modQuizPassed ? <CheckCircle className="w-3 h-3 text-green-500" /> : <div className="w-3 h-3 rounded-full border border-gray-400" />}
                        Quiz: {progress.quizScores[mod.id] ? `${progress.quizScores[mod.id].score}%` : '0%'} ({modQuizPassed ? 'Lulus' : 'Belum'})
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ~{Math.round(estimatedMins / 60) > 0 ? `${Math.round(estimatedMins / 60)} jam` : `${estimatedMins} mnt`}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
