import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle, ChevronRight, Clock, Search } from 'lucide-react';
import { coursesData, modulesData, getVisibleLessons, checkModuleUnlocked } from '../lib/content';
import { useProgress } from '../context/ProgressContext';

export default function CourseDetail() {
  const { courseId } = useParams();
  const course = coursesData.find((c) => c.id === courseId);
  const { progress } = useProgress();
  const [searchQuery, setSearchQuery] = useState('');

  if (!course) {
    return <Navigate to="/" replace />;
  }

  const courseModules = modulesData
    .filter((m) => (m.courseId || 'java') === course.id && m.status !== 'draft')
    .sort((a, b) => a.order - b.order);

  let totalLessons = 0;
  let completedLessons = 0;
  let totalMinutes = 0;
  let nextLessonUrl = '';

  const modulesWithInfo = courseModules.map((mod) => {
    const lessons = getVisibleLessons(mod.id);
    const modTotal = lessons.length;
    const modCompleted = lessons.filter((l) => progress.completedLessons.includes(l.id)).length;
    const modMinutes = lessons.reduce((sum, l) => sum + (l.estimatedMinutes || 5), 0);

    totalLessons += modTotal;
    completedLessons += modCompleted;
    totalMinutes += modMinutes;

    if (!nextLessonUrl) {
      const berikutnya = lessons.find((l) => !progress.completedLessons.includes(l.id));
      if (berikutnya) nextLessonUrl = `/lesson/${berikutnya.id}`;
    }

    return { mod, modTotal, modCompleted, modMinutes, lessons };
  });

  if (course.status === 'soon' || totalLessons === 0) {
    return <Navigate to="/" replace />;
  }

  if (!nextLessonUrl && modulesWithInfo.length > 0) {
    const first = modulesWithInfo[0];
    if (first.lessons.length > 0) nextLessonUrl = `/lesson/${first.lessons[0].id}`;
  }

  const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const totalHours = Math.round(totalMinutes / 60);

  const filteredModules = modulesWithInfo.filter(({ mod, lessons }) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (mod.title.toLowerCase().includes(q)) return true;
    return lessons.some((l) => l.title.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 md:px-6 py-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <Link
            to="/"
            className="p-2 brutal-btn bg-white rounded-xl flex items-center justify-center shrink-0 border-2 border-[var(--color-text-main)] shadow-[2px_2px_0_var(--color-text-main)]"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <div className="inline-block bg-[var(--color-text-main)] text-white px-2 py-1 rounded text-xs font-bold font-mono mb-2">
              KELAS
            </div>
            <h1 className="text-3xl md:text-4xl font-space font-extrabold">{course.title}</h1>
            <p className="font-sans text-gray-600 mt-2 font-medium">{course.description}</p>
          </div>
        </div>
      </header>

      {/* Progress & Continue */}
      <div className="brutal-card-big bg-[var(--color-primary)] p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="w-full md:w-1/2">
            <div className="flex justify-between items-end mb-2">
              <span className="font-bold text-gray-800">Progres Kelas</span>
              <span className="font-space text-2xl">{percent}%</span>
            </div>
            <div className="w-full bg-[var(--color-primary-light)] rounded-full h-4 border-2 border-[var(--color-text-main)] overflow-hidden">
              <div
                className="bg-[var(--color-accent)] h-full transition-all duration-500 border-r-2 border-[var(--color-text-main)]"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-3 text-sm font-bold text-gray-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> {completedLessons}/{totalLessons} selesai
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" /> ~{totalHours} jam
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto">
            {nextLessonUrl ? (
              <Link
                to={nextLessonUrl}
                className="w-full brutal-btn bg-[var(--color-accent)] text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 text-lg shadow-[4px_4px_0_var(--color-text-main)]"
              >
                Lanjutkan Belajar <ChevronRight className="w-6 h-6" />
              </Link>
            ) : (
              <button
                disabled
                className="w-full bg-gray-400 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 text-lg border-2 border-[var(--color-text-main)]"
              >
                Belum Ada Materi
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-500" />
        </div>
        <input
          type="text"
          placeholder="Cari modul atau materi di kelas ini..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-4 rounded-xl border-2 brutal-border font-sans font-medium text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      {/* Module List */}
      <div className="space-y-4">
        {filteredModules.length === 0 && (
          <div className="p-8 text-center text-gray-500 brutal-card rounded-xl bg-white">
            <p className="font-bold">Tidak ada modul yang cocok dengan pencarian.</p>
          </div>
        )}

        {filteredModules.map(({ mod, modTotal, modCompleted, modMinutes }, index) => {
          const isProject = mod.id.includes('todolist');
          const modPercent = modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0;

          const isModuleUnlocked = checkModuleUnlocked(mod, progress);

          let statusBadge = { label: 'BELUM MULAI', bg: 'bg-white text-[var(--color-text-main)]' };
          if (modPercent === 100) {
            statusBadge = { label: 'SELESAI', bg: 'bg-[var(--color-success)] text-white' };
          } else if (modPercent > 0) {
            statusBadge = { label: 'SEDANG', bg: 'bg-[var(--color-accent-light)] text-[var(--color-text-main)]' };
          } else if (isProject) {
            statusBadge = { label: 'PROYEK', bg: 'bg-[var(--color-primary-light)] text-[var(--color-text-main)]' };
          }

          if (!isModuleUnlocked) {
            const reqTitle = mod.requires 
              ? courseModules.find(m => m.id === mod.requires)?.title 
              : courseModules[index - 1]?.title;
            return (
              <div
                key={mod.id}
                title={`Selesaikan ${reqTitle || 'modul sebelumnya'} dulu`}
                className="flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-xl border-[3px] border-[var(--color-landing-black)] bg-gray-100 opacity-75 cursor-not-allowed select-none"
              >
                <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center font-space text-2xl border-[3px] border-gray-400 bg-gray-300 text-gray-500">
                  {mod.order}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-space text-xl text-gray-500 line-through">
                      {mod.title}
                    </h3>
                    <div className="bg-gray-300 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-400">
                      TERKUNCI
                    </div>
                  </div>
                  <p className="text-xs font-medium text-red-500 mt-1">Selesaikan {reqTitle || 'modul sebelumnya'} dulu</p>
                  <div className="flex flex-wrap items-center gap-3 text-sm font-mono font-bold text-gray-400 mt-2">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" /> {modTotal} materi
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> ~{Math.round(modMinutes / 60)}j
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 hidden md:block">
                  <Lock className="w-8 h-8 text-gray-400" />
                </div>
              </div>
            );
          }

          return (
            <Link
              key={mod.id}
              to={`/module/${mod.id}`}
              className="flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-xl brutal-card bg-white hover:-translate-y-1 transition-transform group"
            >
              <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center font-space text-2xl border-2 border-[var(--color-text-main)] shadow-[2px_2px_0_var(--color-text-main)] bg-[var(--color-primary)] group-hover:scale-110 transition-transform">
                {mod.order}
              </div>

              <div className="flex-1">
                <h3 className="font-space text-xl mb-2 group-hover:text-[var(--color-accent)] transition-colors">
                  {mod.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-sm font-mono font-bold text-gray-500">
                  <div className={`px-2 py-0.5 rounded border-2 border-[var(--color-text-main)] ${statusBadge.bg} text-[10px]`}>
                    {statusBadge.label}
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" /> {modCompleted}/{modTotal} materi
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> ~{Math.round(modMinutes / 60)}j
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 hidden md:block">
                {modPercent === 100 ? (
                  <CheckCircle className="w-8 h-8 text-[var(--color-success)] drop-shadow-[1px_1px_0_#1A1A1A]" />
                ) : (
                  <ChevronRight className="w-8 h-8 text-gray-400 group-hover:text-[var(--color-text-main)] transition-colors" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
