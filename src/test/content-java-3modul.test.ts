import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { Lesson, PraktikJavaCard } from '../types/schema';
import { cekWajib, keluaranSama, kodeAwalLangkah } from '../lib/praktikJava';

/**
 * Tiga modul Java setelah Date & Time: Input Output, Proyek Todolist OOP, dan Apache Maven.
 * Kode dijalankan di browser dengan Java 8 (CheerpJ). Jawaban praktik, tantangan, dan soal "Apa output"
 * diperiksa dengan javac --release 8 oleh pembuat modul; scripts/test-java.js mengulangnya di CI.
 */
const akar = path.resolve(__dirname, '../../content/java');
const baca = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'));
const MODUL = [
  { id: 'input-output', folder: 'module-10-input-output', jumlah: 10, requires: 'date-time', praktik: 'Arsip Toko' },
  { id: 'oop-todolist', folder: 'module-11-oop-todolist', jumlah: 8, requires: 'input-output', praktik: 'Todolist OOP' },
  { id: 'apache-maven', folder: 'module-12-apache-maven', jumlah: 7, requires: 'oop-todolist', praktik: null },
];
const BUKAN_JAVA8 = [/\bList\.of\(/, /\bMap\.of\(/, /\bSet\.of\(/, /\bvar\s+\w+\s*=/, /"""/, /\brecord\s+\w+\s*\(/, /readString\(/, /writeString\(/, /\bPath\.of\(/, /(?<!Collectors)\.toList\(\)/, /isBlank\(/, /\.repeat\(/];

function semuaKode(l: Lesson): string[] {
  const kode: string[] = [];
  for (const c of l.cards as any[]) {
    if (c.type === 'theory') kode.push(...[...c.content.matchAll(/```java[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]));
    if (c.type === 'runnable') kode.push(c.code);
    if (c.type === 'code_challenge') kode.push(c.solution, c.starterCode, c.skeleton ?? '');
    if (c.type === 'understanding_check') kode.push(...c.questions.map((q: any) => q.code ?? ''));
    if (c.type === 'praktik_java') kode.push(...c.langkah.map((x: any) => x.jawaban));
  }
  return kode;
}

describe('Modul Java: Input Output, Proyek Todolist OOP, Maven', () => {
  const modules: any[] = baca(path.join(akar, 'modules.json'));

  it('terdaftar ready berurutan setelah Date & Time, order unik', () => {
    const dt = modules.find((m) => m.id === 'date-time');
    MODUL.forEach((m, i) => {
      const mod = modules.find((x) => x.id === m.id);
      expect(mod).toMatchObject({ status: 'ready', requires: m.requires, lessonCount: m.jumlah });
      expect(mod.order).toBe(dt.order + i + 1);
    });
    expect(modules.find((m) => m.id === 'unit-test').requires).toBe('apache-maven');
    const orders = modules.map((m) => m.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  for (const m of MODUL) {
    const dir = path.join(akar, m.folder);
    const files = fs.readdirSync(dir).filter((f) => f.startsWith('lesson-')).sort();
    const lessons: Lesson[] = files.map((f) => baca(path.join(dir, f)));

    describe(m.id, () => {
      it(`${m.jumlah} materi dengan id berurutan dan quiz 20 soal`, () => {
        expect(lessons.length).toBe(m.jumlah);
        lessons.forEach((l, i) => {
          expect(l.moduleId).toBe(m.id);
          expect(l.id).toBe(`java-${m.id}-${String(i + 1).padStart(2, '0')}`);
          expect(l.order).toBe(i + 1);
        });
        const quiz: any[] = baca(path.join(dir, 'quiz.json'));
        expect(quiz.length).toBe(20);
        quiz.forEach((q, i) => expect(q.id).toBe(`java-${m.id}-quiz-${String(i + 1).padStart(2, '0')}`));
        expect(new Set(quiz.map((q) => q.answer)).size).toBeGreaterThan(2);
      });

      for (const l of lessons) {
        describe(`${l.id} ${l.title}`, () => {
          const jenis = l.cards.map((c) => c.type);

          it('susunan kartu', () => {
            if (m.praktik) {
              expect(jenis).toEqual(['theory', 'theory', 'theory', 'runnable', 'theory', 'praktik_java', 'understanding_check', 'multiple_choice', 'code_challenge', 'summary']);
            } else {
              expect((l as any).runnable).toBe(false);
              expect(jenis).toEqual(['theory', 'theory', 'theory', 'theory', 'praktik_terminal', 'understanding_check', 'multiple_choice', 'fill_blank', 'summary']);
            }
            const teori = l.cards.filter((c) => c.type === 'theory').map((c: any) => c.content as string);
            expect(teori.some((t) => t.includes('### Contoh'))).toBe(true);
            expect(teori.some((t) => t.includes('### Kesalahan yang sering terjadi'))).toBe(true);
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
            for (const k of semuaKode(l)) for (const pola of BUKAN_JAVA8) expect(k, `${pola}`).not.toMatch(pola);
          });

          if (m.praktik) {
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

            it('tantangan punya solusi, test, dan petunjuk', () => {
              const cc = l.cards.find((c) => c.type === 'code_challenge') as any;
              expect(cc.solution).toMatch(/public class Main/);
              expect(cc.tests.length).toBeGreaterThanOrEqual(1);
              expect(cc.hints.length).toBeGreaterThanOrEqual(2);
            });
          } else {
            it('praktik terminal Maven: contoh lalu minimal 2 tugas, keluaran Maven asli', () => {
              const card = l.cards.find((c) => c.type === 'praktik_terminal') as any;
              expect(card.judul).toMatch(new RegExp(`^Maven ${l.order}: `));
              expect(card.langkah[0].otomatis).toBe(true);
              expect(card.langkah.slice(1).some((x: any) => x.otomatis)).toBe(false);
              expect(card.langkah.filter((x: any) => !x.otomatis).length).toBeGreaterThanOrEqual(2);
              for (const x of card.langkah) {
                expect(x.terima.length).toBeGreaterThan(0);
                if (!x.otomatis) expect(x.petunjuk.length).toBeGreaterThan(0);
              }
              expect(JSON.stringify(card)).not.toMatch(/Finished at: 2026-11-09/);
            });
          }
        });
      }
    });
  }
});
