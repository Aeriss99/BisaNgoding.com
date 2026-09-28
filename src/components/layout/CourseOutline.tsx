import { Link, useLocation } from 'react-router-dom';
import { coursesData, modulesData, getVisibleLessons, getModule, checkModuleUnlocked } from '../../lib/content';
import { useProgress } from '../../context/ProgressContext';
import { CheckCircle, Lock, Circle } from 'lucide-react';
import { useEffect } from 'react';

interface CourseOutlineProps {
  onClose?: () => void;
}

export default function CourseOutline({ onClose }: CourseOutlineProps) {
  const location = useLocation();
  const { progress } = useProgress();

  let courseId = 'java';
  let activeModuleId = '';

  if (location.pathname.startsWith('/kelas/')) {
    courseId = location.pathname.split('/')[2];
  } else if (location.pathname.startsWith('/module/')) {
    activeModuleId = location.pathname.split('/')[2];
    const mod = getModule(activeModuleId);
    if (mod) {
      courseId = mod.courseId || 'java';
    }
  }

  const course = coursesData.find(c => c.id === courseId);
  
  const courseModules = modulesData
    .filter(m => (m.courseId || 'java') === courseId)
    .sort((a, b) => a.order - b.order);

  const readyModules = courseModules.filter(m => m.status !== 'draft');
  const draftModulesCount = courseModules.length - readyModules.length;

  let totalCourseLessons = 0;
  let completedCourseLessons = 0;

  readyModules.forEach(mod => {
    const lessons = getVisibleLessons(mod.id);
    totalCourseLessons += lessons.length;
    completedCourseLessons += lessons.filter(l => progress.completedLessons.includes(l.id)).length;
  });

  const courseProgressPercent = totalCourseLessons > 0 
    ? Math.round((completedCourseLessons / totalCourseLessons) * 100) 
    : 0;

  // Laci ditutup oleh Layout saat pindah halaman. Jangan memanggil onClose() di useEffect:
  // useEffect juga berjalan saat pertama tampil, sehingga laci langsung menutup dirinya sendiri.
  useEffect(() => {
    if (onClose) { // If it's used as a drawer (has onClose)
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [onClose]);

  return (
    <div className="flex flex-col h-full bg-white text-[var(--color-text-main)] overflow-hidden">
      {/* Drawer close button for mobile/tablet */}
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 w-11 h-11 flex items-center justify-center font-bold text-xl hover:bg-gray-100 rounded-full"
          aria-label="Tutup daftar modul"
        >
          ✕
        </button>
      )}

      {/* Header */}
      <div className="p-5 border-b-[3px] border-[var(--color-text-main)] shrink-0">
        <h2 className="font-space text-lg font-bold mb-3 pr-10 uppercase">{course?.title || 'Kelas'}</h2>
        
        <div className="w-full bg-[var(--color-primary-light)] rounded-full h-3 border-2 border-[var(--color-text-main)] overflow-hidden mb-2">
          <div
            className="bg-[var(--color-accent)] h-full border-r-2 border-[var(--color-text-main)]"
            style={{ width: `${courseProgressPercent}%` }}
          />
        </div>
        <div className="font-mono text-xs font-bold flex justify-between">
          <span>{completedCourseLessons}/{totalCourseLessons} Selesai</span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-[env(safe-area-inset-bottom)]">
        {readyModules.map((mod, index) => {
          const unlocked = checkModuleUnlocked(mod, progress);
          const lessons = getVisibleLessons(mod.id);
          const totalLessons = lessons.length;
          const completedLessons = lessons.filter(l => progress.completedLessons.includes(l.id)).length;
          
          let statusIcon;
          if (completedLessons === totalLessons && totalLessons > 0) {
            statusIcon = <CheckCircle className="w-5 h-5 text-[var(--color-success)] shrink-0" />;
          } else if (unlocked) {
            statusIcon = completedLessons > 0 ? (
              <div className="w-5 h-5 rounded-full bg-[var(--color-accent)] border-2 border-[var(--color-text-main)] shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400 shrink-0" />
            );
          } else {
            statusIcon = <Lock className="w-5 h-5 text-gray-400 shrink-0" />;
          }

          const isActive = activeModuleId === mod.id;

          const baseClass = "flex items-start gap-3 p-3 rounded-xl border-2 transition-all w-full text-left";
          
          let sectionHeader = null;
          if (course?.language === 'english') {
            if (mod.id.startsWith('en-d') && (index === 0 || !readyModules[index-1].id.startsWith('en-d'))) {
              sectionHeader = <h3 className="font-space text-sm font-bold mt-4 mb-2 uppercase text-gray-500">English Dasar</h3>;
            } else if (mod.id.startsWith('en-u') && (index === 0 || !readyModules[index-1].id.startsWith('en-u'))) {
              sectionHeader = <h3 className="font-space text-sm font-bold mt-4 mb-2 uppercase text-gray-500">English untuk Dunia IT</h3>;
            }
          }

          if (!unlocked) {
            return (
              <div key={mod.id}>
                {sectionHeader}
                <div className={`${baseClass} border-transparent opacity-60 cursor-not-allowed`}>
                  <div className="pt-0.5">{statusIcon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm leading-tight text-gray-500">{mod.title}</div>
                  </div>
                  <div className="font-mono text-xs text-gray-400 shrink-0">
                    {completedLessons}/{totalLessons}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={mod.id}>
              {sectionHeader}
              <Link 
                to={`/module/${mod.id}`}
                onClick={onClose}
                className={`${baseClass} ${
                  isActive 
                  ? 'bg-[var(--color-primary)] border-[var(--color-text-main)] shadow-[4px_4px_0_var(--color-text-main)]' 
                  : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="pt-0.5">{statusIcon}</div>
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-sm leading-tight ${isActive ? 'text-[var(--color-text-main)]' : ''}`}>
                    {mod.title}
                  </div>
                </div>
                <div className={`font-mono text-xs shrink-0 ${isActive ? 'font-bold' : 'text-gray-500'}`}>
                  {completedLessons}/{totalLessons}
                </div>
              </Link>
            </div>
          );
        })}

        {draftModulesCount > 0 && (
          <details className="mt-4 group">
            <summary className="flex items-center gap-2 p-3 font-bold text-sm text-gray-500 cursor-pointer list-none">
              <span className="text-lg leading-none group-open:rotate-90 transition-transform">▸</span>
              Segera hadir ({draftModulesCount})
            </summary>
            <div className="pl-8 pr-3 pb-3 space-y-2 opacity-50">
              {courseModules.filter(m => m.status === 'draft').map(mod => (
                <div key={mod.id} className="text-sm font-medium text-gray-500 py-1 border-l-2 border-gray-200 pl-3">
                  {mod.title}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
