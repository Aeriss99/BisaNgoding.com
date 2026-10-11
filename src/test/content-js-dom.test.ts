import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Modul JavaScript DOM: struktur 7 kartu, setiap latihan punya HTML, quiz 20 soal,
// dan solusi tantangan benar-benar dijalankan di DOM (happy-dom) dengan HTML latihannya.
const DIR = path.resolve(__dirname, '../../content/javascript/js-module-03-dom');
const baca = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'));
const modules: { id: string; lessonCount: number; status: string; requires?: string; order: number }[] = baca(
  path.resolve(__dirname, '../../content/javascript/modules.json')
);
const mod = modules.find((m) => m.id === 'js-dom')!;
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

function jalankanDiDom(html: string, code: string): string {
  document.body.innerHTML = html;
  let out = '';
  const tulis = (...a: unknown[]) => {
    out += a.map((x) => (typeof x === 'string' ? x : String(x))).join(' ') + '\n';
  };
  new Function('console', code)({ log: tulis, error: tulis });
  return out;
}

describe('Modul JavaScript DOM', () => {
  it('terdaftar ready setelah js-oop, lessonCount sesuai file', () => {
    expect(mod.status).toBe('ready');
    expect(mod.requires).toBe('js-oop');
    expect(lessons.length).toBe(mod.lessonCount);
    const oop = modules.find((m) => m.id === 'js-oop')!;
    expect(mod.order).toBeGreaterThan(oop.order);
  });

  it('setiap materi: id, urutan, 7 kartu, tanpa placeholder, teori cukup panjang', () => {
    lessons.forEach((l, i) => {
      expect(l.id).toBe(`js-dom-${String(i + 1).padStart(2, '0')}`);
      expect(l.moduleId).toBe('js-dom');
      expect(l.order).toBe(i + 1);
      expect(l.cards.map((c: { type: string }) => c.type)).toEqual(URUTAN);
      expect(PLACEHOLDER.test(JSON.stringify(l)), `${l.id} berisi placeholder`).toBe(false);
      for (const c of l.cards.slice(0, 3)) expect(c.content.length, l.id).toBeGreaterThanOrEqual(300);
    });
  });

  it('kartu runnable dan tantangan membawa HTML latihan; anotasi menunjuk baris yang ada', () => {
    for (const l of lessons) {
      const r = l.cards[3];
      expect(r.html.length, `${l.id} runnable tanpa html`).toBeGreaterThan(0);
      expect(l.cards[5].html.length, `${l.id} tantangan tanpa html`).toBeGreaterThan(0);
      const baris = r.code.split('\n').length;
      for (const a of r.annotations) {
        expect(a.line).toBeGreaterThanOrEqual(1);
        expect(a.line).toBeLessThanOrEqual(baris);
      }
      expect(r.predict.answer).toBeLessThan(r.predict.options.length);
    }
  });

  it('blok kode di teori tidak memakai "javascript run" (tidak punya HTML, jadi DOM tidak tersedia)', () => {
    for (const l of lessons) {
      for (const c of l.cards.slice(0, 3)) expect(c.content.includes('```javascript run'), l.id).toBe(false);
    }
  });

  it('cek pemahaman: 3 soal, opsi unik, kunci tidak semuanya sama', () => {
    for (const l of lessons) {
      const qs = l.cards[4].questions;
      expect(qs.length).toBe(3);
      for (const q of qs) expect(new Set(q.options).size).toBe(q.options.length);
      expect(new Set(qs.map((q: { answer: number }) => q.answer)).size, l.id).toBeGreaterThan(1);
    }
  });

  for (const l of lessons) {
    it(`${l.id}: solusi tantangan menghasilkan output yang diharapkan di DOM`, () => {
      const c = l.cards[5];
      expect(jalankanDiDom(c.html, c.solution).trim()).toBe(c.tests[0].expectedOutput.trim());
      expect(c.skeleton.includes('___')).toBe(true);
    });
  }

  it('quiz 20 soal, id unik, 4 opsi berbeda, kunci tersebar', () => {
    expect(quiz.length).toBe(20);
    expect(new Set(quiz.map((q) => q.id)).size).toBe(20);
    for (const q of quiz) {
      expect(q.options.length).toBe(4);
      expect(new Set(q.options).size).toBe(4);
    }
    for (let k = 0; k < 4; k++) {
      const n = quiz.filter((q) => q.answer === k).length;
      expect(n).toBeGreaterThanOrEqual(4);
      expect(n).toBeLessThanOrEqual(6);
    }
  });
});
