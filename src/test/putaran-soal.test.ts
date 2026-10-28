import { describe, it, expect } from 'vitest';
import { acakKartu, susunPutaran } from '../lib/quizLogic';

function rngBerbenih(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

const soal = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'].map((question, i) => ({
  question,
  options: ['a', 'b', 'c', 'd'],
  answer: i % 4,
}));

describe('Putaran soal cek pemahaman', () => {
  it('semua soal muncul sekali per putaran dan kuncinya tetap benar', () => {
    const rng = rngBerbenih(9);
    for (let k = 0; k < 50; k++) {
      const p = susunPutaran(soal, null, rng);
      expect(p.map((q) => q.question).sort()).toEqual(soal.map((q) => q.question));
      for (const q of p) {
        const asli = soal.find((x) => x.question === q.question)!;
        expect(q.options[q.answer]).toBe(asli.options[asli.answer]);
      }
    }
  });

  it('soal yang baru tampil tidak langsung muncul lagi di awal putaran berikutnya', () => {
    const rng = rngBerbenih(4);
    let terakhir = soal[0];
    for (let k = 0; k < 300; k++) {
      const p = susunPutaran(soal, terakhir, rng);
      expect(p[0].question).not.toBe(terakhir.question);
      terakhir = p[p.length - 1];
    }
  });

  it('pilihan jawaban diacak ulang di setiap putaran (tidak selalu urutan yang sama)', () => {
    const rng = rngBerbenih(21);
    const urutan = new Set<string>();
    for (let k = 0; k < 40; k++) {
      const q = susunPutaran([soal[0]], null, rng)[0];
      urutan.add(q.options.join(''));
    }
    expect(urutan.size).toBeGreaterThan(5);
  });

  it('acakKartu mengacak pilihan ganda dan tebak output, kartu lain tidak diubah', () => {
    const rng = rngBerbenih(2);
    const mc = { type: 'multiple_choice', question: 'x', options: ['p', 'q', 'r', 's'], answer: 2, explanation: '' };
    const urutan = new Set<string>();
    for (let k = 0; k < 30; k++) {
      const h = acakKartu(mc, rng);
      expect(h.options[h.answer]).toBe('r');
      urutan.add(h.options.join(''));
    }
    expect(urutan.size).toBeGreaterThan(5);
    const teori = { type: 'theory', content: 'a' };
    expect(acakKartu(teori, rng)).toBe(teori);
  });
});
