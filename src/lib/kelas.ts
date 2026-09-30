import type { Course, Lesson, Module, UserProgress } from '../types/schema';
import { coursesData, modulesData, getVisibleLessons, getQuizQuestions, checkModuleUnlocked } from './content';
import { pemakaianKelas } from './jalur';

export type StatusModul = 'selesai' | 'sedang' | 'terbuka' | 'terkunci';
export type StatusMateri = 'selesai' | 'sekarang' | 'belum';
export type StatusQuiz = 'tidak-ada' | 'terkunci' | 'siap' | 'gagal' | 'lulus';
export interface MateriKelas { lesson: Lesson; nomor: string; status: StatusMateri; bisaDibuka: boolean }
export interface ModulKelas { mod: Module; nomor: number; status: StatusModul; materi: MateriKelas[]; jumlahMateri: number; jumlahSelesai: number; menit: number; quiz: StatusQuiz; skorQuiz?: number; syaratJudul?: string }
export interface LanjutKelas { keterangan: string; url: string }
export interface RingkasanKelas { course: Course; modul: ModulKelas[]; totalMateri: number; totalSelesai: number; persen: number; totalMenit: number; lanjut: LanjutKelas | null }

export function formatDurasi(menit: number): string {
  return menit < 90 ? `± ${menit} menit` : `± ${Math.round(menit / 60)} jam`;
}

export function ringkasanKelas(courseId: string, progress: UserProgress): RingkasanKelas | null {
  const course = coursesData.find((c) => c.id === courseId);
  if (!course || course.status === 'soon') return null;
  const mods = modulesData.filter((m) => (m.courseId || 'java') === courseId && m.status !== 'draft').sort((a, b) => a.order - b.order);
  const selesaiSet = new Set(progress.completedLessons);
  let adaSedang = false;
  const modul: ModulKelas[] = mods.map((mod, i) => {
    const lessons = getVisibleLessons(mod.id);
    const terbuka = checkModuleUnlocked(mod, progress);
    let sekarangSudah = false;
    const materi: MateriKelas[] = lessons.map((l, j) => {
      const done = selesaiSet.has(l.id);
      const bisa = terbuka && (!!progress.unlockAll || j === 0 || done || selesaiSet.has(lessons[j - 1].id));
      let status: StatusMateri = done ? 'selesai' : 'belum';
      if (!done && bisa && !sekarangSudah) { status = 'sekarang'; sekarangSudah = true; }
      return { lesson: l, nomor: `${i + 1}.${j + 1}`, status, bisaDibuka: bisa };
    });
    const jumlahSelesai = materi.filter((m) => m.status === 'selesai').length;
    const semua = lessons.length > 0 && jumlahSelesai === lessons.length;
    const soal = getQuizQuestions(mod.id);
    const skor = progress.quizScores?.[mod.id];
    let quiz: StatusQuiz = 'tidak-ada';
    if (soal && soal.length) {
      if (skor?.passed) quiz = 'lulus';
      else if (!(progress.unlockAll || semua) || !terbuka) quiz = 'terkunci';
      else if (skor) quiz = 'gagal';
      else quiz = 'siap';
    }
    let status: StatusModul;
    if (!terbuka) status = 'terkunci';
    else if (semua && (quiz === 'tidak-ada' || quiz === 'lulus')) status = 'selesai';
    else if (!adaSedang) { status = 'sedang'; adaSedang = true; }
    else status = 'terbuka';
    const syaratId = mod.requires || mods[i - 1]?.id;
    return {
      mod, nomor: i + 1, status, materi, jumlahMateri: lessons.length, jumlahSelesai,
      menit: lessons.reduce((t, l) => t + (l.estimatedMinutes || 5), 0), quiz, skorQuiz: skor?.score,
      syaratJudul: status === 'terkunci' ? mods.find((m) => m.id === syaratId)?.title : undefined,
    };
  });
  const totalMateri = modul.reduce((t, m) => t + m.jumlahMateri, 0);
  if (totalMateri === 0) return null;
  const totalSelesai = modul.reduce((t, m) => t + m.jumlahSelesai, 0);
  let lanjut: LanjutKelas | null = null;
  const sedang = modul.find((m) => m.status === 'sedang');
  if (sedang) {
    const s = sedang.materi.find((m) => m.status === 'sekarang');
    if (s) lanjut = { keterangan: `${s.nomor} · ${s.lesson.title}`, url: `/lesson/${s.lesson.id}` };
    else if (sedang.quiz === 'siap' || sedang.quiz === 'gagal') lanjut = { keterangan: `Quiz ${sedang.mod.title}`, url: `/quiz/${sedang.mod.id}` };
  }
  return { course, modul, totalMateri, totalSelesai, persen: Math.round((totalSelesai / totalMateri) * 100), totalMenit: modul.reduce((t, m) => t + m.menit, 0), lanjut };
}

/** Jalur karier yang memakai kelas ini (untuk kartu "Dipakai di jalur"). */
export function jalurKelas(courseId: string): { judul: string; keterangan: string }[] {
  return pemakaianKelas(courseId);
}
