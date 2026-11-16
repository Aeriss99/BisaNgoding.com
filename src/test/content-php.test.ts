import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { PraktikJavaCard } from '../types/schema';
import { cekWajib, keluaranSama, kodeAwalLangkah } from '../lib/praktikJava';

// Kelas PHP, modul PHP Dasar: 7 kartu seperti JavaScript + praktik bersama Lingga "Todolist PHP", quiz 20 soal.
const DIR = path.resolve(__dirname, '../../content/php/php-module-01-dasar');
const baca = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'));
const kursus: { id: string; language: string; status: string }[] = baca(path.resolve(__dirname, '../../content/courses.json'));
const modules: { id: string; courseId: string; lessonCount: number; status: string }[] = baca(
  path.resolve(__dirname, '../../content/php/modules.json')
);
const lessons = fs
  .readdirSync(DIR)
  .filter((f) => f.startsWith('lesson-'))
  .sort()
  .map((f) => baca(path.join(DIR, f)));
const quiz: { id: string; question: string; code?: string; options: string[]; answer: number; explanation: string }[] = baca(
  path.join(DIR, 'quiz.json')
);
const URUTAN = ['theory', 'theory', 'theory', 'runnable', 'praktik_java', 'understanding_check', 'code_challenge', 'summary'];
const PLACEHOLDER = /\b(Lesson \d+|Quiz Q\d+|Core theory|lorem ipsum|placeholder|TODO)\b/;

describe('Kelas PHP: modul PHP Dasar', () => {
  it('kelas php terdaftar ready dengan bahasa php, modul berisi 40 materi', () => {
    const k = kursus.find((c) => c.id === 'php')!;
    expect(k.language).toBe('php');
    expect(k.status).toBe('ready');
    const m = modules.find((x) => x.id === 'php-dasar')!;
    expect(m.courseId).toBe('php');
    expect(m.lessonCount).toBe(40);
    expect(lessons.length).toBe(40);
  });

  it('setiap materi: id, urutan, 8 kartu berurutan, teori cukup panjang, tanpa placeholder', () => {
    lessons.forEach((l, i) => {
      expect(l.id).toBe(`php-dasar-${String(i + 1).padStart(2, '0')}`);
      expect(l.moduleId).toBe('php-dasar');
      expect(l.order).toBe(i + 1);
      expect(l.cards.map((c: { type: string }) => c.type), l.id).toEqual(URUTAN);
      expect(PLACEHOLDER.test(JSON.stringify(l)), `${l.id} berisi placeholder`).toBe(false);
      for (const c of l.cards.slice(0, 3)) expect(c.content.length, l.id).toBeGreaterThanOrEqual(300);
    });
  });

  it('kode PHP selalu diawali <?php', () => {
    for (const l of lessons) {
      expect(l.cards[3].code.startsWith('<?php\n'), l.id).toBe(true);
      expect(l.cards[6].solution.startsWith('<?php\n'), l.id).toBe(true);
      expect(l.cards[6].starterCode.startsWith('<?php\n'), l.id).toBe(true);
    }
  });

  it('kartu runnable: prediksi valid dan anotasi menunjuk baris kode yang ada', () => {
    for (const l of lessons) {
      const r = l.cards[3];
      const baris = r.code.split('\n').length;
      expect(r.predict.options.length).toBe(4);
      expect(r.predict.answer).toBeLessThan(4);
      for (const a of r.annotations) {
        expect(a.line, `${l.id} anotasi`).toBeGreaterThanOrEqual(1);
        expect(a.line, `${l.id} anotasi`).toBeLessThanOrEqual(baris);
      }
      expect(r.tryThis.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('cek pemahaman: 3 soal, opsi unik, kunci tidak semuanya sama, ada remedial', () => {
    for (const l of lessons) {
      const qs = l.cards[5].questions;
      expect(qs.length).toBe(3);
      for (const q of qs) {
        expect(new Set(q.options).size).toBe(4);
        expect(q.answer).toBeLessThan(4);
        expect(q.remedial.length).toBeGreaterThan(100);
      }
      expect(new Set(qs.map((q: { answer: number }) => q.answer)).size, `${l.id}: kunci semuanya sama`).toBeGreaterThan(1);
    }
  });

  it('code challenge: skeleton punya ___, solusi beda dari kode awal, output diakhiri baris baru', () => {
    for (const l of lessons) {
      const c = l.cards[6];
      expect(c.skeleton.includes('___'), l.id).toBe(true);
      expect(c.solution.trim()).not.toBe(c.starterCode.trim());
      expect(c.tests[0].expectedOutput.endsWith('\n'), l.id).toBe(true);
      expect(c.hints.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('praktik bersama Lingga "Todolist PHP": contoh, lalu tugas yang melanjutkan kode sebelumnya', () => {
    for (const l of lessons) {
      const card = l.cards[4] as PraktikJavaCard;
      expect(card.bahasa).toBe('php');
      expect(card.judul).toMatch(new RegExp(`^Todolist PHP ${l.order}: `));
      expect(card.langkah[0].otomatis).toBe(true);
      expect(card.langkah.filter((x) => !x.otomatis).length).toBeGreaterThanOrEqual(2);
      card.langkah.forEach((x, i) => {
        expect(x.keluaran.length, `${l.id} langkah ${i}`).toBeGreaterThan(0);
        expect(cekWajib(x.jawaban, x.wajib), `${l.id} langkah ${i}`).toBeNull();
        if (x.otomatis) return;
        expect((x.wajib ?? []).length).toBeGreaterThan(0);
        const awal = kodeAwalLangkah(card, i);
        expect(cekWajib(awal, x.wajib), `${l.id} langkah ${i}: kode awal sudah lolos`).not.toBeNull();
        const berikut = card.langkah[i + 1];
        if (berikut) expect(keluaranSama(berikut.keluaran, x.keluaran)).toBe(false);
      });
    }
  });

  it('judul materi dan soal tidak kembar', () => {
    expect(new Set(lessons.map((l) => l.title)).size).toBe(lessons.length);
    const semua = [
      ...lessons.flatMap((l) => l.cards[5].questions.map((q: { question: string; code?: string }) => q.question + (q.code ?? ''))),
      ...quiz.map((q) => q.question + (q.code ?? '')),
    ];
    expect(new Set(semua).size).toBe(semua.length);
  });

  it('quiz 20 soal, id unik, 4 opsi berbeda, kunci tersebar', () => {
    expect(quiz.length).toBe(20);
    expect(new Set(quiz.map((q) => q.id)).size).toBe(20);
    for (const q of quiz) {
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
