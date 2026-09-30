import { useCallback, useEffect, useMemo, useState } from 'react';
import { useProgress } from '../context/ProgressContext';
import { coursesData, modulesData, getVisibleLessons } from './content';
import { hitungNotifikasi, perbaruiModulDikenal, perbaruiQuizDikenal, type Notifikasi, type QuizLulusInfo } from './notifikasi';

const KUNCI_DIKENAL = 'bn_modul_dikenal';
const KUNCI_DIBACA = 'bn_notif_dibaca';
const KUNCI_QUIZ = 'bn_quiz_dikenal';
const BATAS_HARI_QUIZ = 7;
const BATAS_HARI_MODUL_BARU = 30;

function baca<T>(kunci: string): T | null {
  try {
    const s = localStorage.getItem(kunci);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
}

const EVENT = 'bn-notif-berubah';

function simpan(kunci: string, nilai: unknown) {
  try {
    localStorage.setItem(kunci, JSON.stringify(nilai));
  } catch {
    /* penyimpanan tidak tersedia: abaikan */
  }
  // Menu atas dan halaman notifikasi memakai hook ini masing-masing: beri tahu yang lain.
  window.dispatchEvent(new Event(EVENT));
}

function tanggalLokal(d = new Date()): string {
  const bulan = String(d.getMonth() + 1).padStart(2, '0');
  const hari = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${bulan}-${hari}`;
}

/** Modul siap yang punya materi, beserta kelasnya. */
function modulSiap() {
  return [...modulesData]
    .sort((a, b) => a.order - b.order)
    .filter((m) => m.status !== 'draft')
    .map((m) => {
      const kelas = coursesData.find((c) => c.id === (m.courseId || 'java'));
      return kelas && kelas.status !== 'soon' && getVisibleLessons(m.id).length > 0
        ? { id: m.id, judul: m.title, kelasId: kelas.id, kelasJudul: kelas.title }
        : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

export function useNotifikasi() {
  const { progress } = useProgress();
  const hariIni = tanggalLokal();
  const [dikenal, setDikenal] = useState<Record<string, string>>({});
  const [quizDikenal, setQuizDikenal] = useState<Record<string, string>>({});
  const [dibaca, setDibaca] = useState<string[]>(() => baca<string[]>(KUNCI_DIBACA) ?? []);

  useEffect(() => {
    const segarkan = () => setDibaca(baca<string[]>(KUNCI_DIBACA) ?? []);
    window.addEventListener(EVENT, segarkan);
    return () => window.removeEventListener(EVENT, segarkan);
  }, []);

  useEffect(() => {
    const semua = modulSiap().map((m) => m.id);
    const baru = perbaruiModulDikenal(baca<Record<string, string>>(KUNCI_DIKENAL), semua, hariIni);
    simpan(KUNCI_DIKENAL, baru);
    setDikenal(baru);
  }, [hariIni]);

  const skor = progress.quizScores || {};
  const idQuizLulus = Object.keys(skor)
    .filter((id) => skor[id]?.passed)
    .sort()
    .join(',');
  useEffect(() => {
    const ids = idQuizLulus ? idQuizLulus.split(',') : [];
    const lama = baca<Record<string, string>>(KUNCI_QUIZ);
    const baru = perbaruiQuizDikenal(lama, ids, hariIni);
    if (JSON.stringify(baru) !== JSON.stringify(lama)) simpan(KUNCI_QUIZ, baru);
    setQuizDikenal(baru);
  }, [idQuizLulus, hariIni]);

  const daftar: Notifikasi[] = useMemo(() => {
    const batas = new Date(hariIni + 'T00:00:00');
    batas.setDate(batas.getDate() - BATAS_HARI_MODUL_BARU);
    const batasStr = tanggalLokal(batas);
    const modulBaru = modulSiap()
      .filter((m) => dikenal[m.id] && dikenal[m.id] >= batasStr)
      .map((m) => ({ ...m, sejak: dikenal[m.id] }));
    const batasQuiz = new Date(hariIni + 'T00:00:00');
    batasQuiz.setDate(batasQuiz.getDate() - BATAS_HARI_QUIZ);
    const batasQuizStr = tanggalLokal(batasQuiz);
    const quizLulus: QuizLulusInfo[] = [];
    for (const [id, sejak] of Object.entries(quizDikenal)) {
      if (!sejak || sejak < batasQuizStr) continue;
      const m = modulesData.find((x) => x.id === id);
      if (!m) continue;
      const kelasId = m.courseId || 'java';
      const sekelas = modulSiap().filter((x) => x.kelasId === kelasId);
      const urutan = sekelas.findIndex((x) => x.id === id);
      quizLulus.push({ modulId: id, judul: m.title, kelasId, sejak, adaBerikutnya: urutan >= 0 && urutan < sekelas.length - 1 });
    }
    return hitungNotifikasi({
      streak: progress.streak,
      lastActiveDate: progress.lastActiveDate,
      jumlahSelesai: progress.completedLessons.length,
      hariIni,
      modulBaru,
      quizLulus,
    });
  }, [progress.streak, progress.lastActiveDate, progress.completedLessons.length, hariIni, dikenal, quizDikenal]);

  const tandaiDibaca = useCallback((id: string) => {
    const lama = baca<string[]>(KUNCI_DIBACA) ?? [];
    if (lama.includes(id)) return;
    const baru = [...lama, id].slice(-200);
    setDibaca(baru);
    simpan(KUNCI_DIBACA, baru);
  }, []);

  const tandaiSemua = useCallback(() => {
    const lama = baca<string[]>(KUNCI_DIBACA) ?? [];
    const baru = Array.from(new Set([...lama, ...daftar.map((n) => n.id)])).slice(-200);
    setDibaca(baru);
    simpan(KUNCI_DIBACA, baru);
  }, [daftar]);

  const belumDibaca = daftar.filter((n) => !dibaca.includes(n.id)).length;
  return { daftar, dibaca, belumDibaca, tandaiDibaca, tandaiSemua };
}
