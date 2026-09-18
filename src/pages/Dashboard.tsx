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
      <header>
        <h1 className="text-2xl font-extrabold mb-2">Belajar Java</h1>
        <p className="text-gray-600">Dari pemula sampai mahir dengan interaktif.</p>
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          Lanjutkan Belajar <ChevronRight className="w-5 h-5" />
        </Link>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Daftar Modul</h2>
        <div className="grid gap-4">
          {moduleInfo.map(({ mod, lessons, siap, selesai, menit, quiz, adaQuiz }) => {
            const modulSelesai =
              siap && selesai === lessons.length && (!adaQuiz || quiz?.passed);

            const isi = (
              <div className="flex gap-4 items-start">
                <div
                  className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    modulSelesai
                      ? 'bg-green-100 text-green-600'
                      : siap
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-200 text-gray-500'
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
                      <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        Segera Hadir
                      </span>
                    )}
                  </div>

                  {siap ? (
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {selesai}/{lessons.length} pelajaran
                      </span>
                      {adaQuiz && (
                        <span className="flex items-center gap-1">
                          {quiz?.passed ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <div className="w-3 h-3 rounded-full border border-gray-400" />
                          )}
                          Quiz: {quiz ? `${quiz.score}%` : '0%'} ({quiz?.passed ? 'Lulus' : 'Belum'})
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />~
                        {menit >= 60 ? `${Math.round(menit / 60)} jam` : `${menit} mnt`}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 mt-1">Materi belum tersedia</div>
                  )}
                </div>

                <div className="shrink-0 text-gray-400 self-center">
                  {modulSelesai ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : siap ? (
                    <ChevronRight className="w-5 h-5 text-blue-500" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
              </div>
            );

            return siap ? (
              <Link
                key={mod.id}
                to={`/module/${mod.id}`}
                className="block p-4 rounded-xl border bg-white border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                {isi}
              </Link>
            ) : (
              <div
                key={mod.id}
                aria-disabled="true"
                className="block p-4 rounded-xl border bg-gray-50 border-gray-100 opacity-70 cursor-not-allowed select-none"
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
