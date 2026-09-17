import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, PlayCircle, CheckCircle, Lock } from 'lucide-react';
import { modulesData, getLessonsForModule } from '../lib/content';
import { useStorage } from '../hooks/useStorage';

export default function ModuleDetail() {
  const { moduleId } = useParams();
  const mod = modulesData.find(m => m.id === moduleId);
  const { progress } = useStorage();

  if (!mod) {
    return <div className="p-8 text-center text-red-500">Modul tidak ditemukan</div>;
  }

  const lessons = getLessonsForModule(mod.id);

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
            Belum ada pelajaran dalam modul ini.
          </div>
        )}
        
        {lessons.map((lesson, i) => {
          const isCompleted = progress.completedLessons.includes(lesson.id);
          // For now, unlock all if requested, or unlock sequential based on completion
          const isUnlocked = true; 

          return (
            <Link 
              key={lesson.id} 
              to={isUnlocked ? `/lesson/${lesson.id}` : '#'}
              className={`flex items-center p-4 border-b border-gray-100 last:border-0 ${
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
                 isUnlocked ? <PlayCircle className="w-5 h-5 text-blue-500" /> :
                 <Lock className="w-4 h-4" />}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
