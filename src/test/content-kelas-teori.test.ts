import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { Lesson, TheoryCard, UnderstandingCheckCard } from '../types/schema';

/**
 * Kelas teori tanpa praktik (permintaan Lingga 18 Nov): Kerja Jadi Software Engineer dan Microservices.
 * Setiap kelas 3 modul x 5 materi; setiap materi 6 kartu teori, cek pemahaman 3 soal, ringkasan;
 * setiap modul punya quiz 20 soal.
 */
const AKAR = path.resolve(__dirname, '../../content');

for (const kelas of ['kerja-se', 'microservices']) {
  describe(`Kelas ${kelas}`, () => {
    const modules: { id: string; lessonCount: number }[] = JSON.parse(fs.readFileSync(path.join(AKAR, kelas, 'modules.json'), 'utf-8'));
    const folder = fs.readdirSync(path.join(AKAR, kelas)).filter((n) => n.startsWith('modul-')).sort();

    it('3 modul, masing-masing 5 materi', () => {
      expect(modules.length).toBe(3);
      expect(folder.length).toBe(3);
      for (const m of modules) expect(m.lessonCount).toBe(5);
    });

    for (const f of folder) {
      const dir = path.join(AKAR, kelas, f);
      const files = fs.readdirSync(dir).filter((n) => /^lesson-\d+\.json$/.test(n)).sort();

      it(`${f}: quiz 20 soal dengan 4 pilihan unik dan kunci valid`, () => {
        const quiz: { question: string; options: string[]; answer: number }[] = JSON.parse(fs.readFileSync(path.join(dir, 'quiz.json'), 'utf-8'));
        expect(quiz.length).toBe(20);
        expect(new Set(quiz.map((q) => q.question)).size).toBe(20);
        for (const q of quiz) {
          expect(new Set(q.options).size).toBe(4);
          expect(q.answer).toBeGreaterThanOrEqual(0);
          expect(q.answer).toBeLessThan(4);
        }
      });

      for (const file of files) {
        const lesson: Lesson = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
        it(`${lesson.id}: 6 teori, cek pemahaman, ringkasan, tanpa praktik`, () => {
          expect(lesson.cards.map((c) => c.type)).toEqual(['theory', 'theory', 'theory', 'theory', 'theory', 'theory', 'understanding_check', 'summary']);
          expect(lesson.runnable).toBe(false);
          const teori = lesson.cards.filter((c): c is TheoryCard => c.type === 'theory');
          expect(teori[1].content.startsWith('### Gampangnya begini')).toBe(true);
          expect(teori.some((t) => t.content.includes('### Kesalahan yang sering terjadi'))).toBe(true);
          expect(teori.reduce((n, t) => n + t.content.length, 0)).toBeGreaterThanOrEqual(2400);
          const cek = lesson.cards[6] as UnderstandingCheckCard;
          expect(cek.questions.length).toBe(3);
          for (const q of cek.questions) {
            expect(new Set(q.options).size).toBe(4);
            expect(q.answer).toBeLessThan(q.options.length);
          }
        });
      }
    }
  });
}
