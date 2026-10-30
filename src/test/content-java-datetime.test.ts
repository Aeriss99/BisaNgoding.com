import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { Lesson, UnderstandingCheckCard } from '../types/schema';

/**
 * Modul Java Date & Time (setelah Stream). Semua kode dijalankan di browser dengan Java 8 (CheerpJ),
 * jadi tidak boleh memakai API Java 9 ke atas. Keluaran setiap soal dan tantangan sudah dicocokkan
 * dengan javac --release 8 oleh pembuat modul; test-java.js mengulang pemeriksaan tantangan di CI.
 */
const akar = path.resolve(__dirname, '../../content/java');
const dir = path.join(akar, 'module-09-date-time');
const baca = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'));
const files = fs.readdirSync(dir).filter((f) => f.startsWith('lesson-')).sort();
const lessons: Lesson[] = files.map((f) => baca(path.join(dir, f)));

// API yang baru ada setelah Java 8 dan tidak boleh muncul di kode modul ini.
const BUKAN_JAVA8 = [/\bList\.of\(/, /\bMap\.of\(/, /\bSet\.of\(/, /\bvar\s+\w+\s*=/, /toMinutesPart|toHoursPart|toSecondsPart/, /datesUntil/, /ofInstant/, /"""/, /\brecord\s+\w+\s*\(/];

function semuaKode(l: Lesson): string[] {
  const kode: string[] = [];
  for (const c of l.cards as any[]) {
    if (c.type === 'theory') kode.push(...[...c.content.matchAll(/```java[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]));
    if (c.type === 'runnable') kode.push(c.code);
    if (c.type === 'code_challenge') kode.push(c.solution, c.starterCode, c.skeleton);
    if (c.type === 'understanding_check') kode.push(...c.questions.map((q: any) => q.code ?? ''));
  }
  return kode;
}

describe('Modul Java Date & Time', () => {
  it('terdaftar ready tepat setelah Stream dengan jumlah materi yang benar', () => {
    const modules: any[] = baca(path.join(akar, 'modules.json'));
    const dt = modules.find((m) => m.id === 'date-time');
    const stream = modules.find((m) => m.id === 'stream');
    expect(dt).toMatchObject({ status: 'ready', requires: 'stream', lessonCount: 12 });
    expect(dt.order).toBe(stream.order + 1);
    expect(lessons.length).toBe(12);
    expect(modules.find((m) => m.id === 'apache-maven').requires).toBe('date-time');
    const orders = modules.map((m) => m.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  for (const l of lessons) {
    describe(`${l.id} ${l.title}`, () => {
      it('urutan kartu sama dengan modul Java lain', () => {
        expect(l.moduleId).toBe('date-time');
        expect(l.cards.map((c) => c.type)).toEqual([
          'theory', 'theory', 'theory', 'runnable', 'theory', 'understanding_check', 'multiple_choice', 'code_challenge', 'summary',
        ]);
        expect((l.cards[4] as any).content).toContain('### Kesalahan yang sering terjadi');
      });

      it('cek pemahaman 6 soal berbeda dengan remedial sendiri, pilihan ganda tidak sama dengan soal cek', () => {
        const cek = l.cards[5] as UnderstandingCheckCard;
        expect(cek.questions.length).toBe(6);
        expect(new Set(cek.questions.map((q) => `${q.question}\n${q.code ?? ''}`)).size).toBe(6);
        expect(new Set(cek.questions.map((q) => q.remedial)).size).toBe(6);
        for (const q of cek.questions) {
          expect(new Set(q.options).size).toBe(4);
          expect(q.answer).toBeGreaterThanOrEqual(0);
          expect(q.answer).toBeLessThan(4);
        }
        const mc = l.cards[6] as any;
        expect(cek.questions.some((q) => q.question === mc.question)).toBe(false);
      });

      it('semua kode bisa dijalankan di Java 8', () => {
        for (const k of semuaKode(l)) {
          for (const pola of BUKAN_JAVA8) expect(k, `${pola}`).not.toMatch(pola);
        }
      });
    });
  }

  it('quiz 20 soal berbeda, id berurutan, kunci tersebar', () => {
    const quiz: any[] = baca(path.join(dir, 'quiz.json'));
    expect(quiz.length).toBe(20);
    quiz.forEach((q, i) => {
      expect(q.id).toBe(`java-date-time-quiz-${String(i + 1).padStart(2, '0')}`);
      expect(new Set(q.options).size).toBe(4);
      expect(q.explanation.length).toBeGreaterThan(20);
    });
    expect(new Set(quiz.map((q) => `${q.question}\n${q.code ?? ''}`)).size).toBe(20);
    for (const k of [0, 1, 2, 3]) expect(quiz.filter((q) => q.answer === k).length).toBeGreaterThanOrEqual(4);
  });
});
