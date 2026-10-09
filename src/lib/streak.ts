import type { UserProgress } from '../types/schema';

/** Tanggal kalender di perangkat pengguna (bukan UTC), format YYYY-MM-DD. */
export function tanggalLokal(d: Date = new Date()): string {
  const bulan = String(d.getMonth() + 1).padStart(2, '0');
  const hari = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${bulan}-${hari}`;
}

/** Selisih hari kalender: a - b (keduanya YYYY-MM-DD). */
export function selisihHari(a: string, b: string): number {
  return Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 86400000);
}

/** Streak baru setelah pengguna menyelesaikan satu materi pada tanggal `hariIni`. */
export function streakSetelahBelajar(streak: number, tanggalStreak: string | undefined, hariIni: string): number {
  if (!tanggalStreak || !streak || streak <= 0) return 1;
  const s = selisihHari(hariIni, tanggalStreak);
  if (s <= 0) return streak;      // hari yang sama (atau jam perangkat mundur): tidak berubah
  if (s === 1) return streak + 1; // belajar lagi besoknya: naik
  return 1;                       // ada hari yang terlewat: mulai lagi dari 1
}

/** Streak yang ditampilkan: 0 kalau sudah lebih dari 1 hari tidak menyelesaikan materi. */
export function streakTampil(streak: number, tanggalStreak: string | undefined, hariIni: string): number {
  if (!streak || streak <= 0) return 0;
  if (!tanggalStreak) return streak; // data lama tanpa tanggal sama sekali: tampilkan apa adanya
  return selisihHari(hariIni, tanggalStreak) <= 1 ? streak : 0;
}

/** Progres setelah satu materi selesai. Mengulang materi yang sudah selesai tetap menghitung streak hari itu (XP tidak bertambah lagi). */
export function progresSetelahMateri<T extends UserProgress>(prev: T, lessonId: string, sekarang: Date = new Date()): T {
  const hariIni = tanggalLokal(sekarang);
  const utc = sekarang.toISOString().split('T')[0];
  const streak = streakSetelahBelajar(prev.streak, prev.streakDate, hariIni);
  const sudah = prev.completedLessons.includes(lessonId);
  if (sudah && prev.streakDate === hariIni && prev.streak === streak) return prev;
  return {
    ...prev,
    completedLessons: sudah ? prev.completedLessons : [...prev.completedLessons, lessonId],
    passedChecks: Array.from(new Set([...(prev.passedChecks || []), lessonId])),
    xp: sudah ? prev.xp : prev.xp + 10,
    streak,
    streakDate: hariIni,
    lastActiveDate: utc,
    maxSeenDate: prev.maxSeenDate && prev.maxSeenDate > utc ? prev.maxSeenDate : utc,
    justReset: false,
  };
}

/** Data lama belum punya streakDate: pakai lastActiveDate sebagai perkiraan. */
export function lengkapiStreak<T extends UserProgress>(data: T): T {
  if (!data.streakDate && data.streak > 0 && data.lastActiveDate) return { ...data, streakDate: data.lastActiveDate };
  return data;
}

/**
 * Gabung streak dua sumber (perangkat ini dan cloud).
 * - Tanggal sama: ambil yang terbesar.
 * - Tanggal berurutan (kemarin dan hari ini): pengguna belajar di dua hari itu, jadi streak hari ini
 *   minimal streak kemarin + 1. Ini terjadi kalau materi selesai sebelum data cloud sempat dimuat
 *   (misalnya baru login di jaringan lambat): perangkat menghitung 1, padahal cloud menyimpan streak kemarin.
 * - Selain itu: tanggal terbaru yang menang.
 */
export function gabungStreak(a: Pick<UserProgress, 'streak' | 'streakDate'>, b: Pick<UserProgress, 'streak' | 'streakDate'>): { streak: number; streakDate?: string } {
  const ta = a.streakDate || '';
  const tb = b.streakDate || '';
  if (ta === tb) return { streak: Math.max(a.streak || 0, b.streak || 0), streakDate: ta || undefined };
  const [baru, lama, tBaru, tLama] = ta > tb ? [a, b, ta, tb] : [b, a, tb, ta];
  if (tLama && (lama.streak || 0) > 0 && selisihHari(tBaru, tLama) === 1) {
    return { streak: Math.max(baru.streak || 0, (lama.streak || 0) + 1), streakDate: tBaru };
  }
  return { streak: baru.streak || 0, streakDate: tBaru };
}
