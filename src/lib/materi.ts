import type { Card, Lesson } from '../types/schema';
import { coursesData, getModule, getVisibleLessons, modulesData, nomorModul } from './content';

/** Label kecil di atas judul kartu (huruf besar, sesuai desain). */
const LABEL_KARTU: Record<Card['type'], string> = {
  theory: 'TEORI',
  runnable: 'CONTOH KODE',
  understanding_check: 'CEK PEMAHAMAN',
  multiple_choice: 'PILIHAN GANDA',
  fill_blank: 'ISI YANG KOSONG',
  predict_output: 'TEBAK OUTPUT',
  reorder: 'SUSUN KODE',
  code_challenge: 'TANTANGAN KODE',
  summary: 'RINGKASAN',
  translate_tiles: 'LATIHAN',
  listen_tiles: 'LATIHAN',
  match_pairs: 'LATIHAN',
  type_translation: 'LATIHAN',
};

export function labelKartu(type: Card['type']): string {
  return LABEL_KARTU[type] ?? 'MATERI';
}

/** Lebih dari ini, bar progres di menu ramping dibuat satu batang (bukan per kartu). */
export const BATAS_SEGMEN = 12;

export interface InfoMateri {
  /** Nomor materi di kelasnya, contoh "4.5". Kosong kalau tidak diketahui. */
  nomor: string;
  /** Judul modul, contoh "Java Collection". */
  judulModul: string;
  /** Alamat kembali ke halaman kelas dengan modul ini terbuka. */
  kembaliKe: string;
}

export function infoMateri(lesson: Lesson): InfoMateri {
  // moduleId di file materi bisa berupa alias (mis. 'java-dasar' untuk modul 'dasar').
  const mod =
    getModule(lesson.moduleId) ?? modulesData.find((m) => getVisibleLessons(m.id).some((l) => l.id === lesson.id));
  if (!mod) return { nomor: '', judulModul: 'Semua kelas', kembaliKe: '/kelas' };
  const course = coursesData.find((c) => c.id === (mod.courseId || 'java'));
  const posisiModul = nomorModul(mod.id);
  const urutan = getVisibleLessons(mod.id).findIndex((l) => l.id === lesson.id) + 1;
  return {
    nomor: posisiModul && urutan > 0 ? `${posisiModul.nomor}.${urutan}` : '',
    judulModul: mod.title,
    kembaliKe: `/kelas/${course?.id ?? 'java'}?modul=${mod.id}`,
  };
}