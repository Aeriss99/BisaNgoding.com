import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Modul JavaScript OOP: struktur 7 kartu seperti js-dasar, quiz 20 soal, dan penolak isi placeholder/salinan.
const DIR = path.resolve(__dirname, '../../content/javascript/js-module-02-oop');
const baca = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'));
const modules: { id: string; lessonCount: number; status: string; requires?: string }[] = baca(
  path.resolve(__dirname, '../../content/javascript/modules.json')
);
const mod = modules.find((m) => m.id === 'js-oop')!;
const lessons = fs
  .readdirSync(DIR)
  .filter((f) => f.startsWith('lesson-'))
  .sort()
  .map((f) => baca(path.join(DIR, f)));
const quiz: { id: string; question: string; code?: string; options: string[]; answer: number; explanation: string }[] = baca(
  path.join(DIR, 'quiz.json')
);
const URUTAN = ['theory', 'theory', 'theory', 'runnable', 'understanding_check', 'code_challenge', 'summary'];
const PLACEHOLDER = /\b(Lesson \d+|Quiz Q\d+|Core theory|lorem ipsum|placeholder|TODO)\b/;

describe('Modul JavaScript OOP', () => {
  it('terdaftar ready, prasyarat js-todolist, lessonCount sesuai file', () => {
    expect(mod.status).toBe('ready');
    expect(mod.requires).toBe('js-todolist');
    expect(lessons.length).toBe(mod.lessonCount);
  });

  it('setiap materi: id, urutan, 7 kartu berurutan, tanpa placeholder', () => {
    lessons.forEach((l, i) => {
      expect(l.id).toBe(`js-oop-${String(i + 1).padStart(2, '0')}`);
      expect(l.moduleId).toBe('js-oop');
      expect(l.order).toBe(i + 1);
      expect(l.cards.map((c: { type: string }) => c.type)).toEqual(URUTAN);
      expect(PLACEHOLDER.test(JSON.stringify(l)), `${l.id} berisi placeholder`).toBe(false);
      for (const c of l.cards.slice(0, 3)) expect(c.content.length, l.id).toBeGreaterThanOrEqual(300);
    });
  });

  it('kartu runnable: prediksi valid dan anotasi menunjuk baris kode yang ada', () => {
    for (const l of lessons) {
      const r = l.cards[3];
      const baris = r.code.split('\n').length;
      expect(r.predict.answer).toBeGreaterThanOrEqual(0);
      expect(r.predict.answer).toBeLessThan(r.predict.options.length);
      for (const a of r.annotations) {
        expect(a.line, `${l.id} anotasi`).toBeGreaterThanOrEqual(1);
        expect(a.line, `${l.id} anotasi`).toBeLessThanOrEqual(baris);
      }
      expect(r.tryThis.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('cek pemahaman: 3 soal, opsi unik, kunci tidak semuanya sama, ada remedial', () => {
    for (const l of lessons) {
      const qs = l.cards[4].questions;
      expect(qs.length).toBe(3);
      for (const q of qs) {
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(q.remedial.length).toBeGreaterThan(100);
      }
      expect(new Set(qs.map((q: { answer: number }) => q.answer)).size, `${l.id}: kunci semuanya sama`).toBeGreaterThan(1);
    }
  });

  it('code challenge: skeleton punya ___, solusi tidak sama dengan kode awal, output diakhiri baris baru', () => {
    for (const l of lessons) {
      const c = l.cards[5];
      expect(c.skeleton.includes('___'), l.id).toBe(true);
      expect(c.solution.trim()).not.toBe(c.starterCode.trim());
      expect(c.tests[0].expectedOutput.endsWith('\n'), l.id).toBe(true);
      expect(c.hints.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('judul materi dan soal tidak kembar', () => {
    expect(new Set(lessons.map((l) => l.title)).size).toBe(lessons.length);
    const semua = [
      ...lessons.flatMap((l) => l.cards[4].questions.map((q: { question: string; code?: string }) => q.question + (q.code ?? ''))),
      ...quiz.map((q) => q.question + (q.code ?? '')),
    ];
    expect(new Set(semua).size).toBe(semua.length);
  });

  it('quiz 20 soal, id unik, 4 opsi berbeda, kunci tersebar', () => {
    expect(quiz.length).toBe(20);
    expect(new Set(quiz.map((q) => q.id)).size).toBe(20);
    for (const q of quiz) {
      expect(q.options.length).toBe(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.explanation.length).toBeGreaterThanOrEqual(30);
    }
    for (let k = 0; k < 4; k++) {
      const n = quiz.filter((q) => q.answer === k).length;
      expect(n, `posisi kunci ${k}`).toBeGreaterThanOrEqual(4);
      expect(n, `posisi kunci ${k}`).toBeLessThanOrEqual(6);
    }
  });
});
