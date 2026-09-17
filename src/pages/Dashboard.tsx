import { Link } from 'react-router-dom';
import modulesData from '../../content/modules.json';
import { BookOpen, CheckCircle, Lock } from 'lucide-react';
import { useStorage } from '../hooks/useStorage';

export default function Dashboard() {
  const { progress } = useStorage();
  
  const totalLessons = modulesData.reduce((sum, m) => sum + m.lessonCount, 0);
  const completedLessons = progress.completedLessons.length;
  const progressPercent = Math.round((completedLessons / totalLessons) * 100) || 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold mb-2">Belajar Java</h1>
        <p className="text-gray-600">Dari pemula sampai mahir dengan interaktif.</p>
      </header>

      {/* Total Progress */}
      <section className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
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
      </section>

      {/* Module List */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold">Daftar Modul</h2>
        <div className="grid gap-4">
          {modulesData.map((mod) => {
            // Unlocked if it's the first module, or explicitly unlocked, or previous is completed (for now we simplify: always unlocked to easily test)
            const isUnlocked = true; // For testing we make all true temporarily, or we could use progress.moduleStatus
            // Actually let's just make them all unlocked since the user requested "opsi buka semua modul" and it's their personal project
            const isCompleted = false;

            return (
              <Link 
                key={mod.id} 
                to={isUnlocked ? `/module/${mod.id}` : '#'}
                className={`block p-4 rounded-xl border ${
                  isUnlocked 
                    ? 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer' 
                    : 'bg-gray-50 border-gray-100 opacity-70 cursor-not-allowed'
                }`}
              >
                <div className="flex gap-4 items-start">
                  <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    isCompleted ? 'bg-green-100 text-green-600' :
                    isUnlocked ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {mod.order}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={`font-bold ${!isUnlocked ? 'text-gray-500' : 'text-gray-900'}`}>
                      {mod.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {mod.lessonCount} pelajaran
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-gray-400">
                    {isCompleted ? <CheckCircle className="text-green-500 w-6 h-6" /> :
                     isUnlocked ? <span className="text-blue-500 text-sm font-medium">Buka</span> :
                     <Lock className="w-5 h-5" />}
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
