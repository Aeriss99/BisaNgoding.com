import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const DIR = path.resolve(__dirname, '../../content/rest-api');
const baca = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'));
const modules: { id: string; lessonCount: number; requires?: unknown; order: number }[] = baca(path.join(DIR, 'modules.json'));
const TERLARANG = /\b(Lesson \d|Q\d|Exp|Intro|Core theory|P\d|Quiz Q|Quiz Evaluasi|TODO|lorem|placeholder)\b/i;
const URUTAN = ['theory', 'theory', 'theory', 'theory', 'understanding_check', 'predict_output', 'fill_blank', 'summary'];
const WAJIB: Record<string, string[]> = {
  'Apa Itu API': ['API', 'client', 'server', 'dokumentasi', 'kontrak'],
  'Client, Server, Request, Response': ['request', 'response', 'status', 'HTTP/1.1', 'stateless'],
  'Anatomi URL': ['skema', 'host', 'port', 'path', 'query', '%20'],
  'Method HTTP': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', '201', '204'],
  'Header dan Body': ['Content-Type', 'Accept', 'Authorization', 'Location', 'application/json'],
  'Format JSON': ['objek', 'array', 'string', 'number', 'boolean', 'null', 'ISO 8601'],
  'Melihat Request dengan DevTools dan curl': ['Network', 'DevTools', '-i', '-s', '-w'],
};
// kalimat panjang dipakai untuk mendeteksi teks salinan antar materi
const kalimat = (t: string) => t.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim().toLowerCase()).filter((s) => s.length >= 60);
const tanpaAngka = (s: string) => s.toLowerCase().replace(/[0-9]+/g, '').replace(/\s+/g, ' ').trim();

describe('Kelas RESTful API', () => {
  it('modules.json: requires berupa string dan menunjuk modul yang ada', () => {
    for (const m of modules) {
      if (m.requires !== undefined) {
        expect(typeof m.requires).toBe('string');
        expect(modules.some((x) => x.id === m.requires)).toBe(true);
      }
    }
  });

  for (const m of modules) {
    const folder = fs.readdirSync(DIR).find((d) => fs.existsSync(path.join(DIR, d, 'lesson-01.json')) && baca(path.join(DIR, d, 'lesson-01.json')).moduleId === m.id);
    describe(m.id, () => {
      it('folder ada', () => expect(folder).toBeTruthy());
      if (!folder) return;
      const files = fs.readdirSync(path.join(DIR, folder)).filter((f) => f.startsWith('lesson-')).sort();
      const lessons = files.map((f) => baca(path.join(DIR, folder, f)));
      const quiz: { question: string; options: string[]; answer: number; explanation: string }[] = baca(path.join(DIR, folder, 'quiz.json'));

      it('jumlah materi sesuai lessonCount, 8 kartu berurutan, runnable false', () => {
        expect(lessons.length).toBe(m.lessonCount);
        for (const l of lessons) {
          expect(l.cards.map((c: { type: string }) => c.type)).toEqual(URUTAN);
          expect(l.runnable).toBe(false);
        }
      });

      it('tidak ada placeholder dan teks cukup panjang', () => {
        for (const l of lessons) {
          const json = JSON.stringify(l);
          expect(TERLARANG.test(json), `${l.id} berisi placeholder`).toBe(false);
          for (const c of l.cards.filter((c: { type: string }) => c.type === 'theory')) expect(c.content.length, l.id).toBeGreaterThanOrEqual(400);
          for (const p of l.cards[7].points) expect(p.length, l.id).toBeGreaterThanOrEqual(25);
          expect(l.cards[6].code.startsWith('# '), l.id).toBe(true);
        }
      });

      it('kata kunci wajib ada di materinya', () => {
        for (const l of lessons) {
          const wajib = WAJIB[l.title];
          if (!wajib) continue;
          const teks = JSON.stringify(l.cards);
          for (const k of wajib) expect(teks.includes(k), `${l.title} tidak memuat "${k}"`).toBe(true);
        }
      });

      it('tidak ada kalimat panjang yang disalin antar materi', () => {
        const dilihat = new Map<string, string>();
        for (const l of lessons) {
          const teks = l.cards.filter((c: { type: string }) => c.type === 'theory').map((c: { content: string }) => c.content).join('\n');
          for (const k of new Set(kalimat(teks))) {
            if (k.startsWith('$ ') || k.startsWith('{') || k.startsWith('http/')) continue; // baris output
            const lain = dilihat.get(k);
            expect(lain === undefined || lain === l.id, `kalimat sama di ${lain} dan ${l.id}: "${k.slice(0, 80)}"`).toBe(true);
            dilihat.set(k, l.id);
          }
        }
      });

      it('soal cek pemahaman dan quiz unik (angka diabaikan), tanpa awalan judul', () => {
        const semua: string[] = [];
        for (const l of lessons) for (const q of l.cards[4].questions) {
          expect(q.question.startsWith(l.title + ' -'), l.id).toBe(false);
          semua.push(tanpaAngka(q.question));
        }
        for (const q of quiz) semua.push(tanpaAngka(q.question));
        expect(new Set(semua).size).toBe(semua.length);
      });

      it('quiz: 20 soal, opsi tanpa angka penanda, kunci tersebar', () => {
        expect(quiz.length).toBe(20);
        for (const q of quiz) {
          expect(q.options.length).toBe(4);
          expect(new Set(q.options.map(tanpaAngka)).size).toBe(4);
          for (const o of q.options) expect(/\s\d+$/.test(o), `opsi berakhiran angka: ${o}`).toBe(false);
          expect(q.explanation.length).toBeGreaterThanOrEqual(30);
        }
        for (let k = 0; k < 4; k++) expect(quiz.filter((q) => q.answer === k).length).toBeGreaterThanOrEqual(4);
        if (m.id === 'api-dasar') for (const q of quiz) expect(/\bREST\b/.test(q.question), q.question).toBe(false);
      });
    });
  }
});
