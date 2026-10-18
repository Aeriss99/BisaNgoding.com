// @vitest-environment node
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';
import { workerCode } from '../lib/jsRunner';

// Modul JavaScript Standard Library dan JavaScript Async: struktur 7 kartu, quiz 20 soal,
// dan solusi tantangan dijalankan dengan workerCode asli (timer, Promise, server latihan fetch).
const ROOT = path.resolve(__dirname, '../../content/javascript');
const baca = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'));
const modules: { id: string; lessonCount: number; status: string; requires?: string; order: number }[] = baca(
  path.join(ROOT, 'modules.json')
);
const URUTAN = ['theory', 'theory', 'theory', 'runnable', 'understanding_check', 'code_challenge', 'summary'];
const PLACEHOLDER = /\b(Lesson \d+|Quiz Q\d+|Core theory|lorem ipsum|placeholder|TODO)\b/;

type Hasil = { stdout: string; stderr: string; exitCode: number };

/** Jalankan kode seperti di Web Worker editor: workerCode asli di context vm terpisah. */
function jalankan(code: string): Promise<Hasil> {
  return new Promise((resolve, reject) => {
    const ctx: Record<string, unknown> = {
      setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, structuredClone,
      Headers, URL, URLSearchParams, AbortController, AbortSignal,
      addEventListener: () => {},
    };
    ctx.postMessage = (m: Hasil & { type: string }) => {
      if (m.type === 'done') { clearTimeout(batas); resolve(m); }
    };
    const batas = setTimeout(() => reject(new Error('waktu habis')), 8000);
    vm.createContext(ctx);
    vm.runInContext('var self = globalThis;\n' + workerCode, ctx);
    (ctx.onmessage as (e: { data: { code: string } }) => void)({ data: { code } });
  });
}

const MODUL = [
  { id: 'js-stdlib', folder: 'js-module-04-stdlib', requires: 'js-dom' },
  { id: 'js-async', folder: 'js-module-05-async', requires: 'js-stdlib' },
];

for (const M of MODUL) {
  const DIR = path.join(ROOT, M.folder);
  const mod = modules.find((m) => m.id === M.id)!;
  const lessons = fs.readdirSync(DIR).filter((f) => f.startsWith('lesson-')).sort().map((f) => baca(path.join(DIR, f)));
  const quiz: { id: string; options: string[]; answer: number }[] = baca(path.join(DIR, 'quiz.json'));

  describe(`Modul ${M.id}`, () => {
    it('terdaftar ready dengan prasyarat yang benar, lessonCount sesuai file', () => {
      expect(mod.status).toBe('ready');
      expect(mod.requires).toBe(M.requires);
      expect(lessons.length).toBe(mod.lessonCount);
      const sebelum = modules.find((m) => m.id === M.requires)!;
      expect(sebelum.status).toBe('ready');
      expect(mod.order).toBeGreaterThan(sebelum.order);
    });

    it('setiap materi: id, urutan, 7 kartu, tanpa placeholder, teori cukup panjang', () => {
      lessons.forEach((l, i) => {
        expect(l.id).toBe(`${M.id}-${String(i + 1).padStart(2, '0')}`);
        expect(l.moduleId).toBe(M.id);
        expect(l.order).toBe(i + 1);
        expect(l.cards.map((c: { type: string }) => c.type)).toEqual(URUTAN);
        expect(PLACEHOLDER.test(JSON.stringify(l)), `${l.id} berisi placeholder`).toBe(false);
        for (const c of l.cards.slice(0, 3)) expect(c.content.length, l.id).toBeGreaterThanOrEqual(300);
      });
    });

    it('runnable dan cek pemahaman valid', () => {
      for (const l of lessons) {
        const r = l.cards[3];
        const baris = r.code.split('\n').length;
        expect(r.predict.answer).toBeLessThan(r.predict.options.length);
        for (const a of r.annotations) {
          expect(a.line).toBeGreaterThanOrEqual(1);
          expect(a.line).toBeLessThanOrEqual(baris);
        }
        const qs = l.cards[4].questions;
        expect(qs.length).toBe(3);
        for (const q of qs) expect(new Set(q.options).size).toBe(q.options.length);
        expect(new Set(qs.map((q: { answer: number }) => q.answer)).size, l.id).toBeGreaterThan(1);
      }
    });

    for (const l of lessons) {
      it(`${l.id}: solusi tantangan menghasilkan output yang diharapkan, skeleton punya ___`, async () => {
        const c = l.cards[5];
        const r = await jalankan(c.solution);
        expect(r.stderr).toBe('');
        expect(r.stdout).toBe(c.tests[0].expectedOutput);
        expect(c.skeleton.includes('___')).toBe(true);
      }, 10000);
    }

    it('quiz 20 soal, id unik, 4 opsi berbeda, kunci tersebar', () => {
      expect(quiz.length).toBe(20);
      expect(new Set(quiz.map((q) => q.id)).size).toBe(20);
      for (const q of quiz) expect(new Set(q.options).size).toBe(4);
      for (let k = 0; k < 4; k++) {
        const n = quiz.filter((q) => q.answer === k).length;
        expect(n).toBeGreaterThanOrEqual(4);
        expect(n).toBeLessThanOrEqual(6);
      }
    });
  });
}
