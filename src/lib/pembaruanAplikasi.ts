/**
 * Pembaruan versi aplikasi (PWA).
 *
 * Service worker menyimpan versi lama di perangkat. Tanpa ini, tab yang dibiarkan terbuka di HP
 * terus menjalankan kode lama sampai ditutup total, sehingga perbaikan (misalnya hitungan streak)
 * baru terasa berhari-hari kemudian.
 *
 * Cara kerja:
 * - Cek versi baru saat aplikasi dibuka, saat tab kembali terlihat (visibilitychange), dan setiap 30 menit.
 * - Cek versi langsung ke version.json di server dengan cache: 'no-store'.
 * - Kalau versi berbeda:
 *   1. Panggil registration.update().
 *   2. Kalau 60 detik kemudian halaman masih versi lama, lakukan hard refresh otomatis di saat aman.
 * - Saat aman:
 *   - Di luar materi dan quiz: langsung hard refresh.
 *   - Di materi atau quiz: tunggu. Tapi kalau sudah 30 menit terdeteksi, paksa update saat pindah kartu/soal.
 * - Cadangan sebelum dimuat ulang disimpan di localStorage (materi: lessonId, index, attemptsPerCard, waktu;
 *   quiz: moduleId, index, answers, waktu). Setelah dimuat ulang dipulihkan lalu dihapus. Cadangan > 2 jam diabaikan.
 * - Pengaman: versi tujuan yang sama maksimal 1 kali hard refresh per 10 menit.
 */

const SETIAP_MS = 30 * 60 * 1000;
const DELAY_HARD_REFRESH_MS = 60 * 1000;
const BATAS_DI_MATERI_MS = 30 * 60 * 1000;
const KEDALUWARSA_CADANGAN_MS = 2 * 60 * 60 * 1000;
const PENGAMAN_HARD_REFRESH_MS = 10 * 60 * 1000;

export const KUNCI_MUAT_ULANG = 'bn_muat_ulang_versi';
export const KUNCI_CADANGAN_MATERI = 'bn_cadangan_materi';
export const KUNCI_CADANGAN_QUIZ = 'bn_cadangan_quiz';
export const KUNCI_HARD_REFRESH = 'bn_hard_refresh_target';

/** Halaman yang tidak boleh dimuat ulang tiba-tiba (jawaban dan posisi kartu bisa hilang). */
export function sedangBelajar(hash: string): boolean {
  return /^#\/(lesson|quiz)\//.test(hash);
}

type Pendengar = (ada: boolean) => void;
const pendengar = new Set<Pendengar>();
let versiBaruMenunggu = false;

let targetVersiBaru: string | null = null;
let waktuDeteksiVersiBaru: number | null = null;
let siapHardRefresh = false;
let timerHardRefresh: any = null;

let paksaPembaruan: (() => void) | null = null;
let muatUlangSekarangFn: (() => void) | null = null;
let windowAktif: Window | null = null;

export function _resetStatePembaruan(): void {
  versiBaruMenunggu = false;
  targetVersiBaru = null;
  waktuDeteksiVersiBaru = null;
  siapHardRefresh = false;
  if (timerHardRefresh) {
    clearTimeout(timerHardRefresh);
    timerHardRefresh = null;
  }
}

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

/** Format tanggal build untuk halaman Profil (contoh: 24 Okt 2026). */
export function formatTanggalBuild(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const bulan = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return isoString;
  }
}

/* ───────────────────────── Cadangan Materi & Quiz */

export function simpanCadanganMateri(
  lessonId: string,
  index: number,
  attemptsPerCard: Record<number, number> = {},
  locStorage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as any)
): void {
  try {
    locStorage.setItem?.(
      KUNCI_CADANGAN_MATERI,
      JSON.stringify({ lessonId, index, attemptsPerCard, waktu: Date.now() })
    );
  } catch {}
}

export function ambilCadanganMateri(
  lessonId: string,
  locStorage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as any)
): { index: number; attemptsPerCard: Record<number, number> } | null {
  try {
    const raw = locStorage.getItem?.(KUNCI_CADANGAN_MATERI);
    if (!raw) return null;
    locStorage.removeItem?.(KUNCI_CADANGAN_MATERI);
    const data = JSON.parse(raw);
    if (
      data &&
      data.lessonId === lessonId &&
      typeof data.index === 'number' &&
      Date.now() - data.waktu <= KEDALUWARSA_CADANGAN_MS
    ) {
      return { index: data.index, attemptsPerCard: data.attemptsPerCard || {} };
    }
  } catch {}
  return null;
}

export function hapusCadanganMateri(
  locStorage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as any)
): void {
  try {
    locStorage.removeItem?.(KUNCI_CADANGAN_MATERI);
  } catch {}
}

export function simpanCadanganQuiz(
  moduleId: string,
  index: number,
  answers: Record<number, number> = {},
  locStorage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as any)
): void {
  try {
    locStorage.setItem?.(
      KUNCI_CADANGAN_QUIZ,
      JSON.stringify({ moduleId, index, answers, waktu: Date.now() })
    );
  } catch {}
}

export function ambilCadanganQuiz(
  moduleId: string,
  locStorage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as any)
): { index: number; answers: Record<number, number> } | null {
  try {
    const raw = locStorage.getItem?.(KUNCI_CADANGAN_QUIZ);
    if (!raw) return null;
    locStorage.removeItem?.(KUNCI_CADANGAN_QUIZ);
    const data = JSON.parse(raw);
    if (
      data &&
      data.moduleId === moduleId &&
      typeof data.index === 'number' &&
      Date.now() - data.waktu <= KEDALUWARSA_CADANGAN_MS
    ) {
      return { index: data.index, answers: data.answers || {} };
    }
  } catch {}
  return null;
}

export function hapusCadanganQuiz(
  locStorage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as any)
): void {
  try {
    locStorage.removeItem?.(KUNCI_CADANGAN_QUIZ);
  } catch {}
}

/* ───────────────────────── Hard Refresh */

export function apakahBisaHardRefresh(
  versiTujuan?: string,
  locStorage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as any)
): boolean {
  if (!versiTujuan) return true;
  try {
    const raw = locStorage.getItem?.(KUNCI_HARD_REFRESH);
    if (raw) {
      const catat = JSON.parse(raw);
      if (catat.versi === versiTujuan && Date.now() - catat.waktu < PENGAMAN_HARD_REFRESH_MS) {
        return false;
      }
    }
  } catch {}
  return true;
}

export async function hardRefresh(
  versiTujuan?: string,
  win: Window = windowAktif || (typeof window !== 'undefined' ? window : ({} as any))
): Promise<boolean> {
  const locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);

  if (versiTujuan && locStorage) {
    if (!apakahBisaHardRefresh(versiTujuan, locStorage)) {
      return false;
    }
    try {
      locStorage.setItem(
        KUNCI_HARD_REFRESH,
        JSON.stringify({ versi: versiTujuan, waktu: Date.now() })
      );
    } catch {}
  }

  // 1. Simpan cadangan pekerjaan (sudah disimpan di localStorage oleh Lesson/Quiz)
  // 2. Hapus semua cache di caches.keys(), kecuali suara-en
  try {
    const c = (win as any).caches || (typeof caches !== 'undefined' ? caches : null);
    if (c?.keys) {
      const keys = await c.keys();
      for (const key of keys) {
        if (key !== 'suara-en') {
          await c.delete(key);
        }
      }
    }
  } catch {}

  // 3. unregister() semua service worker registration
  try {
    const sw = win.navigator?.serviceWorker;
    if (sw?.getRegistrations) {
      const regs = await sw.getRegistrations();
      for (const reg of regs) {
        await reg.unregister();
      }
    } else if (sw?.getRegistration) {
      const reg = await sw.getRegistration();
      await reg?.unregister();
    }
  } catch {}

  // 4. location.reload()
  win.location?.reload();
  return true;
}

/* ───────────────────────── Cek Saat Pindah Kartu / Soal */

export function periksaPembaruanSaatPindahMateri(
  lessonId: string,
  nextIndex: number,
  attemptsPerCard: Record<number, number> = {},
  win: Window = windowAktif || (typeof window !== 'undefined' ? window : ({} as any))
): boolean {
  if (waktuDeteksiVersiBaru && Date.now() - waktuDeteksiVersiBaru >= BATAS_DI_MATERI_MS) {
    const locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : ({} as any));
    if (!apakahBisaHardRefresh(targetVersiBaru || undefined, locStorage)) {
      return false;
    }
    simpanCadanganMateri(lessonId, nextIndex, attemptsPerCard, locStorage);
    hardRefresh(targetVersiBaru || undefined, win);
    return true;
  }
  return false;
}

export function periksaPembaruanSaatPindahQuiz(
  moduleId: string,
  nextIndex: number,
  answers: Record<number, number> = {},
  win: Window = windowAktif || (typeof window !== 'undefined' ? window : ({} as any))
): boolean {
  if (waktuDeteksiVersiBaru && Date.now() - waktuDeteksiVersiBaru >= BATAS_DI_MATERI_MS) {
    const locStorage = win.localStorage || (typeof localStorage !== 'undefined' ? localStorage : ({} as any));
    if (!apakahBisaHardRefresh(targetVersiBaru || undefined, locStorage)) {
      return false;
    }
    simpanCadanganQuiz(moduleId, nextIndex, answers, locStorage);
    hardRefresh(targetVersiBaru || undefined, win);
    return true;
  }
  return false;
}

/* ───────────────────────── Pemasangan Pembaruan Otomatis */

export function pasangPembaruanOtomatis(win: Window = window): void {
  windowAktif = win;
  const sw = win.navigator?.serviceWorker;
  if (!sw) return;

  _resetStatePembaruan();

  const adaVersiLama = !!sw.controller;
  let siapMuatUlang = false;
  let sudahMuatUlang = false;
  let paksa = false;

  const muatUlang = () => {
    sudahMuatUlang = true;
    win.location?.reload();
  };

  const cobaMuatUlang = () => {
    if (!siapMuatUlang || sudahMuatUlang || (!paksa && sedangBelajar(win.location?.hash || ''))) return;
    muatUlang();
  };

  const cobaHardRefresh = async () => {
    if (!siapHardRefresh || sudahMuatUlang || sedangBelajar(win.location?.hash || '')) return;
    const ok = await hardRefresh(targetVersiBaru || undefined, win);
    if (ok) {
      sudahMuatUlang = true;
    }
  };

  sw.addEventListener?.('controllerchange', () => {
    if (!adaVersiLama) return;
    if (!waktuDeteksiVersiBaru) {
      waktuDeteksiVersiBaru = Date.now();
    }
    siapMuatUlang = true;
    cobaMuatUlang();
    if (!sudahMuatUlang) {
      versiBaruMenunggu = true;
      pendengar.forEach((f) => f(true));
    }
  });

  muatUlangSekarangFn = () => {
    if ((siapMuatUlang || siapHardRefresh) && !sudahMuatUlang) {
      if (siapHardRefresh) {
        hardRefresh(targetVersiBaru || undefined, win);
      } else {
        muatUlang();
      }
    }
  };

  win.addEventListener?.('hashchange', () => {
    cobaMuatUlang();
    cobaHardRefresh();
  });

  const lewatiCekServer =
    (typeof __VERSI_APP__ !== 'undefined' && __VERSI_APP__ === 'lokal') ||
    (import.meta.env?.DEV && import.meta.env?.MODE === 'development');

  const cekVersiServer = async () => {
    if (lewatiCekServer) return;

    try {
      const fetchFn = win.fetch || (typeof fetch !== 'undefined' ? fetch : null);
      if (!fetchFn) return;
      const baseUrl = import.meta.env?.BASE_URL || '/';
      const url = `${baseUrl}version.json?t=${Date.now()}`;
      const res = await fetchFn(url, { cache: 'no-store' });
      if (!res || !res.ok) return;
      const data = await res.json();
      if (!data || !data.versi) return;

      const currentVer = typeof __VERSI_APP__ !== 'undefined' ? __VERSI_APP__ : 'lokal';
      if (data.versi !== currentVer) {
        targetVersiBaru = data.versi;
        if (!waktuDeteksiVersiBaru) {
          waktuDeteksiVersiBaru = Date.now();
        }

        // 1. Panggil registration.update() dulu
        try {
          const reg = await sw.getRegistration();
          await reg?.update();
        } catch {}

        // 2. Kalau 60 detik kemudian masih versi lama, lakukan hard refresh otomatis di saat aman
        if (!timerHardRefresh) {
          const setTimer = win.setTimeout || setTimeout;
          timerHardRefresh = setTimer(() => {
            siapHardRefresh = true;
            cobaHardRefresh();
          }, DELAY_HARD_REFRESH_MS);
        }
      }
    } catch {
      // offline / gagal: diam saja
    }
  };

  const cekVersi = () => {
    sw.getRegistration()
      .then((reg) => reg?.update())
      .catch(() => {});
    cekVersiServer();
  };

  // Cek saat aplikasi dibuka
  cekVersi();

  // Cek saat tab kembali terlihat
  win.document?.addEventListener('visibilitychange', () => {
    if (win.document?.visibilityState === 'visible') {
      cekVersi();
      cobaMuatUlang();
      cobaHardRefresh();
    }
  });

  // Cek setiap 30 menit
  win.setInterval?.(cekVersi, SETIAP_MS);

  paksaPembaruan = () => {
    if (!adaVersiLama) return;
    paksa = true;
    cekVersi();
    cobaMuatUlang();
  };
}
