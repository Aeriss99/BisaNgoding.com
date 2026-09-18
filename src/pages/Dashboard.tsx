import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle, ChevronRight, Clock, AlertTriangle, RefreshCw, Lock } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { modulesData, getVisibleLessons, getQuizQuestions } from '../lib/content';

export default function Dashboard() {
  const { progress, daysUntilReset } = useProgress();

  // Modul dianggap siap hanya jika BUKAN draft DAN benar-benar punya pelajaran
  const moduleInfo = modulesData.map((mod) => {
    const lessons = getVisibleLessons(mod.id);
    const siap = mod.status !== 'draft' && lessons.length > 0;
    const selesai = lessons.filter((l) => progress.completedLessons.includes(l.id)).length;
    const menit = lessons.reduce((sum, l) => sum + (l.estimatedMinutes || 5), 0);
    const quiz = progress.quizScores?.[mod.id];
    const adaQuiz = !!getQuizQuestions(mod.id);
    return { mod, lessons, siap, selesai, menit, quiz, adaQuiz };
  });

  const totalLessons = moduleInfo.reduce(
    (sum, m) => sum + (m.siap ? m.lessons.length : m.mod.lessonCount),
    0
  );
  const completedLessons = moduleInfo.reduce((sum, m) => sum + m.selesai, 0);
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Tombol "Lanjutkan Belajar": pelajaran pertama yang belum selesai di modul siap pertama
  let lanjutUrl = '/';
  for (const info of moduleInfo) {
    if (!info.siap) continue;
    const berikutnya = info.lessons.find((l) => !progress.completedLessons.includes(l.id));
    if (berikutnya) {
      lanjutUrl = `/lesson/${berikutnya.id}`;
      break;
    }
    if (info.adaQuiz && !info.quiz?.passed) {
      lanjutUrl = `/quiz/${info.mod.id}`;
      break;
    }
  }
  if (lanjutUrl === '/') {
    const pertama = moduleInfo.find((m) => m.siap);
    if (pertama) lanjutUrl = `/lesson/${pertama.lessons[0].id}`;
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2">Belajar Java</h1>
          <p className="text-gray-700 font-medium">Dari pemula sampai mahir dengan interaktif.</p>
        </div>
        <div className="hidden lg:block brutal-card rounded-2xl bg-white p-4 shrink-0 w-[320px]">
          <img src="/illustrations/undraw_teaching_58yg.svg" alt="" aria-hidden="true" loading="lazy" className="pointer-events-none w-full max-w-[320px] mx-auto h-auto" />
        </div>
      </header>

      {progress.justReset && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold">Progres direset otomatis.</span> Kamu tidak aktif dalam waktu
            lama, jadi semua progres, XP, dan streak dikembalikan ke awal.
          </div>
        </div>
      )}

      {!progress.justReset && daysUntilReset !== null && daysUntilReset <= 2 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 flex items-start gap-3">
          <RefreshCw className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold">Peringatan:</span> Progresmu akan direset otomatis dalam{' '}
            {daysUntilReset} hari jika tidak ada aktivitas belajar.
          </div>
        </div>
      )}

      <section className="brutal-card p-4 space-y-4">
        <div>
          <div className="flex justify-between text-sm font-medium mb-2">
            <span>Progres Total</span>
            <span className="text-[var(--color-primary)]">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 brutal-border overflow-hidden">
            <div
              className="bg-[var(--color-primary)] h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-2 text-right">
            {completedLessons} / {totalLessons} pelajaran selesai
          </div>
        </div>
        <Link
          to={lanjutUrl}
          className="w-full brutal-btn bg-[var(--color-primary)] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2"
        >
          Lanjutkan Belajar <ChevronRight className="w-5 h-5" />
        </Link>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Daftar Modul</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {moduleInfo.map(({ mod, lessons, siap, selesai, menit, quiz, adaQuiz }) => {
            const modulSelesai =
              siap && selesai === lessons.length && (!adaQuiz || quiz?.passed);

            const isi = (
              <div className="flex gap-4 items-start">
                <div
                  className={`shrink-0 w-12 h-12 rounded-full brutal-border flex items-center justify-center font-bold text-lg ${
                    modulSelesai
                      ? 'bg-[var(--color-success)] text-black'
                      : siap
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {mod.order}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-bold ${siap ? 'text-gray-900' : 'text-gray-500'}`}>
                      {mod.title}
                    </h3>
                    {!siap && (
                      <span className="bg-[var(--color-accent)] brutal-border text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        Segera Hadir
                      </span>
                    )}
                  </div>

                  {siap ? (
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700 mt-2 font-medium">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {selesai}/{lessons.length} pelajaran
                      </span>
                      {adaQuiz && (
                        <span className="flex items-center gap-1">
                          {quiz?.passed ? (
                            <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                          ) : (
                            <div className="w-3 h-3 rounded-full brutal-border bg-gray-100" />
                          )}
                          Quiz: {quiz ? `${quiz.score}%` : '0%'}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />~
                        {menit >= 60 ? `${Math.round(menit / 60)} jam` : `${menit} mnt`}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 mt-2 font-medium">Materi belum tersedia</div>
                  )}
                </div>

                <div className="shrink-0 self-center ml-2">
                  {modulSelesai ? (
                    <CheckCircle className="w-6 h-6 text-[var(--color-success)] drop-shadow-[1px_1px_0_#1A1A1A]" />
                  ) : siap ? (
                    <ChevronRight className="w-6 h-6 text-[var(--color-text-main)]" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            );

            return siap ? (
              <Link
                key={mod.id}
                to={`/module/${mod.id}`}
                className="block p-5 rounded-xl brutal-card flex flex-col h-full"
              >
                {isi}
              </Link>
            ) : (
              <div
                key={mod.id}
                aria-disabled="true"
                className="block p-5 rounded-xl brutal-card-locked opacity-75 cursor-not-allowed select-none flex flex-col h-full"
              >
                {isi}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
