import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { checkHtmlChallenge } from '../lib/htmlChallenge';

/**
 * Kelas Tailwind CSS v4 (4 modul). Formatnya sama dengan kelas HTML & CSS, tanpa kartu praktik.
 * Pembuat materi sudah memeriksa setiap kelas Tailwind dengan tailwindcss 4.3.3 dan merender
 * pratinjau di Chromium 390px; tes ini menjaga bentuk materi dan kunci tantangan.
 */
const DIR = path.resolve(__dirname, '../../content/tailwind');
const baca = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'));
const MODUL: [string, string, number][] = [
  ['tw-dasar', 'modul-01-tailwind-dasar', 8],
  ['tw-layout', 'modul-02-tailwind-layout', 8],
  ['tw-interaksi', 'modul-03-tailwind-interaksi', 7],
  ['tw-todolist', 'modul-04-tailwind-todolist', 7],
];
const URUTAN = ['theory', 'theory', 'theory', 'html_preview', 'theory', 'understanding_check', 'multiple_choice', 'code_challenge', 'summary'];

describe('Kelas Tailwind CSS', () => {
  const courses = baca(path.resolve(DIR, '../courses.json'));
  const modules = baca(path.join(DIR, 'modules.json'));

  it('kelas siap, 4 modul berurutan dengan prasyarat', () => {
    expect(courses.find((c: { id: string }) => c.id === 'tailwind')).toMatchObject({ status: 'ready', language: 'html' });
    expect(modules.map((m: { id: string }) => m.id)).toEqual(MODUL.map((m) => m[0]));
    modules.forEach((m: { requires?: string; lessonCount: number; courseId: string; status: string }, i: number) => {
      expect(m).toMatchObject({ courseId: 'tailwind', status: 'ready', lessonCount: MODUL[i][2] });
      expect(m.requires).toBe(i === 0 ? undefined : MODUL[i - 1][0]);
    });
  });

  for (const [id, folder, jumlah] of MODUL) {
    describe(id, () => {
      const dir = path.join(DIR, folder);
      const lessons = fs.readdirSync(dir).filter((f) => f.startsWith('lesson-')).sort().map((f) => baca(path.join(dir, f)));

      it(`${jumlah} materi dengan urutan kartu yang sama`, () => {
        expect(lessons).toHaveLength(jumlah);
        lessons.forEach((l, i) => {
          expect(l.id).toBe(`${id}-${String(i + 1).padStart(2, '0')}`);
          expect(l.moduleId).toBe(id);
          expect(l.runnable).toBe(false);
          expect(l.cards.map((c: { type: string }) => c.type)).toEqual(URUTAN);
          expect(l.cards[4].content).toContain('### Kesalahan yang sering terjadi');
        });
      });

      it('cek pemahaman 6 soal berbeda dengan remedial sendiri', () => {
        for (const l of lessons) {
          const cek = l.cards[5];
          expect(cek.questions).toHaveLength(6);
          expect(new Set(cek.questions.map((q: { question: string; code?: string }) => `${q.question}\n${q.code ?? ''}`)).size).toBe(6);
          expect(new Set(cek.questions.map((q: { remedial: string }) => q.remedial)).size).toBe(6);
          for (const q of cek.questions) {
            expect(new Set(q.options).size).toBe(4);
            expect(q.answer).toBeGreaterThanOrEqual(0);
            expect(q.answer).toBeLessThan(4);
          }
          expect(cek.questions.some((q: { question: string }) => q.question === l.cards[6].question)).toBe(false);
        }
      });

      it('solusi tantangan lulus pemeriksaan, kode awal belum', () => {
        for (const l of lessons) {
          const c = l.cards[7];
          expect(c.htmlChecks.length).toBeGreaterThan(0);
          expect(checkHtmlChallenge(c.solution, c).passed, l.id).toBe(true);
          expect(checkHtmlChallenge(c.starterCode, c).passed, l.id).toBe(false);
        }
      });

      it('quiz 20 soal, id berurutan, kunci tersebar', () => {
        const quiz = baca(path.join(dir, 'quiz.json'));
        expect(quiz).toHaveLength(20);
        quiz.forEach((q: { id: string; options: string[] }, i: number) => {
          expect(q.id).toBe(`${id}-quiz-${String(i + 1).padStart(2, '0')}`);
          expect(new Set(q.options).size).toBe(4);
        });
        for (const k of [0, 1, 2, 3]) expect(quiz.filter((q: { answer: number }) => q.answer === k).length).toBeGreaterThanOrEqual(4);
      });
    });
  }
});
