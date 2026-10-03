import type { Card, Lesson } from '../types/schema';
import { coursesData, getModule, getVisibleLessons, modulesData, nomorModul, getQuizQuestions } from './content';
import { PASSING_SCORE } from './quizLogic';

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
  html_css_preview: 'PREVIEW HTML & CSS',
  html_preview: 'CONTOH KODE',
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
export interface LangkahBerikutnya {
  jenis: 'materi' | 'quiz' | 'kelas';
  url: string;        // '/lesson/<id>' | '/quiz/<moduleId resmi>' | kembaliKe dari infoMateri
  judul: string;      // judul materi berikutnya | 'Quiz <judul modul>' | 'Kembali ke kelas'
  keterangan: string; // contoh '1.2 · Distro Linux' | '20 soal · lulus kalau skor ≥ 70' | judul modul
}

export function langkahBerikutnya(lesson: Lesson): LangkahBerikutnya {
  const mod =
    getModule(lesson.moduleId) ?? modulesData.find((m) => getVisibleLessons(m.id).some((l) => l.id === lesson.id));
  const info = infoMateri(lesson);

  if (!mod) {
    return {
      jenis: 'kelas',
      url: info.kembaliKe,
      judul: 'Kembali ke kelas',
      keterangan: info.judulModul,
    };
  }

  const lessons = getVisibleLessons(mod.id);
  const currentIndex = lessons.findIndex((l) => l.id === lesson.id);

  if (currentIndex !== -1 && currentIndex < lessons.length - 1) {
    const nextLesson = lessons[currentIndex + 1];
    const nextInfo = infoMateri(nextLesson);
    const keterangan = nextInfo.nomor ? `${nextInfo.nomor} · ${nextLesson.title}` : nextLesson.title;
    return {
      jenis: 'materi',
      url: `/lesson/${nextLesson.id}`,
      judul: 'Materi berikutnya',
      keterangan,
    };
  }

  const quizQs = getQuizQuestions(mod.id);
  if (quizQs && quizQs.length > 0) {
    return {
      jenis: 'quiz',
      url: `/quiz/${mod.id}`,
      judul: `Quiz ${mod.title}`,
      keterangan: `${quizQs.length} soal · lulus kalau skor ≥ ${PASSING_SCORE}`,
    };
  }

  return {
    jenis: 'kelas',
    url: info.kembaliKe,
    judul: 'Kembali ke kelas',
    keterangan: info.judulModul,
  };
}
