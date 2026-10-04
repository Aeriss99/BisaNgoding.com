import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { labelKartu } from '../lib/materi';

const ROOT = path.resolve(__dirname, '../..');
const DIR = path.join(ROOT, 'content/html-css');
const MOD = path.join(DIR, 'modul-01-html-dasar');
const CARD_ORDER = [
  'theory',
  'theory',
  'theory',
  'html_preview',
  'theory',
  'understanding_check',
  'multiple_choice',
  'code_challenge',
  'summary',
];

describe('HTML Dasar', () => {
  const modules = JSON.parse(fs.readFileSync(path.join(DIR, 'modules.json'), 'utf8'));
  const lessons = fs.readdirSync(MOD)
    .filter((name) => name.startsWith('lesson-') && name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(MOD, name), 'utf8')));
  const quiz = JSON.parse(fs.readFileSync(path.join(MOD, 'quiz.json'), 'utf8'));

  it('label kartu preview mengikuti UI materi', () => {
    expect(labelKartu('html_preview')).toBe('CONTOH KODE');
  });

  it('punya satu modul HTML Dasar dengan 8 materi', () => {
    expect(modules.filter((m: { id: string }) => m.id === 'html-dasar')).toHaveLength(1);
    expect(modules.find((m: { id: string }) => m.id === 'html-dasar')).toMatchObject({
      id: 'html-dasar',
      courseId: 'html-css',
      title: 'HTML Dasar',
      lessonCount: 8,
      status: 'ready',
    });
    expect(lessons).toHaveLength(8);
  });

  it('setiap materi punya alur 9 kartu yang sama', () => {
    for (const lesson of lessons) {
      expect(lesson.moduleId, lesson.id).toBe('html-dasar');
      expect(lesson.runnable, lesson.id).toBe(false);
      expect(lesson.cards.map((card: { type: string }) => card.type), lesson.id).toEqual(CARD_ORDER);
    }
  });

  it('kartu HTML preview punya prompt dan HTML awal', () => {
    for (const lesson of lessons) {
      const previews = lesson.cards.filter((card: { type: string }) => card.type === 'html_preview');
      expect(previews, lesson.id).toHaveLength(1);
      for (const card of previews) {
        expect(card.prompt.trim().length, lesson.id).toBeGreaterThan(0);
        expect(card.html.trim().length, lesson.id).toBeGreaterThan(0);
        expect('css' in card, lesson.id).toBe(false);
      }
    }
  });

  it('cek pemahaman selalu 4 soal dengan 4 opsi unik', () => {
    for (const lesson of lessons) {
      const check = lesson.cards.find((card: { type: string }) => card.type === 'understanding_check');
      expect(check.questions, lesson.id).toHaveLength(4);
      for (const question of check.questions) {
        expect(question.options, question.question).toHaveLength(4);
        expect(new Set(question.options).size, question.question).toBe(4);
        expect(question.answer, question.question).toBeGreaterThanOrEqual(0);
        expect(question.answer, question.question).toBeLessThan(4);
      }
    }
  });

  it('quiz modul tepat 20 soal dan semua kuncinya valid', () => {
    expect(quiz).toHaveLength(20);
    for (const question of quiz) {
      expect(question.options, question.id).toHaveLength(4);
      expect(new Set(question.options).size, question.id).toBe(4);
      expect(question.answer, question.id).toBeGreaterThanOrEqual(0);
      expect(question.answer, question.id).toBeLessThan(4);
    }
  });
});
