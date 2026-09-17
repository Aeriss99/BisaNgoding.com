import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle, Lock, Trophy } from 'lucide-react';
import { modulesData, getLessonsForModule } from '../lib/content';
import { useProgress } from '../context/ProgressContext';

export default function ModuleDetail() {
  const { moduleId } = useParams();
  const mod = modulesData.find(m => m.id === moduleId);
  const { progress } = useProgress();

  if (!mod) {
    return <div className="p-8 text-center text-red-500">Modul tidak ditemukan</div>;
  }

  // Filter out skeletons
  const allLessons = getLessonsForModule(mod.id);
  const validLessons = allLessons.filter(l => !l.title.includes(' - Pelajaran ') && !l.title.includes('TODO'));

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
        {validLessons.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Belum ada pelajaran yang tersedia dalam modul ini.
          </div>
        )}
        
        {validLessons.map((lesson, i) => {
          const isCompleted = progress.completedLessons.includes(lesson.id);
          
          // Semua pelajaran bisa dibuka tanpa urutan
          let isUnlocked = true;

          return (
            <Link 
              key={lesson.id} 
              to={isUnlocked ? `/lesson/${lesson.id}` : '#'}
              className={`flex items-center p-4 border-b border-gray-100 ${
                isUnlocked ? 'hover:bg-gray-50 cursor-pointer' : 'opacity-60 cursor-not-allowed bg-gray-50'
              }`}
            >
              <div className="w-8 flex-shrink-0 text-center font-bold text-gray-400">
                {i + 1}
              </div>
              <div className="flex-1 px-4 font-medium text-gray-900">
                {lesson.title}
              </div>
              <div className="flex-shrink-0 text-gray-400">
                {isCompleted ? <CheckCircle className="w-5 h-5 text-green-500" /> :
                 isUnlocked ? <BookOpen className="w-5 h-5 text-blue-500" /> :
                 <Lock className="w-4 h-4" />}
              </div>
            </Link>
          );
        })}

        {/* Quiz Button */}
        {validLessons.length > 0 && (
          <Link
            to={`/quiz/${mod.id}`}
            className={`flex items-center p-4 border-t-2 border-gray-100 hover:bg-blue-50 cursor-pointer bg-blue-50/50`}
          >
            <div className="w-8 flex-shrink-0 text-center font-bold text-blue-400">
              <Trophy className="w-5 h-5 mx-auto" />
            </div>
            <div className="flex-1 px-4 font-bold text-blue-900">
              Quiz Akhir Modul
              {progress.quizScores[mod.id] && (
                <span className={`ml-3 text-xs px-2 py-1 rounded-full ${progress.quizScores[mod.id].passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  Skor: {progress.quizScores[mod.id].score}%
                </span>
              )}
            </div>
            <div className="flex-shrink-0 text-gray-400">
              {progress.quizScores[mod.id]?.passed ? <CheckCircle className="w-5 h-5 text-green-500" /> :
               <BookOpen className="w-5 h-5 text-blue-500" />}
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
