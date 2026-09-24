import { describe, it, expect } from 'vitest';
import {
  pickRandomQuestions,
  shuffleQuestionOptions,
  prepareQuiz,
  calculateScore,
  isPassingScore,
  PASSING_SCORE,
} from './quizLogic';
import type { QuizQuestion } from '../types/schema';

function makeBank(n: number): QuizQuestion[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `q${i}`,
    question: `Question ${i}?`,
    options: ['A', 'B', 'C', 'D'],
    answer: i % 4,
    explanation: `Explanation ${i}`,
  }));
}

// Deterministic "random" generator for reproducible tests
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

describe('quizLogic', () => {
  describe('pickRandomQuestions', () => {
    it('mengambil maksimal 20 soal dari bank soal besar', () => {
      const bank = makeBank(50);
      const picked = pickRandomQuestions(bank, 20, seededRng(1));
      expect(picked.length).toBe(20);
      // All picked must be unique from the bank
      const ids = new Set(picked.map((q) => q.id));
      expect(ids.size).toBe(20);
    });

    it('mengembalikan semua soal jika bank lebih kecil dari jumlah diminta', () => {
      const bank = makeBank(5);
      const picked = pickRandomQuestions(bank, 20, seededRng(2));
      expect(picked.length).toBe(5);
    });

    it('mengembalikan array kosong jika bank kosong', () => {
      const picked = pickRandomQuestions([], 20, seededRng(3));
      expect(picked.length).toBe(0);
    });
  });

  describe('shuffleQuestionOptions', () => {
    it('menjaga index jawaban benar tetap menunjuk ke opsi yang sama setelah diacak', () => {
      const q: QuizQuestion = {
        id: 'q1',
        question: 'What is 2+2?',
        options: ['1', '2', '3', '4'],
        answer: 3, // '4' is correct
        explanation: 'Basic math',
      };
      const shuffled = shuffleQuestionOptions(q, seededRng(42));
      expect(shuffled.options[shuffled.answer]).toBe('4');
      // Options set should be the same, just reordered
      expect([...shuffled.options].sort()).toEqual([...q.options].sort());
    });
  });

  describe('prepareQuiz', () => {
    it('menyiapkan quiz dengan soal dan opsi teracak, jawaban tetap benar', () => {
      const bank = makeBank(30);
      const quiz = prepareQuiz(bank, 20, seededRng(7));
      expect(quiz.length).toBe(20);
      quiz.forEach((q) => {
        const original = bank.find((b) => b.id === q.id)!;
        const correctText = original.options[original.answer];
        expect(q.options[q.answer]).toBe(correctText);
      });
    });
  });

  describe('calculateScore', () => {
    it('menghitung skor 100% jika semua benar', () => {
      const questions = makeBank(5);
      const answers: Record<number, number> = {};
      questions.forEach((q, i) => {
        answers[i] = q.answer;
      });
      expect(calculateScore(questions, answers)).toBe(100);
    });

    it('menghitung skor 0% jika semua salah', () => {
      const questions = makeBank(4);
      const answers: Record<number, number> = {
        0: (questions[0].answer + 1) % 4,
        1: (questions[1].answer + 1) % 4,
        2: (questions[2].answer + 1) % 4,
        3: (questions[3].answer + 1) % 4,
      };
      expect(calculateScore(questions, answers)).toBe(0);
    });

    it('menghitung skor parsial dengan benar', () => {
      const questions = makeBank(4); // answers: 0,1,2,3
      const answers: Record<number, number> = { 0: 0, 1: 1, 2: 0, 3: 0 }; // 2 correct out of 4 = 50%
      expect(calculateScore(questions, answers)).toBe(50);
    });

    it('mengembalikan 0 jika tidak ada soal', () => {
      expect(calculateScore([], {})).toBe(0);
    });
  });

  describe('isPassingScore', () => {
    it('lulus jika skor >= 70', () => {
      expect(isPassingScore(70)).toBe(true);
      expect(isPassingScore(100)).toBe(true);
    });

    it('tidak lulus jika skor < 70', () => {
      expect(isPassingScore(69)).toBe(false);
      expect(isPassingScore(0)).toBe(false);
    });

    it('PASSING_SCORE constant is 70', () => {
      expect(PASSING_SCORE).toBe(70);
    });
  });
});
