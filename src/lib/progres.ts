import type { Course, UserProgress } from '../types/schema';
import { coursesData, getModule } from './content';
import { ringkasanKelas, type LanjutKelas } from './kelas';
import { PASSING_SCORE } from './quizLogic';

export interface ProgresKelas {
  course: Course;
  persen: number;
  totalSelesai: number;
  totalMateri: number;
  modulSelesai: number;
  jumlahModul: number;
  /** Tujuan tombol lanjut (null kalau kelas sudah selesai semua). */
  lanjut: LanjutKelas | null;
  /** Alamat materi pertama, untuk mengulang kelas yang sudah selesai. */
  materiPertama: string | null;
}

export interface ProgresQuiz {
  modulId: string;
  judul: string;
  kelasId: string;
  kelasJudul: string;
  skor: number;
  lulus: boolean;
}

export interface RingkasanProgres {
  streak: number;
  xp: number;
  totalSelesai: number;
  totalMateri: number;
  quizLulus: number;
  kelas: ProgresKelas[];
  quiz: ProgresQuiz[];
}

/** Ringkasan untuk halaman Progres belajar: angka utama, progres per kelas, dan hasil quiz. */
export function ringkasanProgres(progress: UserProgress): RingkasanProgres {
  const kelas: ProgresKelas[] = [];
  for (const c of [...coursesData].sort((a, b) => a.order - b.order)) {
    const r = ringkasanKelas(c.id, progress);
    if (!r) continue;
    const pertama = r.modul.find((m) => m.materi.length > 0)?.materi[0]?.lesson.id;
    kelas.push({
      course: c,
      persen: r.persen,
      totalSelesai: r.totalSelesai,
      totalMateri: r.totalMateri,
      modulSelesai: r.modul.filter((m) => m.status === 'selesai').length,
      jumlahModul: r.modul.length,
      lanjut: r.lanjut,
      materiPertama: pertama ? `/lesson/${pertama}` : null,
    });
  }
  // Kelas yang sedang dipelajari dulu (persen terbesar), lalu yang belum dimulai sesuai urutan kelas.
  const mulai = kelas.filter((k) => k.totalSelesai > 0).sort((a, b) => b.persen - a.persen);
  const belum = kelas.filter((k) => k.totalSelesai === 0);

  const quiz: ProgresQuiz[] = [];
  for (const [modulId, nilai] of Object.entries(progress.quizScores || {})) {
    const mod = getModule(modulId);
    if (!mod || !nilai) continue;
    const c = coursesData.find((x) => x.id === (mod.courseId || 'java'));
    quiz.push({
      modulId,
      judul: mod.title,
      kelasId: c?.id ?? 'java',
      kelasJudul: c ? c.title.replace(/^Kelas /, '') : '',
      skor: nilai.score,
      lulus: !!nilai.passed,
    });
  }
  quiz.sort((a, b) => Number(b.lulus) - Number(a.lulus) || a.kelasJudul.localeCompare(b.kelasJudul) || a.judul.localeCompare(b.judul));

  return {
    streak: progress.streak || 0,
    xp: progress.xp || 0,
    totalSelesai: kelas.reduce((t, k) => t + k.totalSelesai, 0),
    totalMateri: kelas.reduce((t, k) => t + k.totalMateri, 0),
    quizLulus: quiz.filter((q) => q.lulus).length,
    kelas: [...mulai, ...belum],
    quiz,
  };
}

export { PASSING_SCORE };
