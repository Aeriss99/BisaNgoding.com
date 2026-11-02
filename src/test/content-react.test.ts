import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { transform } from 'sucrase';

/**
 * Kelas React (7 modul, 50 materi). Formatnya seperti kelas Tailwind, tanpa kartu praktik dan tanpa
 * tantangan kode: setiap materi diakhiri satu kartu Praktik (react_preview) yang menjalankan React sungguhan.
 * Pembuat materi sudah menjalankan setiap contoh (dan setiap soal "apa yang tampil") di Chromium dengan
 * runtime pratinjau yang sama (src/vendor/pratinjau-react.js) dan mencocokkan hasilnya dengan kunci.
 * Tes ini menjaga bentuk materi, kunci, dan memastikan semua kode bisa diubah oleh sucrase.
 */
const DIR = path.resolve(__dirname, '../../content/react');
const baca = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'));
const MODUL: [string, string, number][] = [
  ['react-dasar', 'modul-01-react-dasar', 8],
  ['react-props', 'modul-02-react-props', 7],
  ['react-state', 'modul-03-react-state', 8],
  ['react-form', 'modul-04-react-form', 6],
  ['react-efek', 'modul-05-react-efek', 7],
  ['react-lanjut', 'modul-06-react-lanjut', 7],
  ['react-todolist', 'modul-07-react-todolist', 7],
];
// Praktik (kode React yang jalan) ada di akhir materi, sebelum ringkasan (keputusan Lingga 2 Nov).
const URUTAN = ['theory', 'theory', 'theory', 'theory', 'understanding_check', 'multiple_choice', 'react_preview', 'summary'];
const MODUL_BOLEH = ['react', 'react-dom/client', 'react-router', 'react-router-dom'];
// Soal yang sengaja berisi JSX salah (menanyakan kenapa kodenya tidak bisa dibaca).
const SENGAJA_SALAH = new Set(['react-dasar-03/0']);

function ubah(kode: string) {
  return transform(kode, { transforms: ['jsx', 'imports'], jsxRuntime: 'automatic', production: false, filePath: 'App.jsx' });
}

describe('Kelas React', () => {
  const courses = baca(path.resolve(DIR, '../courses.json'));
  const modules = baca(path.join(DIR, 'modules.json'));

  it('kelas siap, 7 modul berurutan dengan prasyarat', () => {
    expect(courses.find((c: { id: string }) => c.id === 'react')).toMatchObject({ status: 'ready', language: 'react' });
    expect(modules.map((m: { id: string }) => m.id)).toEqual(MODUL.map((m) => m[0]));
    modules.forEach((m: { requires?: string; lessonCount: number; courseId: string; status: string; order: number }, i: number) => {
      expect(m).toMatchObject({ courseId: 'react', status: 'ready', lessonCount: MODUL[i][2], order: 160 + i });
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
          for (const k of [0, 1, 2]) expect(l.cards[k].content.length).toBeGreaterThan(400);
          expect(l.cards[3].content).toContain('### Kesalahan yang sering terjadi');
          expect(l.cards[7].points.length).toBeGreaterThanOrEqual(3);
        });
      });

      it('contoh React bisa diubah sucrase, hanya import modul yang tersedia, dan punya komponen yang ditampilkan', () => {
        for (const l of lessons) {
          const c = l.cards[6];
          expect(c.prompt.length).toBeGreaterThan(20);
          expect(() => ubah(c.code), l.id).not.toThrow();
          expect(/export default function|createRoot\(/.test(c.code), l.id).toBe(true);
          for (const [, nama] of c.code.matchAll(/from '([^']+)'/g)) expect(MODUL_BOLEH, `${l.id}: ${nama}`).toContain(nama);
        }
      });

      it('cek pemahaman 6 soal berbeda dengan remedial sendiri', () => {
        for (const l of lessons) {
          const cek = l.cards[4];
          expect(cek.minCorrect).toBe(2);
          expect(cek.questions).toHaveLength(6);
          expect(new Set(cek.questions.map((q: { question: string; code?: string }) => `${q.question}\n${q.code ?? ''}`)).size).toBe(6);
          expect(new Set(cek.questions.map((q: { remedial: string }) => q.remedial)).size).toBe(6);
          cek.questions.forEach((q: { options: string[]; answer: number; code?: string; remedial: string }, k: number) => {
            expect(new Set(q.options).size).toBe(4);
            expect(q.answer).toBeGreaterThanOrEqual(0);
            expect(q.answer).toBeLessThan(4);
            expect(q.remedial.length).toBeGreaterThan(40);
            if (q.code && !SENGAJA_SALAH.has(`${l.id}/${k}`)) expect(() => ubah(q.code!), `${l.id} soal ${k + 1}`).not.toThrow();
          });
          expect(new Set(cek.questions.map((q: { answer: number }) => q.answer)).size).toBeGreaterThan(1);
          expect(cek.questions.some((q: { question: string }) => q.question === l.cards[5].question)).toBe(false);
        }
      });

      it('quiz 20 soal, id berurutan, kunci tersebar, kode bisa dibaca', () => {
        const quiz = baca(path.join(dir, 'quiz.json'));
        expect(quiz).toHaveLength(20);
        quiz.forEach((q: { id: string; options: string[]; code?: string; explanation: string }, i: number) => {
          expect(q.id).toBe(`${id}-quiz-${String(i + 1).padStart(2, '0')}`);
          expect(new Set(q.options).size).toBe(4);
          expect(q.explanation.length).toBeGreaterThan(10);
          if (q.code) expect(() => ubah(q.code!), q.id).not.toThrow();
        });
        for (const k of [0, 1, 2, 3]) expect(quiz.filter((q: { answer: number }) => q.answer === k).length).toBeGreaterThanOrEqual(4);
      });
    });
  }
});
