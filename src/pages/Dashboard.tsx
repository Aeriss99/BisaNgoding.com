import { Link } from 'react-router-dom';
import {
  BookOpen,
 
  ChevronRight,
  Clock,
  Lock,
  X,
} from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import {
  modulesData,
  coursesData,
  getVisibleLessons,
 
} from '../lib/content';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const { progress, daysUntilReset, inactiveDaysConfig } = useProgress();
  const { user, isSupabaseConfigured } = useAuth();
  const [showBanner, setShowBanner] = useState(true);

  const [lastCourseId] = useState(() => {
    return localStorage.getItem('lastCourse') || coursesData[0].id;
  });

  useEffect(() => {
    const hidden = localStorage.getItem('hide_login_banner');
    if (hidden === 'true') setShowBanner(false);
  }, []);

  const hideBanner = () => {
    localStorage.setItem('hide_login_banner', 'true');
    setShowBanner(false);
  };

  const courseInfo = coursesData.sort((a, b) => a.order - b.order).map((course) => {
    const courseModules = modulesData.filter(m => (m.courseId || 'java') === course.id);
    const readyModules = courseModules.filter(m => m.status !== 'draft');
    
    let totalLessons = 0;
    let completedLessons = 0;
    let totalMinutes = 0;

    readyModules.forEach((mod) => {
      const lessons = getVisibleLessons(mod.id);
      totalLessons += lessons.length;
      totalMinutes += lessons.reduce((sum, l) => sum + (l.estimatedMinutes || 5), 0);
      completedLessons += lessons.filter(l => progress.completedLessons.includes(l.id)).length;
    });

    const isReady = course.status !== 'soon';
    const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const hours = Math.round(totalMinutes / 60);

    return { course, totalLessons, completedLessons, percent, hours, isReady };
  });

  const lastCourse = courseInfo.find(c => c.course.id === lastCourseId) || courseInfo[0];

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-10 py-4 md:py-6 lg:py-10 space-y-8 md:space-y-12">
      {isSupabaseConfigured && !user && showBanner && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 flex items-start gap-3 relative brutal-border">
          <div className="text-sm font-medium pr-6">
            Masuk agar progresmu tersimpan di semua perangkat.
          </div>
          <button
            onClick={hideBanner}
            className="absolute top-2 right-2 p-1 hover:bg-blue-100 rounded"
          >
            <X className="w-4 h-4 text-blue-800" />
          </button>
        </div>
      )}

      <header className="flex justify-between items-start gap-4 mb-4 pt-2">
        <div>
          <div className="font-mono text-sm font-bold text-[var(--color-accent)] mb-1 pt-1">
            // dashboard
          </div>
          <h1 className="text-3xl md:text-4xl font-space mb-2">
            Halo, {user?.user_metadata?.full_name?.split(' ')[0] || 'Pelajar'}.
            Lanjut ngoding?
          </h1>
          <p className="font-sans text-[var(--color-text-secondary)] font-medium text-lg">
            Dari pemula sampai mahir, pilih kelas yang ingin kamu pelajari.
          </p>
        </div>

        {inactiveDaysConfig > 0 && (
          <div className="hidden md:flex bg-[var(--color-danger-light)] border-2 border-[var(--color-text-main)] rounded-xl p-3 items-start gap-3 shadow-[3px_3px_0_var(--color-text-main)] max-w-sm shrink-0">
            <Clock className="w-5 h-5 text-[var(--color-danger)] shrink-0 mt-0.5" />
            <div className="text-sm font-sans font-medium text-[var(--color-danger)]">
              {daysUntilReset !== null && daysUntilReset <= 2 ? (
                <>
                  <span className="font-bold">Sisa {daysUntilReset} hari</span>{' '}
                  sebelum progres direset.
                </>
              ) : (
                <>
                  Progres direset jika tidak aktif {inactiveDaysConfig} hari.
                  Terakhir belajar: {progress.lastActiveDate}.
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Bagian Progres Atas - Kelas Terakhir Dipelajari */}
      {lastCourse && lastCourse.isReady && (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          <section className="brutal-card-big bg-[var(--color-primary)] p-6 md:p-8 flex flex-col justify-between md:w-3/5 order-1">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="bg-[var(--color-text-main)] text-white font-bold font-sans text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                  TERAKHIR DIPELAJARI
                </span>
                <span className="font-bold text-gray-800">
                  {lastCourse.course.title}
                </span>
              </div>

              <div className="mb-8">
                <h3 className="text-3xl font-space leading-tight mb-2">
                  Lanjutkan Belajarmu
                </h3>
                <p className="font-sans font-medium text-lg text-gray-800">
                  {lastCourse.course.description}
                </p>
              </div>

              <div className="mb-8">
                <div className="w-full bg-[var(--color-primary-light)] rounded-full h-4 border-2 border-[var(--color-text-main)] overflow-hidden flex">
                  <div
                    className="bg-[var(--color-accent)] h-full transition-all duration-500 border-r-2 border-[var(--color-text-main)]"
                    style={{ width: `${lastCourse.percent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2 text-sm font-bold text-gray-800">
                  <span>
                    {lastCourse.completedLessons}/{lastCourse.totalLessons} pelajaran selesai
                  </span>
                  <span>{lastCourse.percent}%</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-auto">
              <Link
                to={`/kelas/${lastCourse.course.id}`}
                onClick={() => localStorage.setItem('lastCourse', lastCourse.course.id)}
                className="w-full md:w-auto brutal-btn bg-[var(--color-accent)] text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2"
              >
                Masuk ke Kelas <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </section>

          {/* Kartu "Progres Total Kelas" */}
          <section className="brutal-card-big p-6 md:p-8 flex flex-col justify-center items-center md:w-2/5 order-3 md:order-2 bg-white">
            <div className="relative w-32 h-32 md:w-40 md:h-40 mb-6 flex items-center justify-center">
              {/* SVG Donut Chart */}
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="var(--color-primary-light)"
                  strokeWidth="12"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="12"
                  strokeDasharray="251.2"
                  strokeDashoffset={
                    251.2 - (251.2 * lastCourse.percent) / 100
                  }
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                {/* Inner stroke for brutalism effect */}
                <circle cx="50" cy="50" r="34" fill="none" stroke="#111111" strokeWidth="2" />
                <circle cx="50" cy="50" r="46" fill="none" stroke="#111111" strokeWidth="2" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-space text-2xl md:text-3xl">
                  {lastCourse.percent}%
                </span>
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="font-space text-2xl">
                {lastCourse.completedLessons} / {lastCourse.totalLessons}
              </div>
              <div className="text-sm font-medium text-[var(--color-text-secondary)]">
                pelajaran selesai
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Chip Reset Mobile */}
      {inactiveDaysConfig > 0 && (
        <div className="md:hidden bg-[var(--color-danger-light)] border-2 border-[var(--color-text-main)] rounded-xl p-4 flex items-start gap-3 shadow-[3px_3px_0_var(--color-text-main)] w-full">
          <Clock className="w-5 h-5 text-[var(--color-danger)] shrink-0 mt-0.5" />
          <div className="text-sm font-sans font-medium text-[var(--color-danger)]">
            {daysUntilReset !== null && daysUntilReset <= 2 ? (
              <>
                <span className="font-bold">Sisa {daysUntilReset} hari</span>{' '}
                sebelum progres direset.
              </>
            ) : (
              <>
                Progres direset jika tidak aktif {inactiveDaysConfig} hari.
                Terakhir belajar: {progress.lastActiveDate}.
              </>
            )}
          </div>
        </div>
      )}

      {/* Daftar Semua Kelas */}
      <section className="space-y-6 mt-12">
        <div className="flex items-end justify-between border-b-2 border-[var(--color-text-main)] pb-3">
          <h2 className="text-2xl font-space">Daftar Kelas</h2>
          <div className="text-sm font-mono font-bold text-gray-500">
            {courseInfo.length} kelas
          </div>
        </div>

        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {courseInfo.map(({ course, totalLessons, completedLessons, percent, hours, isReady }) => {
            if (!isReady) {
              return (
                <div
                  key={course.id}
                  className="bg-gray-200 border-[3px] border-[var(--color-landing-black)] shadow-[4px_4px_0_#111111] h-full flex flex-col opacity-75 brutal-border rounded-xl"
                >
                  <div className="h-32 bg-gray-300 border-b-[3px] border-[var(--color-landing-black)] flex items-center justify-center relative rounded-t-lg">
                    <Lock className="w-12 h-12 text-gray-500" />
                    <div className="absolute top-4 left-4 bg-[var(--color-landing-black)] text-white px-2 py-1 font-bungee text-xs">
                      {course.language.toUpperCase()}
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <h3 className="font-bungee text-lg leading-tight mb-2 text-gray-600">
                        {course.title}
                      </h3>
                      <p className="font-barlow font-bold text-gray-500 text-sm">
                        SEGERA HADIR
                      </p>
                    </div>
                    <button
                      disabled
                      className="w-full bg-gray-400 text-white border-[3px] border-[var(--color-landing-black)] py-2 font-bungee text-sm"
                    >
                      BELUM TERSEDIA
                    </button>
                  </div>
                </div>
              );
            }

            let statusBadge = {
              label: 'BELUM MULAI',
              bg: 'bg-white text-[var(--color-text-main)]',
            };
            if (percent === 100) {
              statusBadge = {
                label: 'SELESAI',
                bg: 'bg-[var(--color-success)] text-white',
              };
            } else if (percent > 0) {
              statusBadge = {
                label: 'SEDANG',
                bg: 'bg-[var(--color-accent-light)] text-[var(--color-text-main)]',
              };
            }

            return (
              <Link
                key={course.id}
                to={`/kelas/${course.id}`}
                onClick={() => localStorage.setItem('lastCourse', course.id)}
                className="brutal-card-big p-5 md:p-7 flex flex-col h-full bg-white group rounded-xl"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full border-[3px] border-[var(--color-text-main)] flex items-center justify-center font-space text-lg bg-[var(--color-primary)] shrink-0 shadow-[2px_2px_0_var(--color-text-main)] group-hover:scale-110 transition-transform">
                    {course.language.toUpperCase().substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-space text-lg leading-tight mb-2 group-hover:text-[var(--color-accent)] transition-colors">
                      {course.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <div
                        className={`inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded border-2 border-[var(--color-text-main)] ${statusBadge.bg}`}
                      >
                        {statusBadge.label}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto space-y-4">
                  <div className="w-full bg-[var(--color-bg-base)] rounded-full h-2.5 border-2 border-[var(--color-text-main)] overflow-hidden">
                    <div
                      className="bg-[var(--color-accent)] h-full border-r-2 border-[var(--color-text-main)]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-mono font-bold text-[var(--color-text-secondary)]">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> {completedLessons}/
                      {totalLessons}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> ~
                      {hours}j
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
