import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { Lesson, PraktikJavaCard } from '../types/schema';
import { cekWajib, keluaranSama, kodeAwalLangkah, rapikanKeluaran } from '../lib/praktikJava';
import { pemeriksaNode } from './alat/tsNode';
import { jalankanSepertiWorker, ratakanModulJs } from './alat/jalankanWorker';

/**
 * Kelas TypeScript (10 modul). Semua kode di kartu (runnable, praktik, tantangan, soal berkode) diperiksa
 * dengan compiler TypeScript yang sama dengan di browser (strict), lalu dijalankan dengan kode Web Worker
 * yang sama (jsRunner) supaya keluaran dan kunci jawabannya cocok dengan yang dilihat pengguna.
 */
const akar = path.resolve(__dirname, '../../content/typescript');
const baca = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'));
const MODUL = [
  { id: 'ts-dasar', folder: 'modul-01-dasar', praktik: 'Toko TS' },
  { id: 'ts-objek', folder: 'modul-02-objek', praktik: 'Katalog TS' },
  { id: 'ts-fungsi', folder: 'modul-03-fungsi', praktik: 'Kasir TS' },
  { id: 'ts-narrowing', folder: 'modul-04-narrowing', praktik: 'Pesanan TS' },
  { id: 'ts-generics', folder: 'modul-05-generics', praktik: 'Gudang TS' },
  { id: 'ts-class', folder: 'modul-06-class', praktik: 'Rekening TS' },
  { id: 'ts-tipe-lanjut', folder: 'modul-07-tipe-lanjut', praktik: 'Profil TS' },
  { id: 'ts-async', folder: 'modul-08-async', praktik: 'API TS' },
  { id: 'ts-tooling', folder: 'modul-09-tooling', praktik: 'Proyek TS', terminal: true },
  { id: 'ts-todolist', folder: 'modul-10-todolist', praktik: 'Todolist TS' },
];
const SUSUNAN_EDITOR = ['theory', 'theory', 'runnable', 'theory', 'theory', 'praktik_java', 'understanding_check', 'multiple_choice', 'code_challenge', 'summary'];
const SUSUNAN_TERMINAL = ['theory', 'theory', 'theory', 'theory', 'theory', 'praktik_terminal', 'understanding_check', 'multiple_choice', 'fill_blank', 'summary'];

const periksa = pemeriksaNode();
type Hasil = { galat: string[]; stdout: string };
const cache = new Map<string, Promise<Hasil>>();
/** Periksa tipe lalu jalankan (seperti `tsc --noEmit && node`). */
function jalankan(kode: string): Promise<Hasil> {
  let h = cache.get(kode);
  if (!h) {
    h = (async () => {
      const p = periksa(kode);
      if (p.galat.length) return { galat: p.galat, stdout: '' };
      const r = await jalankanSepertiWorker(ratakanModulJs(p.js));
      return { galat: [], stdout: r.stdout + (r.stderr ? `\n[stderr] ${r.stderr}` : '') };
    })();
    cache.set(kode, h);
  }
  return h;
}
const baris = (s: string) => rapikanKeluaran(s).split('\n');
const TANDA = /`|\*\*/;

describe('Kelas TypeScript', () => {
  const modules: any[] = baca(path.join(akar, 'modules.json'));

  it('kelas siap dan 10 modul terdaftar berurutan', () => {
    const kelas = baca(path.resolve(__dirname, '../../content/courses.json')).find((c: any) => c.id === 'typescript');
    expect(kelas.status).toBe('ready');
    expect(modules.map((m) => m.id)).toEqual(MODUL.map((m) => m.id));
    modules.forEach((m, i) => {
      expect(m).toMatchObject({ courseId: 'typescript', status: 'ready', order: 190 + i });
      if (i) expect(m.requires).toBe(modules[i - 1].id);
      const n = fs.readdirSync(path.join(akar, MODUL[i].folder)).filter((f) => f.startsWith('lesson-')).length;
      expect(m.lessonCount).toBe(n);
    });
  });

  for (const m of MODUL) {
    const dir = path.join(akar, m.folder);
    const files = fs.readdirSync(dir).filter((f) => f.startsWith('lesson-')).sort();
    const lessons: Lesson[] = files.map((f) => baca(path.join(dir, f)));
    const quiz: any[] = baca(path.join(dir, 'quiz.json'));

    describe(m.id, () => {
      it('materi berurutan, quiz 20 soal, jawaban terpanjang tidak jadi petunjuk', () => {
        expect(lessons.length).toBeGreaterThanOrEqual(6);
        lessons.forEach((l, i) => {
          expect(l.moduleId).toBe(m.id);
          expect(l.id).toBe(`${m.id}-${String(i + 1).padStart(2, '0')}`);
          expect(l.order).toBe(i + 1);
        });
        expect(quiz.length).toBe(20);
        quiz.forEach((q, i) => expect(q.id).toBe(`${m.id}-quiz-${String(i + 1).padStart(2, '0')}`));
        expect(new Set(quiz.map((q) => q.answer)).size).toBeGreaterThan(2);
        const terpanjang = quiz.filter((q) => {
          const p = q.options.map((o: string) => o.length);
          const max = Math.max(...p);
          return p.filter((x: number) => x === max).length === 1 && p[q.answer] === max;
        });
        expect(terpanjang.length).toBeLessThanOrEqual(6);
        const teori = lessons.flatMap((l) => l.cards.filter((c) => c.type === 'theory').map((c: any) => c.content)).join('\n');
        expect(teori).toMatch(/\b(ibarat|bayangkan|analogi)\b/i);
      });

      for (const l of lessons) {
        describe(`${l.id} ${l.title}`, () => {
          it('susunan kartu dan kartu wajib', () => {
            expect(l.cards.map((c) => c.type)).toEqual(m.terminal ? SUSUNAN_TERMINAL : SUSUNAN_EDITOR);
            if (m.terminal) expect((l as any).runnable).toBe(false);
            const teori = l.cards.filter((c) => c.type === 'theory').map((c: any) => c.content as string);
            expect(teori.some((t) => t.includes('### Contoh'))).toBe(true);
            const iKes = teori.findIndex((t) => t.startsWith('### Kesalahan yang sering terjadi'));
            expect(iKes).toBeGreaterThan(-1);
            expect(teori[iKes + 1]).toMatch(/^### Di dunia kerja\n/);
          });

          it('soal pilihan tanpa tanda Markdown, cek pemahaman tersebar dengan remedial', () => {
            const soal: any[] = [];
            for (const c of l.cards as any[]) {
              if (c.type === 'understanding_check') soal.push(...c.questions);
              if (c.type === 'multiple_choice') soal.push(c);
              if (c.type === 'runnable') soal.push({ ...c.predict, explanation: c.explanation });
            }
            for (const q of soal) {
              expect(new Set(q.options).size).toBe(q.options.length);
              for (const t of [q.question, q.explanation, ...q.options]) expect(t, t).not.toMatch(TANDA);
            }
            const cek = l.cards.find((c) => c.type === 'understanding_check') as any;
            expect(cek.questions.length).toBe(3);
            expect(new Set(cek.questions.map((q: any) => q.answer)).size).toBeGreaterThan(1);
            for (const q of cek.questions) expect(q.remedial.length).toBeGreaterThan(40);
            const cc = l.cards.find((c) => c.type === 'code_challenge') as any;
            if (cc) expect(cc.prompt).not.toMatch(TANDA);
          });

          if (m.terminal) {
            it('praktik terminal: contoh lalu minimal 2 tugas, keluaran asli tanpa jejak mesin pembuat', () => {
              const card = l.cards.find((c) => c.type === 'praktik_terminal') as any;
              expect(card.judul).toMatch(new RegExp(`^${m.praktik} ${l.order}: `));
              expect(card.folder).toBe('~/todolist-ts');
              expect(card.langkah[0].otomatis).toBe(true);
              expect(card.langkah.slice(1).some((x: any) => x.otomatis)).toBe(false);
              expect(card.langkah.filter((x: any) => !x.otomatis).length).toBeGreaterThanOrEqual(2);
              for (const x of card.langkah) {
                expect(x.terima.length).toBeGreaterThan(0);
                if (!x.otomatis) expect(x.petunjuk.length).toBeGreaterThan(0);
              }
              expect(JSON.stringify(card)).not.toMatch(/\/tmp\/|scratchpad|claude/);
            });
          } else {
            it('praktik bersama Lingga: aturan langkah', () => {
              const card = l.cards.find((c) => c.type === 'praktik_java') as PraktikJavaCard;
              expect(card.bahasa).toBe('typescript');
              expect(card.judul).toMatch(new RegExp(`^${m.praktik} ${l.order}: `));
              expect(card.langkah[0].otomatis).toBe(true);
              expect(card.langkah.slice(1).some((x) => x.otomatis)).toBe(false);
              expect(card.langkah.filter((x) => !x.otomatis).length).toBeGreaterThanOrEqual(2);
              card.langkah.forEach((x, i) => {
                expect(cekWajib(x.jawaban, x.wajib)).toBeNull();
                if (x.otomatis) return;
                expect(x.petunjuk.length).toBeGreaterThan(0);
                expect(kodeAwalLangkah(card, i).trim()).not.toBe(x.jawaban.trim());
                const berikut = card.langkah[i + 1];
                if (berikut) expect(keluaranSama(berikut.keluaran, x.keluaran)).toBe(false);
              });
            });

            it('semua kode lolos tsc strict dan keluarannya cocok dengan kunci', async () => {
              const card = l.cards.find((c) => c.type === 'praktik_java') as PraktikJavaCard;
              const rn = l.cards.find((c) => c.type === 'runnable') as any;
              const cc = l.cards.find((c) => c.type === 'code_challenge') as any;
              const tugas: Promise<void>[] = [];
              tugas.push(
                jalankan(rn.code).then((h) => {
                  expect(h.galat, rn.code).toEqual([]);
                  expect(baris(h.stdout)).toContain(rn.predict.options[rn.predict.answer]);
                })
              );
              card.langkah.forEach((x, i) => {
                tugas.push(
                  jalankan(x.jawaban).then((h) => {
                    expect(h.galat, x.jawaban).toEqual([]);
                    expect(keluaranSama(h.stdout, x.keluaran), `${h.stdout}\n!=\n${x.keluaran}`).toBe(true);
                  })
                );
                if (!x.otomatis) {
                  tugas.push(
                    jalankan(kodeAwalLangkah(card, i)).then((h) => {
                      expect(h.galat.length > 0 || !keluaranSama(h.stdout, x.keluaran), `langkah ${i + 1} sudah lulus tanpa diubah`).toBe(true);
                    })
                  );
                }
              });
              tugas.push(
                jalankan(cc.solution).then((h) => {
                  expect(h.galat, cc.solution).toEqual([]);
                  expect(keluaranSama(h.stdout, cc.tests[0].expectedOutput)).toBe(true);
                })
              );
              await Promise.all(tugas);
            }, 120_000);
          }

          it('soal berkode: kunci jawaban sesuai hasil tsc dan keluaran', async () => {
            const soal = (l.cards as any[]).flatMap((c) => (c.type === 'understanding_check' ? c.questions : [])).filter((q) => q.code);
            await Promise.all(soal.map((q) => cekSoal(q)));
          }, 60_000);
        });
      }

      it('quiz berkode: kunci jawaban sesuai hasil tsc dan keluaran', async () => {
        await Promise.all(quiz.filter((q) => q.code).map((q) => cekSoal(q)));
      }, 60_000);
    });
  }
});

/**
 * Kunci "Error..." harus ditolak tsc. Soal "Apa output": kunci = seluruh keluaran, baris dipisah " / ".
 * Soal berkode lainnya (pertanyaan konsep tentang kode itu): kodenya harus lolos tsc.
 */
async function cekSoal(q: any) {
  const kunci: string = q.options[q.answer];
  const h = await jalankan(q.code);
  if (/^Error/.test(kunci)) {
    expect(h.galat.length, `${q.question}\n${q.code}`).toBeGreaterThan(0);
    return;
  }
  expect(h.galat, q.code).toEqual([]);
  if (/output/i.test(q.question)) expect(baris(h.stdout).join(' / '), q.code).toBe(kunci);
}

beforeAll(() => {
  // pemanasan compiler (lib es2022) supaya test pertama tidak kehabisan waktu
  periksa('const x: number = 1;');
}, 60_000);
