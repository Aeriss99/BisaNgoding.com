import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { Lesson, PraktikJavaCard } from '../types/schema';
import { cekWajib, keluaranSama, kodeAwalLangkah } from '../lib/praktikJava';
import { jarUntuk } from '../lib/javaPustaka';

/**
 * Tujuh modul Java setelah Maven: Unit Test, Logging, Lombok, JDBC, Proyek Todolist Database, Validation, JSON.
 * Kode memakai library asli (public/java-lib) dan dijalankan di browser dengan Java 8 (CheerpJ).
 * Jawaban praktik, tantangan, dan contoh diperiksa dengan javac --release 8 oleh pembuat modul;
 * scripts/test-java.js mengulangnya di CI. Materi terminal memakai keluaran Maven dan MySQL asli.
 */
const akar = path.resolve(__dirname, '../../content/java');
const baca = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'));
const MODUL = [
  { id: 'unit-test', folder: 'module-13-unit-test', jumlah: 10, requires: 'apache-maven', praktik: 'Uji Todolist', jar: 'junit-jupiter-api-5.10.5.jar' },
  { id: 'logging', folder: 'module-14-logging', jumlah: 7, requires: 'unit-test', praktik: 'Log Todolist', jar: 'logback-classic-1.3.15.jar' },
  { id: 'lombok', folder: 'module-15-lombok', jumlah: 7, requires: 'logging', praktik: 'Todolist Ringkas', jar: 'lombok-1.18.34.jar' },
  { id: 'database', folder: 'module-16-database', jumlah: 9, requires: 'lombok', praktik: 'Toko Database', jar: 'h2-2.2.224.jar' },
  { id: 'database-todolist', folder: 'module-17-database-todolist', jumlah: 8, requires: 'database', praktik: 'Todolist Database', jar: 'h2-2.2.224.jar' },
  { id: 'validation', folder: 'module-18-validation', jumlah: 6, requires: 'database-todolist', praktik: 'Formulir Todo', jar: 'hibernate-validator-7.0.5.Final.jar' },
  { id: 'json', folder: 'module-19-json', jumlah: 7, requires: 'validation', praktik: 'Todolist JSON', jar: 'jackson-databind-2.17.2.jar' },
];
const EDITOR = ['theory', 'theory', 'theory', 'runnable', 'theory', 'theory', 'praktik_java', 'understanding_check', 'multiple_choice', 'code_challenge', 'summary'];
const TERMINAL = ['theory', 'theory', 'theory', 'theory', 'theory', 'praktik_terminal', 'understanding_check', 'multiple_choice', 'fill_blank', 'summary'];
const BUKAN_JAVA8 = [/\bList\.of\(/, /\bMap\.of\(/, /\bSet\.of\(/, /\bvar\s+\w+\s*=/, /"""/, /\brecord\s+\w+\s*\(/, /readString\(/, /writeString\(/, /\bPath\.of\(/, /(?<!Collectors)\.toList\(\)/, /isBlank\(/, /\.repeat\(/];

function kodeJalan(l: Lesson): string[] {
  const kode: string[] = [];
  for (const c of l.cards as any[]) {
    if (c.type === 'runnable') kode.push(c.code);
    if (c.type === 'code_challenge') kode.push(c.solution, c.starterCode);
    if (c.type === 'praktik_java') kode.push(...c.langkah.map((x: any) => x.jawaban));
  }
  return kode;
}

/** Jawaban benar yang menjadi satu-satunya pilihan terpanjang mudah ditebak. */
function panjangSendiri(options: string[], answer: number): boolean {
  const p = options.map((o) => o.length);
  const max = Math.max(...p);
  return p[answer] === max && p.filter((x) => x === max).length === 1;
}

describe('Modul Java: Unit Test, Logging, Lombok, JDBC, Todolist Database, Validation, JSON', () => {
  const modules: any[] = baca(path.join(akar, 'modules.json'));

  it('terdaftar ready berurutan setelah Maven, order unik', () => {
    const maven = modules.find((m) => m.id === 'apache-maven');
    MODUL.forEach((m, i) => {
      const mod = modules.find((x) => x.id === m.id);
      expect(mod).toMatchObject({ status: 'ready', requires: m.requires, lessonCount: m.jumlah });
      expect(mod.order).toBe(maven.order + i + 1);
    });
    const orders = modules.map((m) => m.order);
    expect(new Set(orders).size).toBe(orders.length);
    for (const m of modules) if (m.requires) expect(modules.some((x) => x.id === m.requires), m.id).toBe(true);
  });

  for (const m of MODUL) {
    const dir = path.join(akar, m.folder);
    const files = fs.readdirSync(dir).filter((f) => f.startsWith('lesson-')).sort();
    const lessons: Lesson[] = files.map((f) => baca(path.join(dir, f)));

    describe(m.id, () => {
      it(`${m.jumlah} materi berurutan, quiz 20 soal yang tidak mudah ditebak`, () => {
        expect(lessons.length).toBe(m.jumlah);
        lessons.forEach((l, i) => {
          expect(l.moduleId).toBe(m.id);
          expect(l.id).toBe(`java-${m.id}-${String(i + 1).padStart(2, '0')}`);
          expect(l.order).toBe(i + 1);
        });
        const quiz: any[] = baca(path.join(dir, 'quiz.json'));
        expect(quiz.length).toBe(20);
        quiz.forEach((q, i) => {
          expect(q.id).toBe(`java-${m.id}-quiz-${String(i + 1).padStart(2, '0')}`);
          expect(new Set(q.options).size).toBe(q.options.length);
        });
        expect(new Set(quiz.map((q) => q.answer)).size).toBeGreaterThan(2);
        expect(quiz.filter((q) => panjangSendiri(q.options, q.answer)).length).toBeLessThanOrEqual(6);
      });

      it(`memakai library ${m.jar}`, () => {
        const semua = lessons.flatMap(kodeJalan).join('\n');
        expect(jarUntuk(semua)).toContain(m.jar);
      });

      for (const l of lessons) {
        describe(`${l.id} ${l.title}`, () => {
          const jenis = l.cards.map((c) => c.type);
          const terminal = jenis.includes('praktik_terminal');

          it('susunan kartu dan teori standar industri', () => {
            if (terminal) {
              expect((l as any).runnable).toBe(false);
              expect(jenis).toEqual(TERMINAL);
            } else {
              expect(jenis).toEqual(EDITOR);
            }
            const teori = l.cards.filter((c) => c.type === 'theory').map((c: any) => c.content as string);
            expect(teori.some((t) => t.includes('### Contoh'))).toBe(true);
            const iKes = teori.findIndex((t) => t.startsWith('### Kesalahan yang sering terjadi'));
            expect(iKes).toBeGreaterThan(0);
            expect(teori[iKes + 1]).toMatch(/^### Di dunia kerja\n/);
            expect(teori.join('\n')).toMatch(/Ibarat|Ingat perumpamaan/);
          });

          it('cek pemahaman 3 soal dengan jawaban tersebar dan remedial', () => {
            const cek = l.cards.find((c) => c.type === 'understanding_check') as any;
            expect(cek.questions.length).toBe(3);
            expect(new Set(cek.questions.map((q: any) => q.answer)).size).toBeGreaterThan(1);
            for (const q of cek.questions) {
              expect(new Set(q.options).size).toBe(4);
              expect(q.remedial.length).toBeGreaterThan(40);
            }
          });

          it('semua kode bisa dijalankan di Java 8', () => {
            for (const k of kodeJalan(l)) for (const pola of BUKAN_JAVA8) expect(k, `${pola}`).not.toMatch(pola);
          });

          if (terminal) {
            it('praktik terminal: contoh lalu minimal 2 tugas dengan petunjuk', () => {
              const card = l.cards.find((c) => c.type === 'praktik_terminal') as any;
              expect(card.judul).toMatch(new RegExp(`^${m.praktik} ${l.order}: `));
              expect(card.langkah[0].otomatis).toBe(true);
              expect(card.langkah.slice(1).some((x: any) => x.otomatis)).toBe(false);
              expect(card.langkah.filter((x: any) => !x.otomatis).length).toBeGreaterThanOrEqual(2);
              for (const x of card.langkah) {
                expect(x.terima.length).toBeGreaterThan(0);
                if (!x.otomatis) expect(x.petunjuk.length).toBeGreaterThan(0);
              }
              // jalur rekaman diganti ke laptop Sari
              expect(JSON.stringify(card)).not.toMatch(/\/home\/claude|\/var\/tmp|172\.18\./);
            });
          } else {
            it('runnable: tebakan, anotasi, dan penjelasan teks biasa', () => {
              const r = l.cards.find((c) => c.type === 'runnable') as any;
              expect(r.predict.options.length).toBe(4);
              expect(r.annotations.length).toBeGreaterThan(0);
              expect(r.explanation).not.toMatch(/`|\*\*/);
              for (const t of r.tryThis) expect(t.task).not.toMatch(/`|\*\*/);
            });

            it('praktik bersama Lingga: contoh lalu minimal 2 tugas dengan kode awal yang belum selesai', () => {
              const card = l.cards.find((c) => c.type === 'praktik_java') as PraktikJavaCard;
              expect(card.judul).toMatch(new RegExp(`^${m.praktik} ${l.order}: `));
              expect(card.langkah[0].otomatis).toBe(true);
              expect(card.langkah.slice(1).some((x) => x.otomatis)).toBe(false);
              expect(card.langkah.filter((x) => !x.otomatis).length).toBeGreaterThanOrEqual(2);
              card.langkah.forEach((x, i) => {
                expect(x.jawaban).toMatch(/public class Main/);
                expect(x.keluaran.length).toBeGreaterThan(0);
                expect(cekWajib(x.jawaban, x.wajib)).toBeNull();
                if (x.otomatis) return;
                expect(x.petunjuk.length).toBeGreaterThan(0);
                expect(kodeAwalLangkah(card, i).trim()).not.toBe(x.jawaban.trim());
                const berikut = card.langkah[i + 1];
                if (berikut) expect(keluaranSama(berikut.keluaran, x.keluaran)).toBe(false);
              });
            });

            it('tantangan: prompt teks biasa, solusi, test tanpa spasi di akhir baris, dan petunjuk', () => {
              const cc = l.cards.find((c) => c.type === 'code_challenge') as any;
              expect(cc.prompt).not.toMatch(/`|\*\*/);
              expect(cc.solution).toMatch(/public class Main/);
              expect(cc.starterCode.trim()).not.toBe(cc.solution.trim());
              expect(cc.tests.length).toBeGreaterThanOrEqual(1);
              for (const t of cc.tests) for (const b of t.expectedOutput.split('\n')) expect(b).toBe(b.trimEnd());
              expect(cc.hints.length).toBeGreaterThanOrEqual(2);
            });
          }
        });
      }
    });
  }
});
