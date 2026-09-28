import type { QuizQuestion } from '../types/schema';

/**
 * Mengambil maksimal `count` soal secara acak dari bank soal.
 * Jika bank soal lebih sedikit dari `count`, kembalikan semua yang ada (teracak).
 */
export function pickRandomQuestions(
  bank: QuizQuestion[],
  count: number,
  rng: () => number = Math.random
): QuizQuestion[] {
  return acak(bank, rng).slice(0, count);
}

/**
 * Mengacak urutan array (Fisher–Yates). Setiap urutan punya peluang yang sama.
 * Jangan pakai `sort(() => Math.random() - 0.5)`: hasilnya berat sebelah
 * (opsi pertama cenderung tetap di depan).
 */
export function acak<T>(arr: readonly T[], rng: () => number = Math.random): T[] {
  const hasil = [...arr];
  for (let i = hasil.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [hasil[i], hasil[j]] = [hasil[j], hasil[i]];
  }
  return hasil;
}

/** Mengacak opsi soal apa pun yang punya `options` + `answer`, index jawaban ikut disesuaikan. */
export function acakOpsi<T extends { options: string[]; answer: number }>(q: T, rng: () => number = Math.random): T {
  const urutan = acak(q.options.map((_, i) => i), rng);
  return { ...q, options: urutan.map((i) => q.options[i]), answer: urutan.indexOf(q.answer) };
}

/**
 * Salinan pelajaran dengan urutan pilihan jawaban diacak:
 * pilihan ganda, prediksi output, dan setiap soal cek pemahaman.
 * Supaya kunci jawaban tidak selalu di posisi yang sama (mis. selalu B).
 */
export function acakPilihanPelajaran<L extends { cards: any[] }>(lesson: L, rng: () => number = Math.random): L {
  return {
    ...lesson,
    cards: lesson.cards.map((c) => {
      if ((c.type === 'multiple_choice' || c.type === 'predict_output') && Array.isArray(c.options)) return acakOpsi(c, rng);
      if (c.type === 'understanding_check' && Array.isArray(c.questions))
        return { ...c, questions: c.questions.map((q: { options: string[]; answer: number }) => acakOpsi(q, rng)) };
      return c;
    }),
  };
}

/**
 * Mengacak urutan opsi jawaban sebuah soal, sekaligus menyesuaikan index
 * jawaban benar (`answer`) agar tetap menunjuk ke opsi yang sama.
 */
export function shuffleQuestionOptions(
  q: QuizQuestion,
  rng: () => number = Math.random
): QuizQuestion {
  return acakOpsi(q, rng);
}

export function prepareQuiz(
  bank: QuizQuestion[],
  maxQuestions: number,
  rng: () => number = Math.random
): QuizQuestion[] {
  const picked = pickRandomQuestions(bank, maxQuestions, rng);
  return picked.map((q) => shuffleQuestionOptions(q, rng));
}

/**
 * Menghitung skor (0-100) dari jawaban yang diberikan.
 * `answers` adalah map index soal -> index opsi yang dipilih.
 */
export function calculateScore(
  questions: QuizQuestion[],
  answers: Record<number, number>
): number {
  if (questions.length === 0) return 0;
  const correctCount = questions.filter(
    (q, i) => answers[i] === q.answer
  ).length;
  return Math.round((correctCount / questions.length) * 100);
}

export const PASSING_SCORE = 70;

export function isPassingScore(score: number): boolean {
  return score >= PASSING_SCORE;
}
