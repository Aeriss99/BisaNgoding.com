import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle, ChevronRight, Clock, Lock, X } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { modulesData, getVisibleLessons, getQuizQuestions } from '../lib/content';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const { progress, daysUntilReset, inactiveDaysConfig } = useProgress();
  const { user, isSupabaseConfigured } = useAuth();
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const hidden = localStorage.getItem('hide_login_banner');
    if (hidden === 'true') setShowBanner(false);
  }, []);

  const hideBanner = () => {
    localStorage.setItem('hide_login_banner', 'true');
    setShowBanner(false);
  };

  const moduleInfo = modulesData.map((mod) => {
    const lessons = getVisibleLessons(mod.id);
    const isReady = mod.status !== 'draft' && lessons.length > 0;
    const siap = isReady || progress.unlockAll;
    const selesai = lessons.filter((l) => progress.completedLessons.includes(l.id)).length;
    const menit = lessons.reduce((sum, l) => sum + (l.estimatedMinutes || 5), 0);
    const quiz = progress.quizScores?.[mod.id];
    const adaQuiz = !!getQuizQuestions(mod.id);
    return { mod, lessons, siap, isReady, selesai, menit, quiz, adaQuiz };
  });

  const totalLessons = moduleInfo.reduce(
    (sum, m) => sum + m.mod.lessonCount,
    0
  );
  const totalAvailableLessons = moduleInfo.reduce(
    (sum, m) => sum + (m.isReady ? m.lessons.length : 0),
    0
  );
  const completedLessons = moduleInfo.reduce((sum, m) => sum + m.selesai, 0);
  const progressAvailablePercent = totalAvailableLessons > 0 ? Math.round((completedLessons / totalAvailableLessons) * 100) : 0;
  const progressTotalPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Tombol "Lanjutkan Belajar": pelajaran pertama yang belum selesai di modul siap pertama
  let lanjutUrl = '';
  let activeModule: any = null;
  let nextLesson: any = null;
  let nextQuiz = false;

  for (const info of moduleInfo) {
    if (!info.siap) continue;
    const berikutnya = info.lessons.find((l) => !progress.completedLessons.includes(l.id));
    if (berikutnya) {
      lanjutUrl = `/lesson/${berikutnya.id}`;
      activeModule = info;
      nextLesson = berikutnya;
      break;
    }
    if (info.adaQuiz && !info.quiz?.passed) {
      lanjutUrl = `/quiz/${info.mod.id}`;
      activeModule = info;
      nextQuiz = true;
      break;
    }
  }

  // Jika tidak ada yang in-progress/belum selesai, default ke modul pertama
  if (!lanjutUrl) {
    const pertama = moduleInfo.find((m) => m.siap);
    if (pertama) {
      lanjutUrl = `/lesson/${pertama.lessons[0].id}`;
      activeModule = pertama;
      nextLesson = pertama.lessons[0];
    }
  }

  const activeModuleSelesai = activeModule ? activeModule.selesai : 0;
  const activeModuleTotal = activeModule ? activeModule.lessons.length : 0;
  const activeModulePercent = activeModuleTotal > 0 ? Math.round((activeModuleSelesai / activeModuleTotal) * 100) : 0;
  const activeModuleSisa = activeModuleTotal - activeModuleSelesai;

  const totalModulTersedia = moduleInfo.filter(m => m.isReady).length;
  const modulTuntas = moduleInfo.filter(m => m.isReady && m.selesai === m.lessons.length && (!m.adaQuiz || m.quiz?.passed)).length;
  
  let quizTerkumpul = 0;
  let quizCount = 0;
  let quizTaken = false;
  
  for (const m of moduleInfo) {
    if (m.adaQuiz && progress.quizScores?.[m.mod.id]) {
      quizTaken = true;
      quizTerkumpul += progress.quizScores[m.mod.id].score;
      quizCount++;
    }
  }
  const avgQuiz = quizCount > 0 ? Math.round(quizTerkumpul / quizCount) : 0;
  
  let totalEstimasiSisaMenit = 0;
  for (const m of moduleInfo) {
    if (m.isReady) {
      const sisaLessons = m.lessons.filter(l => !progress.completedLessons.includes(l.id));
      totalEstimasiSisaMenit += sisaLessons.reduce((sum, l) => sum + (l.estimatedMinutes || 5), 0);
    }
  }
  const estimasiSisaJam = Math.round(totalEstimasiSisaMenit / 60);

  return (
    <div className="space-y-6">
      {isSupabaseConfigured && !user && showBanner && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 flex items-start gap-3 relative brutal-border">
          <div className="text-sm font-medium pr-6">
            Masuk agar progresmu tersimpan di semua perangkat.
          </div>
          <button onClick={hideBanner} className="absolute top-2 right-2 p-1 hover:bg-blue-100 rounded">
            <X className="w-4 h-4 text-blue-800" />
          </button>
        </div>
      )}

      <header className="flex justify-between items-start gap-4 mb-8">
        <div>
          <div className="font-mono text-sm font-bold text-[var(--color-accent)] mb-1">// dashboard</div>
          <h1 className="text-3xl md:text-4xl font-space mb-2">Halo, {user?.user_metadata?.full_name?.split(' ')[0] || 'Pelajar'}. Lanjut ngoding?</h1>
          <p className="font-sans text-[var(--color-text-secondary)] font-medium text-lg">Dari pemula sampai mahir, satu pelajaran setiap hari.</p>
        </div>
        
        {inactiveDaysConfig > 0 && (
          <div className="hidden md:flex bg-[var(--color-danger-light)] border-2 border-[var(--color-text-main)] rounded-xl p-3 items-start gap-3 shadow-[3px_3px_0_var(--color-text-main)] max-w-sm shrink-0">
            <Clock className="w-5 h-5 text-[var(--color-danger)] shrink-0 mt-0.5" />
            <div className="text-sm font-sans font-medium text-[var(--color-danger)]">
              {daysUntilReset !== null && daysUntilReset <= 2 ? (
                <><span className="font-bold">Sisa {daysUntilReset} hari</span> sebelum progres direset.</>
              ) : (
                <>Progres direset jika tidak aktif {inactiveDaysConfig} hari. Terakhir belajar: {progress.lastActiveDate}.</>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Bagian Progres Atas (3/5 dan 2/5) */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Kartu "Lanjutkan Belajar" */}
        <section className="brutal-card-big bg-[var(--color-primary)] p-6 md:p-8 flex flex-col justify-between md:w-3/5 order-1">
          {completedLessons === 0 ? (
            <div className="flex-1 flex flex-col items-start justify-center py-4">
              <h2 className="text-3xl font-space mb-4">Mulai dari Modul 1: Java Dasar</h2>
              <p className="font-sans font-medium text-lg text-gray-800 mb-8 max-w-md">
                Mari mulai perjalanan belajarmu dari dasar-dasar bahasa pemrograman Java.
              </p>
              <Link
                to={lanjutUrl}
                className="brutal-btn bg-[var(--color-accent)] text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 text-lg"
              >
                Mulai Belajar <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <>
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="bg-[var(--color-text-main)] text-white font-bold font-sans text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                    Lanjutkan
                  </span>
                  <span className="font-bold text-gray-800">
                    Modul {activeModule?.mod.order} · {activeModule?.mod.title}
                  </span>
                </div>
                
                <div className="mb-8">
                  <div className="font-mono text-sm font-bold text-gray-700 mb-1">
                    {nextQuiz ? 'Kuis Akhir Modul' : `Pelajaran ${activeModuleSelesai + 1} dari ${activeModuleTotal}`}
                  </div>
                  <h3 className="text-2xl font-space leading-tight">
                    {nextQuiz ? 'Uji Pemahaman Modul' : nextLesson?.title}
                  </h3>
                </div>

                <div className="mb-8">
                  <div className="w-full bg-[var(--color-primary-light)] rounded-full h-4 border-2 border-[var(--color-text-main)] overflow-hidden flex">
                    <div
                      className="bg-[var(--color-accent)] h-full transition-all duration-500 border-r-2 border-[var(--color-text-main)]"
                      style={{ width: `${activeModulePercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2 text-sm font-bold text-gray-800">
                    <span>{activeModuleSelesai}/{activeModuleTotal} selesai · {activeModulePercent}%</span>
                    <span>Tinggal {activeModuleSisa} pelajaran lagi {activeModule?.adaQuiz && '+ kuis akhir'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-auto">
                <Link
                  to={lanjutUrl}
                  className="brutal-btn bg-[var(--color-accent)] text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2"
                >
                  Lanjutkan Belajar <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  to={`/module/${activeModule?.mod.id}`}
                  className="brutal-btn bg-white text-[var(--color-text-main)] font-bold py-3 px-6 rounded-xl flex items-center justify-center"
                >
                  Lihat daftar pelajaran
                </Link>
              </div>
            </>
          )}
        </section>

        {/* Chip Reset Mobile */}
        {inactiveDaysConfig > 0 && (
          <div className="md:hidden order-2 bg-[var(--color-danger-light)] border-2 border-[var(--color-text-main)] rounded-xl p-4 flex items-start gap-3 shadow-[3px_3px_0_var(--color-text-main)] w-full">
            <Clock className="w-5 h-5 text-[var(--color-danger)] shrink-0 mt-0.5" />
            <div className="text-sm font-sans font-medium text-[var(--color-danger)]">
              {daysUntilReset !== null && daysUntilReset <= 2 ? (
                <><span className="font-bold">Sisa {daysUntilReset} hari</span> sebelum progres direset.</>
              ) : (
                <>Progres direset jika tidak aktif {inactiveDaysConfig} hari. Terakhir belajar: {progress.lastActiveDate}.</>
              )}
            </div>
          </div>
        )}

        {/* Kartu "Progres Total" */}
        <section className="brutal-card-big p-6 md:p-8 flex flex-col justify-center items-center md:w-2/5 order-3 md:order-2 bg-white">
          <div className="relative w-40 h-40 mb-6 hidden md:flex items-center justify-center">
            {/* SVG Donut Chart */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
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
                strokeDashoffset={251.2 - (251.2 * progressAvailablePercent) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              {/* Inner stroke for brutalism effect */}
              <circle cx="50" cy="50" r="34" fill="none" stroke="#111111" strokeWidth="2" />
              <circle cx="50" cy="50" r="46" fill="none" stroke="#111111" strokeWidth="2" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-space text-3xl">{progressAvailablePercent}%</span>
            </div>
          </div>
          
          <div className="text-center mb-6">
            {/* Tampilan Bar Khusus Mobile */}
            <div className="md:hidden w-full mb-4">
              <div className="flex justify-between items-end mb-2">
                <span className="font-space text-2xl">{progressAvailablePercent}%</span>
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">{completedLessons} / {totalAvailableLessons} selesai</span>
              </div>
              <div className="w-full bg-[var(--color-primary-light)] rounded-full h-4 border-2 border-[var(--color-text-main)] overflow-hidden">
                <div
                  className="bg-[var(--color-accent)] h-full border-r-2 border-[var(--color-text-main)]"
                  style={{ width: `${progressAvailablePercent}%` }}
                />
              </div>
            </div>

            <div className="hidden md:block font-space text-2xl">{completedLessons} / {totalAvailableLessons}</div>
            <div className="text-sm font-medium text-[var(--color-text-secondary)]">pelajaran dari materi yang sudah tersedia</div>
          </div>

          <div className="w-full border-t-2 border-dashed border-gray-300 pt-5 mt-auto">
            <div className="w-full bg-[var(--color-bg-base)] rounded-full h-2 border-2 border-[var(--color-text-main)] overflow-hidden">
              <div
                className="bg-[var(--color-text-main)] h-full"
                style={{ width: `${progressTotalPercent}%` }}
              />
            </div>
            <div className="text-xs font-mono font-bold text-gray-500 mt-2 text-center">
              Seluruh kurikulum: {completedLessons} / {totalLessons} · {progressTotalPercent}%
            </div>
          </div>
        </section>
      </div>

      {/* 4 Kartu Statistik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="brutal-card p-4 flex flex-col justify-between h-full bg-white">
          <div className="text-xs font-mono font-bold text-[var(--color-text-secondary)] mb-2 uppercase">Pelajaran Selesai</div>
          <div className="text-3xl font-space">{completedLessons}</div>
        </div>
        <div className="brutal-card p-4 flex flex-col justify-between h-full bg-white">
          <div className="text-xs font-mono font-bold text-[var(--color-text-secondary)] mb-2 uppercase">Modul Tuntas</div>
          <div className="text-3xl font-space">{modulTuntas} <span className="text-base font-sans text-gray-500 font-medium">/ {totalModulTersedia} tersedia</span></div>
        </div>
        <div className="brutal-card p-4 flex flex-col justify-between h-full bg-white">
          <div className="text-xs font-mono font-bold text-[var(--color-text-secondary)] mb-2 uppercase">Kuis Akhir Modul</div>
          <div className="text-3xl font-space">
            {quizTaken ? `${avgQuiz}%` : <span className="text-lg font-sans text-gray-500 font-medium">Belum dikerjakan</span>}
          </div>
        </div>
        <div className="brutal-card p-4 flex flex-col justify-between h-full bg-white">
          <div className="text-xs font-mono font-bold text-[var(--color-text-secondary)] mb-2 uppercase">Estimasi Sisa Waktu</div>
          <div className="text-3xl font-space">{estimasiSisaJam > 0 ? `~${estimasiSisaJam} jam` : '< 1 jam'}</div>
        </div>
      </div>

      {/* Modul Tersedia */}
      <section className="space-y-6 mt-12">
        <div className="flex items-end justify-between border-b-2 border-[var(--color-text-main)] pb-3">
          <h2 className="text-2xl font-space">Modul tersedia</h2>
          <div className="text-sm font-mono font-bold text-gray-500">
            {totalModulTersedia} modul · {totalAvailableLessons} pelajaran
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {moduleInfo.filter(m => m.siap).map(({ mod, lessons, selesai, menit, quiz, adaQuiz }) => {
            const isProject = mod.id.includes('todolist');
            const percent = lessons.length > 0 ? Math.round((selesai / lessons.length) * 100) : 0;
            
            let statusBadge = { label: 'BELUM MULAI', bg: 'bg-white text-[var(--color-text-main)]' };
            if (percent === 100 && (!adaQuiz || quiz?.passed)) {
              statusBadge = { label: 'SELESAI', bg: 'bg-[var(--color-success)] text-white' };
            } else if (percent > 0) {
              statusBadge = { label: 'SEDANG', bg: 'bg-[var(--color-accent-light)] text-[var(--color-text-main)]' };
            } else if (isProject) {
              statusBadge = { label: 'PROYEK', bg: 'bg-[var(--color-primary-light)] text-[var(--color-text-main)]' };
            }

            return (
              <Link
                key={mod.id}
                to={`/module/${mod.id}`}
                className="brutal-card-big p-5 flex flex-col h-full bg-white group"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full border-[3px] border-[var(--color-text-main)] flex items-center justify-center font-space text-xl bg-[var(--color-primary)] shrink-0 shadow-[2px_2px_0_var(--color-text-main)] group-hover:scale-110 transition-transform">
                    {mod.order}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-space text-lg leading-tight mb-2 group-hover:text-[var(--color-accent)] transition-colors">{mod.title}</h3>
                    <div className={`inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded border-2 border-[var(--color-text-main)] ${statusBadge.bg}`}>
                      {statusBadge.label}
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
                      <BookOpen className="w-3.5 h-3.5" /> {selesai}/{lessons.length}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> ~{Math.round(menit / 60)}j
                    </div>
                    {adaQuiz && (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> 
                        Kuis: {quiz ? `${quiz.score}%` : 'Blm'}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Segera Hadir */}
      <section className="space-y-4 mt-12 pt-8 border-t-2 border-dashed border-gray-300">
        <h2 className="text-xl font-space text-gray-500">Segera hadir</h2>
        <div className="flex flex-wrap gap-4">
          {moduleInfo.filter(m => !m.siap).map(({ mod }) => (
            <div
              key={mod.id}
              className="flex items-center gap-3 h-[56px] px-4 bg-[var(--color-bg-base)] border-2 border-dashed border-[#8A8578] rounded-xl opacity-70 w-full md:w-[calc(50%-0.5rem)] xl:w-[calc(33.333%-0.67rem)]"
            >
              <div className="font-mono font-bold text-gray-500">
                {String(mod.order).padStart(2, '0')}
              </div>
              <div className="font-sans font-bold text-gray-600 flex-1 truncate">
                {mod.title}
              </div>
              <Lock className="w-4 h-4 text-gray-400 shrink-0" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
