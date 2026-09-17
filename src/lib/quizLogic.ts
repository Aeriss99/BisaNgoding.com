import type { QuizQuestion } from '../types/schema';

/**
 * Mengambil maksimal `count` soal secara acak dari bank soal.
 * Jika bank soal lebih sedikit dari `count`, kembalikan semua yang ada (teracak).
 */
export function pickRandomQuestions(bank: QuizQuestion[], count: number, rng: () => number = Math.random): QuizQuestion[] {
  const shuffled = [...bank].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Mengacak urutan opsi jawaban sebuah soal, sekaligus menyesuaikan index
 * jawaban benar (`answer`) agar tetap menunjuk ke opsi yang sama.
 */
export function shuffleQuestionOptions(q: QuizQuestion, rng: () => number = Math.random): QuizQuestion {
  const correctText = q.options[q.answer];
  const shuffledOptions = [...q.options].sort(() => rng() - 0.5);
  const newAnswerIndex = shuffledOptions.findIndex((o) => o === correctText);
  return { ...q, options: shuffledOptions, answer: newAnswerIndex };
}

export function prepareQuiz(bank: QuizQuestion[], maxQuestions: number, rng: () => number = Math.random): QuizQuestion[] {
  const picked = pickRandomQuestions(bank, maxQuestions, rng);
  return picked.map((q) => shuffleQuestionOptions(q, rng));
}

/**
 * Menghitung skor (0-100) dari jawaban yang diberikan.
 * `answers` adalah map index soal -> index opsi yang dipilih.
 */
export function calculateScore(questions: QuizQuestion[], answers: Record<number, number>): number {
  if (questions.length === 0) return 0;
  const correctCount = questions.filter((q, i) => answers[i] === q.answer).length;
  return Math.round((correctCount / questions.length) * 100);
}

export const PASSING_SCORE = 70;

export function isPassingScore(score: number): boolean {
  return score >= PASSING_SCORE;
}
