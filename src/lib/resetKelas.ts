import type { UserProgress } from '../types/schema';
import { modulesData, getLessonsForModule } from './content';

/**
 * Reset progres satu kelas saja (materi, quiz, dan cek pemahaman kelas itu).
 * XP, streak, sertifikat, latihan ulang, dan progres kelas lain tidak disentuh.
 *
 * Waktu reset dicatat di progress.resetKelas[courseId]. Saat progres dari dua tempat digabung
 * (perangkat lain atau cloud), data kelas itu dari pihak yang belum tahu reset tersebut dibuang,
 * supaya materi lama tidak muncul kembali lewat penggabungan.
 */

interface IsiKelas {
  modul: Set<string>;
  materi: Set<string>;
}

const cache: Record<string, IsiKelas> = {};

/** Semua id modul dan id materi milik satu kelas. */
export function isiKelas(courseId: string): IsiKelas {
  if (cache[courseId]) return cache[courseId];
  const modul = new Set<string>();
  const materi = new Set<string>();
  for (const m of modulesData) {
    if ((m.courseId || 'java') !== courseId) continue;
    modul.add(m.id);
    for (const l of getLessonsForModule(m.id)) materi.add(l.id);
  }
  cache[courseId] = { modul, materi };
  return cache[courseId];
}

/** Buang data satu kelas dari progres, tanpa mengubah catatan resetKelas. */
function buangDataKelas(p: UserProgress, courseId: string): UserProgress {
  const { modul, materi } = isiKelas(courseId);
  const quizScores = Object.fromEntries(Object.entries(p.quizScores || {}).filter(([id]) => !modul.has(id)));
  const moduleStatus = Object.fromEntries(Object.entries(p.moduleStatus || {}).filter(([id]) => !modul.has(id)));
  return {
    ...p,
    completedLessons: (p.completedLessons || []).filter((id) => !materi.has(id)),
    passedChecks: (p.passedChecks || []).filter((id) => !materi.has(id)),
    quizScores,
    moduleStatus,
  };
}

/** Reset satu kelas sekarang. */
export function resetSatuKelas(p: UserProgress, courseId: string, waktu: string = new Date().toISOString()): UserProgress {
  return {
    ...buangDataKelas(p, courseId),
    resetKelas: { ...(p.resetKelas || {}), [courseId]: waktu },
  };
}

/** Gabungan catatan reset: waktu paling baru untuk setiap kelas. */
export function gabungResetKelas(a: Record<string, string> = {}, b: Record<string, string> = {}): Record<string, string> {
  const hasil: Record<string, string> = { ...a };
  for (const [k, w] of Object.entries(b)) {
    if (!hasil[k] || w > hasil[k]) hasil[k] = w;
  }
  return hasil;
}

/**
 * Sebelum dua progres digabung: buang data kelas yang sudah di-reset dari pihak yang belum tahu
 * reset terbarunya. Pihak yang sudah tahu tetap membawa materi yang diselesaikan setelah reset.
 */
export function sesuaikanResetKelas(local: UserProgress, cloud: UserProgress): { local: UserProgress; cloud: UserProgress; resetKelas: Record<string, string> } {
  const resetKelas = gabungResetKelas(local.resetKelas, cloud.resetKelas);
  let l = local;
  let c = cloud;
  for (const [courseId, waktu] of Object.entries(resetKelas)) {
    if ((l.resetKelas?.[courseId] || '') < waktu) l = buangDataKelas(l, courseId);
    if ((c.resetKelas?.[courseId] || '') < waktu) c = buangDataKelas(c, courseId);
  }
  return { local: l, cloud: c, resetKelas };
}
