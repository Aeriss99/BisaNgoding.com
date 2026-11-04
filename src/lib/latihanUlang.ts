import type {
  EntriLatihanUlang,
  QuizQuestion,
  UnderstandingCheckCard,
  UserProgress,
} from '../types/schema';
import {
  getQuizQuestions,
  getLesson,
  getModule,
  coursesData,
} from './content';

export interface SoalLatihanUlang {
  kunci: string;
  jenis: 'cek' | 'quiz';
  sumber: string;
  namaKelas: string;
  asalJudul: string;
  question: string;
  code?: string;
  options: string[];
  answer: number;
  explanation: string;
  remedial?: string;
  bahasa?: string;
}

export interface ItemLatihanAktif {
  kunci: string;
  entri: EntriLatihanUlang;
  soal: SoalLatihanUlang;
}

/** Hash 8 karakter heksadesimal djb2 */
function djb2Hex(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** Kunci unik untuk soal cek pemahaman */
export function kunciCek(
  lessonId: string,
  q: { question: string; code?: string }
): string {
  const isi = `${q.question}\n${q.code ?? ''}`;
  return `cek:${lessonId}:${djb2Hex(isi)}`;
}

/** Kunci unik untuk soal quiz modul */
export function kunciQuiz(q: QuizQuestion): string {
  return `quiz:${q.id}`;
}

/** Catat salah di materi atau quiz (murni) */
export function catatSalah(
  daftar: Record<string, EntriLatihanUlang> | undefined,
  kunci: string,
  jenis: 'cek' | 'quiz',
  sumber: string,
  waktu = new Date().toISOString()
): Record<string, EntriLatihanUlang> {
  return {
    ...daftar,
    [kunci]: {
      jenis,
      sumber,
      benar: 0,
      selesai: false,
      diubah: waktu,
    },
  };
}

/** Catat benar di sesi latihan ulang (murni) */
export function catatBenar(
  daftar: Record<string, EntriLatihanUlang> | undefined,
  kunci: string,
  waktu = new Date().toISOString()
): Record<string, EntriLatihanUlang> {
  if (!daftar || !daftar[kunci]) {
    return daftar ?? {};
  }
  const lama = daftar[kunci];
  const baruBenar = lama.benar + 1;
  const selesai = baruBenar >= 2;
  return {
    ...daftar,
    [kunci]: {
      ...lama,
      benar: baruBenar,
      selesai,
      diubah: waktu,
    },
  };
}

/** Catat salah saat di halaman latihan ulang (murni, mereset benar ke 0) */
export function catatSalahLatihan(
  daftar: Record<string, EntriLatihanUlang> | undefined,
  kunci: string,
  waktu = new Date().toISOString()
): Record<string, EntriLatihanUlang> {
  if (!daftar || !daftar[kunci]) {
    return daftar ?? {};
  }
  const lama = daftar[kunci];
  return {
    ...daftar,
    [kunci]: {
      ...lama,
      benar: 0,
      selesai: false,
      diubah: waktu,
    },
  };
}

/** Gabung progres latihan ulang dari 2 perangkat (murni) */
export function gabungLatihanUlang(
  a: Record<string, EntriLatihanUlang> | undefined,
  b: Record<string, EntriLatihanUlang> | undefined
): Record<string, EntriLatihanUlang> {
  const hasil: Record<string, EntriLatihanUlang> = { ...(a ?? {}) };
  if (!b) return hasil;

  for (const [kunci, entriB] of Object.entries(b)) {
    const entriA = hasil[kunci];
    if (!entriA) {
      hasil[kunci] = entriB;
    } else {
      const waktuA = new Date(entriA.diubah).getTime() || 0;
      const waktuB = new Date(entriB.diubah).getTime() || 0;
      if (waktuB > waktuA) {
        hasil[kunci] = entriB;
      } else if (waktuB === waktuA && entriB.diubah > entriA.diubah) {
        hasil[kunci] = entriB;
      }
    }
  }

  return hasil;
}

/** Ambil soal lengkap berdasarkan kunci dan entri, null jika materi tidak ditemukan */
export function ambilSoalLatihan(
  kunci: string,
  entri: EntriLatihanUlang
): SoalLatihanUlang | null {
  if (entri.jenis === 'quiz') {
    const quizList = getQuizQuestions(entri.sumber);
    if (!quizList) return null;

    const idSoal = kunci.startsWith('quiz:') ? kunci.slice(5) : kunci;
    const q = quizList.find((item) => item.id === idSoal);
    if (!q) return null;

    const mod = getModule(entri.sumber);
    const course = coursesData.find(
      (c) => c.id === (mod?.courseId || 'java')
    );
    const rawCourseName = course?.namaPendek ?? course?.title ?? 'Kelas';
    const namaKelas = rawCourseName.replace(/^Kelas\s+/, '');
    const asalJudul = `Quiz ${mod?.title ?? entri.sumber}`;
    const bahasa = mod?.language || (course?.language as any) || 'javascript';

    return {
      kunci,
      jenis: 'quiz',
      sumber: entri.sumber,
      namaKelas,
      asalJudul,
      question: q.question,
      code: q.code,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      bahasa,
    };
  }

  if (entri.jenis === 'cek') {
    const lesson = getLesson(entri.sumber);
    if (!lesson) return null;

    const checkCard = lesson.cards?.find(
      (c) => c.type === 'understanding_check'
    ) as UnderstandingCheckCard | undefined;
    if (!checkCard?.questions) return null;

    const q = checkCard.questions.find(
      (item) => kunciCek(entri.sumber, item) === kunci
    );
    if (!q) return null;

    const mod = getModule(lesson.moduleId);
    const course = coursesData.find(
      (c) => c.id === (mod?.courseId || 'java')
    );
    const rawCourseName = course?.namaPendek ?? course?.title ?? 'Kelas';
    const namaKelas = rawCourseName.replace(/^Kelas\s+/, '');
    const asalJudul = lesson.title;
    const bahasa = mod?.language || (course?.language as any) || 'java';

    return {
      kunci,
      jenis: 'cek',
      sumber: entri.sumber,
      namaKelas,
      asalJudul,
      question: q.question,
      code: q.code,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      remedial: q.remedial,
      bahasa,
    };
  }

  return null;
}

/** Entri belum selesai yang soalnya masih ada, diurutkan dari yang diubah paling lama dulu */
export function daftarAktif(progress: UserProgress): ItemLatihanAktif[] {
  const entries = progress.latihanUlang;
  if (!entries) return [];

  const hasil: ItemLatihanAktif[] = [];
  for (const [kunci, entri] of Object.entries(entries)) {
    if (entri.selesai) continue;
    const soal = ambilSoalLatihan(kunci, entri);
    if (!soal) continue;
    hasil.push({ kunci, entri, soal });
  }

  hasil.sort((a, b) => {
    const tA = new Date(a.entri.diubah).getTime() || 0;
    const tB = new Date(b.entri.diubah).getTime() || 0;
    if (tA !== tB) return tA - tB;
    return a.entri.diubah.localeCompare(b.entri.diubah);
  });

  return hasil;
}
