import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { Lesson, UnderstandingCheckCard } from '../types/schema';

/**
 * Soal pendek setelah praktik (Java Dasar dan semua materi Git & GitHub):
 * - cek pemahaman berisi 6 soal yang berbeda, masing-masing dengan remedial sendiri,
 * - kartu pilihan ganda / tebak output tidak boleh sama dengan salah satu soal cek.
 */
const akar = path.resolve(__dirname, '../../content');

function semuaMateri(): { file: string; lesson: Lesson }[] {
  const hasil: { file: string; lesson: Lesson }[] = [];
  const folder = [path.join(akar, 'java/module-01-dasar')];
  for (const m of fs.readdirSync(path.join(akar, 'git'))) {
    const p = path.join(akar, 'git', m);
    if (fs.statSync(p).isDirectory()) folder.push(p);
  }
  for (const dir of folder) {
    for (const f of fs.readdirSync(dir).filter((n) => n.startsWith('lesson-')).sort()) {
      const lesson: Lesson = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
      hasil.push({ file: `${path.basename(dir)}/${f}`, lesson });
    }
  }
  return hasil;
}

describe('Soal pendek Java Dasar dan Git & GitHub', () => {
  const materi = semuaMateri();

  it('mencakup 32 materi Java Dasar dan 62 materi Git & GitHub', () => {
    const cek = materi.filter(({ lesson }) => lesson.cards.some((c) => c.type === 'understanding_check'));
    expect(cek.filter(({ lesson }) => lesson.id.startsWith('java-dasar-')).length).toBe(32);
    expect(cek.filter(({ lesson }) => !lesson.id.startsWith('java-dasar-')).length).toBe(62);
  });

  for (const { file, lesson } of materi) {
    const cek = lesson.cards.find((c) => c.type === 'understanding_check') as UnderstandingCheckCard | undefined;
    if (!cek) continue;

    describe(`${file} ${lesson.id}`, () => {
      it('cek pemahaman: 6 soal berbeda, opsi unik, kunci valid, remedial khusus per soal', () => {
        expect(cek.questions.length).toBe(6);
        const kunci = cek.questions.map((q) => `${q.question}\n${q.code ?? ''}`);
        expect(new Set(kunci).size).toBe(6);
        expect(new Set(cek.questions.map((q) => q.remedial)).size).toBe(6);
        for (const q of cek.questions) {
          expect(q.options.length).toBe(4);
          expect(new Set(q.options).size).toBe(4);
          expect(q.answer).toBeGreaterThanOrEqual(0);
          expect(q.answer).toBeLessThan(q.options.length);
          expect(q.remedial.length).toBeGreaterThan(40);
        }
      });

      it('kartu pilihan ganda / tebak output tidak sama dengan soal cek', () => {
        for (const c of lesson.cards) {
          if (c.type !== 'multiple_choice' && c.type !== 'predict_output') continue;
          const tanya = 'question' in c ? (c.question ?? '') : '';
          const kode = 'code' in c ? (c.code ?? '') : '';
          for (const q of cek.questions) {
            const sama = q.question === tanya && (q.code ?? '') === kode;
            expect(sama, `${c.type} sama dengan soal "${q.question}"`).toBe(false);
            if (c.type === 'multiple_choice') expect(q.question).not.toBe(tanya);
          }
        }
      });
    });
  }
});
