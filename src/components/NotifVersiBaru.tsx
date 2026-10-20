import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { dengarVersiBaru, muatUlangSekarang } from '../lib/pembaruanAplikasi';

/**
 * Notifikasi "Versi baru tersedia". Hanya muncul saat versi baru sudah siap tapi pemuatan ulang
 * otomatis ditunda (pengguna sedang di halaman materi atau quiz). Di halaman lain aplikasi
 * memuat ulang sendiri tanpa notifikasi.
 */
export default function NotifVersiBaru() {
  const [ada, setAda] = useState(false);
  const [disembunyikan, setDisembunyikan] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => dengarVersiBaru(setAda), []);

  if (!ada || disembunyikan) return null;

  const diQuiz = pathname.startsWith('/quiz/');

  return (
    <div
      role="status"
      className="fixed z-50 left-4 right-4 bottom-28 lg:left-auto lg:right-6 lg:bottom-6 lg:w-[380px] bg-white border-2 border-[var(--color-text-main)] rounded-xl shadow-[4px_4px_0_var(--color-text-main)] p-4 flex items-center gap-3"
    >
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[15px] leading-tight">Versi baru tersedia</p>
        <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">
          {diQuiz ? 'Quiz akan dimulai dari awal.' : 'Posisi materimu tetap tersimpan.'}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDisembunyikan(true)}
        className="text-[13px] font-semibold px-2 py-2 underline shrink-0"
      >
        Nanti
      </button>
      <button
        type="button"
        onClick={muatUlangSekarang}
        className="shrink-0 bg-[var(--color-primary)] border-2 border-[var(--color-text-main)] rounded-lg px-3 py-2 text-[14px] font-bold"
      >
        Muat ulang
      </button>
    </div>
  );
}
