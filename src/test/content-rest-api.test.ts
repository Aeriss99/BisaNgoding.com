import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Kelas RESTful API: struktur, kualitas minimum, dan penolak isi placeholder/salinan.
const DIR = path.resolve(__dirname, '../../content/rest-api');
const baca = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'));
type Mod = { id: string; title: string; lessonCount: number; requires?: unknown; order: number; status: string };
const modules: Mod[] = baca(path.join(DIR, 'modules.json'));
const URUTAN = ['theory', 'theory', 'theory', 'theory', 'understanding_check', 'predict_output', 'fill_blank', 'summary'];
const PLACEHOLDER = /\b(Lesson \d+|Quiz Q\d+|Quiz Evaluasi|Core theory|lorem ipsum|placeholder|TODO)\b/;
const tanpaAngka = (s: string) => s.toLowerCase().replace(/[0-9]+/g, '').replace(/\s+/g, ' ').trim();
// kalimat prosa panjang (di luar blok kode, tabel, dan baris output) untuk mendeteksi teks salinan antar materi
function kalimatProsa(md: string): string[] {
  const tanpaKode = md.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ');
  return tanpaKode
    .split('\n')
    .filter((b) => !b.trim().startsWith('|'))
    .join('\n')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length >= 80);
}

describe('Kelas RESTful API', () => {
  it('7 modul berurutan dengan prasyarat string yang menunjuk modul sebelumnya', () => {
    expect(modules.map((m) => m.id)).toEqual(['api-dasar', 'api-rest', 'api-client', 'api-desain', 'api-dokumentasi', 'api-keamanan', 'api-proyek']);
    modules.forEach((m, i) => {
      expect(m.status).toBe('ready');
      if (i === 0) expect(m.requires).toBeUndefined();
      else expect(m.requires).toBe(modules[i - 1].id);
    });
  });

  for (const m of modules) {
    const folder = fs.readdirSync(DIR).find((d) => {
      const f = path.join(DIR, d, 'lesson-01.json');
      return fs.existsSync(f) && baca(f).moduleId === m.id;
    });
    describe(m.id, () => {
      it('folder modul ada', () => expect(folder).toBeTruthy());
      if (!folder) return;
      const lessons = fs
        .readdirSync(path.join(DIR, folder))
        .filter((f) => f.startsWith('lesson-'))
        .sort()
        .map((f) => baca(path.join(DIR, folder, f)));
      const quiz: { question: string; options: string[]; answer: number; explanation: string }[] = baca(path.join(DIR, folder, 'quiz.json'));

      it('jumlah materi = lessonCount, 8 kartu berurutan, runnable false', () => {
        expect(lessons.length).toBe(m.lessonCount);
        lessons.forEach((l, i) => {
          expect(l.order).toBe(i + 1);
          expect(l.moduleId).toBe(m.id);
          expect(l.runnable).toBe(false);
          expect(l.cards.map((c: { type: string }) => c.type)).toEqual(URUTAN);
        });
      });

      it('tanpa placeholder, teori cukup panjang, isian dan ringkasan lengkap', () => {
        for (const l of lessons) {
          expect(PLACEHOLDER.test(JSON.stringify(l)), `${l.id} berisi placeholder`).toBe(false);
          for (const c of l.cards.slice(0, 4)) expect(c.content.length, l.id).toBeGreaterThanOrEqual(350);
          expect(l.cards[2].content.startsWith('### Coba di komputermu'), l.id).toBe(true);
          const isian = l.cards[6];
          expect(isian.code.startsWith('# '), l.id).toBe(true);
          expect(isian.code.split('___').length - 1, l.id).toBe(isian.answers.length);
          expect(l.cards[7].points.length).toBeGreaterThanOrEqual(3);
          for (const p of l.cards[7].points) expect(p.length, l.id).toBeGreaterThanOrEqual(25);
          const cek = l.cards[4].questions;
          expect(cek.length).toBe(4);
          expect(new Set(cek.map((q: { answer: number }) => q.answer)).size, `${l.id}: kunci cek semuanya sama`).toBeGreaterThan(1);
        }
      });

      it('tidak ada kalimat prosa panjang yang disalin antar materi', () => {
        const dilihat = new Map<string, string>();
        for (const l of lessons) {
          const teks = l.cards.slice(0, 4).map((c: { content: string }) => c.content).join('\n');
          for (const k of new Set(kalimatProsa(teks))) {
            const lain = dilihat.get(k);
            expect(lain === undefined || lain === l.id, `kalimat sama di ${lain} dan ${l.id}: "${k.slice(0, 80)}"`).toBe(true);
            dilihat.set(k, l.id);
          }
        }
      });

      it('soal cek pemahaman dan quiz tidak kembar (angka diabaikan)', () => {
        const semua = [
          ...lessons.flatMap((l) => l.cards[4].questions.map((q: { question: string; code?: string }) => tanpaAngka(q.question + (q.code ?? '')))),
          ...quiz.map((q) => tanpaAngka(q.question + ((q as { code?: string }).code ?? ''))),
        ];
        expect(new Set(semua).size).toBe(semua.length);
      });

      it('quiz 20 soal, 4 opsi berbeda, kunci tersebar, penjelasan jelas', () => {
        expect(quiz.length).toBe(20);
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
  }
});
