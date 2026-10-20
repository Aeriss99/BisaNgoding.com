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

/** Dipanggil saat gambar materi gagal dimuat: cari versi baru dan muat ulang tanpa menunggu. */
export function versiLamaTerdeteksi(): void {
  paksaPembaruan?.();
}

export function pasangPembaruanOtomatis(win: Window = window): void {
  const sw = win.navigator.serviceWorker;
  if (!sw) return;

  // Kunjungan pertama (belum ada service worker yang mengendalikan halaman) bukan pembaruan.
  const adaVersiLama = !!sw.controller;
  let siapMuatUlang = false;
  let sudahMuatUlang = false;
  let paksa = false;

  const cobaMuatUlang = () => {
    if (!siapMuatUlang || sudahMuatUlang || (!paksa && sedangBelajar(win.location.hash))) return;
    sudahMuatUlang = true;
    win.location.reload();
  };

  sw.addEventListener('controllerchange', () => {
    if (!adaVersiLama) return;
    siapMuatUlang = true;
    cobaMuatUlang();
  });
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
