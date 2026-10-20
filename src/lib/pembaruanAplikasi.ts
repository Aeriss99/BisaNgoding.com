/**
 * Pembaruan versi aplikasi (PWA).
 *
 * Service worker menyimpan versi lama di perangkat. Tanpa ini, tab yang dibiarkan terbuka di HP
 * terus menjalankan kode lama sampai ditutup total, sehingga perbaikan (misalnya hitungan streak)
 * baru terasa berhari-hari kemudian.
 *
 * Cara kerja:
 * - Cek versi baru saat aplikasi dibuka lagi (tab kembali terlihat) dan setiap 30 menit.
 * - Begitu service worker versi baru aktif, halaman dimuat ulang otomatis,
 *   tapi tidak saat pengguna sedang mengerjakan materi atau quiz. Di sana, pemuatan ulang
 *   ditunda sampai pengguna pindah ke halaman lain.
 * - Selama pemuatan ulang ditunda di halaman materi/quiz, muncul notifikasi "Versi baru tersedia"
 *   dengan tombol Muat ulang. Posisi kartu materi disimpan dulu, lalu dipulihkan setelah dimuat ulang.
 * - Pengecualian: kalau gambar materi gagal dimuat (tanda materi yang tampil sudah versi lama
 *   dan gambarnya sudah diganti di server), versi baru langsung dicari dan halaman dimuat ulang
 *   walaupun sedang di halaman materi. Kalau memang tidak ada versi baru, tidak terjadi apa-apa.
 */

const SETIAP_MS = 30 * 60 * 1000;

/** Halaman yang tidak boleh dimuat ulang tiba-tiba (jawaban dan posisi kartu bisa hilang). */
export function sedangBelajar(hash: string): boolean {
  return /^#\/(lesson|quiz)\//.test(hash);
}

let paksaPembaruan: (() => void) | null = null;
let muatUlangSekarangFn: (() => void) | null = null;

/** Penanda di sessionStorage: halaman ini dimuat ulang karena versi baru (dipakai untuk memulihkan posisi materi). */
export const KUNCI_MUAT_ULANG = 'bn_muat_ulang_versi';

type Pendengar = (ada: boolean) => void;
const pendengar = new Set<Pendengar>();
let versiBaruMenunggu = false;

/** Berlangganan status "versi baru sudah siap tapi belum dimuat ulang". Mengembalikan fungsi berhenti. */
export function dengarVersiBaru(f: Pendengar): () => void {
  pendengar.add(f);
  f(versiBaruMenunggu);
  return () => {
    pendengar.delete(f);
  };
}

/** Tombol "Muat ulang" di notifikasi. */
export function muatUlangSekarang(): void {
  muatUlangSekarangFn?.();
}

/** Dipanggil saat gambar materi gagal dimuat: cari versi baru dan muat ulang tanpa menunggu. */
export function versiLamaTerdeteksi(): void {
  paksaPembaruan?.();
}

export function pasangPembaruanOtomatis(win: Window = window): void {
  const sw = win.navigator.serviceWorker;
  if (!sw) return;
  versiBaruMenunggu = false;

  // Kunjungan pertama (belum ada service worker yang mengendalikan halaman) bukan pembaruan.
  const adaVersiLama = !!sw.controller;
  let siapMuatUlang = false;
  let sudahMuatUlang = false;
  let paksa = false;

  const muatUlang = () => {
    sudahMuatUlang = true;
    try {
      if (win.location.hash.startsWith('#/lesson/')) win.sessionStorage?.setItem(KUNCI_MUAT_ULANG, '1');
    } catch {
      // penyimpanan diblokir: tetap muat ulang, hanya posisi materi yang tidak dipulihkan
    }
    win.location.reload();
  };

  const cobaMuatUlang = () => {
    if (!siapMuatUlang || sudahMuatUlang || (!paksa && sedangBelajar(win.location.hash))) return;
    muatUlang();
  };

  sw.addEventListener('controllerchange', () => {
    if (!adaVersiLama) return;
    siapMuatUlang = true;
    cobaMuatUlang();
    if (!sudahMuatUlang) {
      versiBaruMenunggu = true;
      pendengar.forEach((f) => f(true));
    }
  });
  muatUlangSekarangFn = () => {
    if (siapMuatUlang && !sudahMuatUlang) muatUlang();
  };
  win.addEventListener('hashchange', cobaMuatUlang);

  const cekVersi = () => {
    sw.getRegistration()
      .then((reg) => reg?.update())
      .catch(() => {});
  };
  win.document.addEventListener('visibilitychange', () => {
    if (win.document.visibilityState === 'visible') {
      cekVersi();
      cobaMuatUlang();
    }
  });
  win.setInterval(cekVersi, SETIAP_MS);

  paksaPembaruan = () => {
    if (!adaVersiLama) return;
    paksa = true;
    cekVersi();
    cobaMuatUlang();
  };
}
