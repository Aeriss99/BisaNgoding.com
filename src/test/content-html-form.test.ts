import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { checkHtmlChallenge } from '../lib/htmlChallenge';
import { checkModuleUnlocked, getModule, getQuizQuestions, getVisibleLessons } from '../lib/content';
import type { CodeChallengeCard, Lesson, QuizQuestion } from '../types/schema';

const dir = 'content/html-css/modul-02-html-form';
const lessons: Lesson[] = readdirSync(dir).filter(n => /^lesson-\d+\.json$/.test(n)).sort()
  .map(n => JSON.parse(readFileSync(`${dir}/${n}`, 'utf8')));
const quiz: QuizQuestion[] = JSON.parse(readFileSync(`${dir}/quiz.json`, 'utf8'));
const order = ['theory', 'theory', 'theory', 'html_preview', 'theory', 'understanding_check', 'multiple_choice', 'code_challenge', 'summary'];

describe('HTML Form learning module', () => {
  it('loads eight lessons and its own quiz without mixing HTML Dasar', () => {
    expect(getModule('html-form')).toMatchObject({ courseId: 'html-css', requires: 'html-dasar', lessonCount: 8 });
    expect(getVisibleLessons('html-form').map(l => l.id)).toEqual(lessons.map(l => l.id));
    expect(lessons).toHaveLength(8);
    expect(getVisibleLessons('html-dasar')).toHaveLength(8);
    expect(getQuizQuestions('html-form')?.map(q => q.id)).toEqual(quiz.map(q => q.id));
    expect(quiz).toHaveLength(20);
  });
  it('unlocks only after completing HTML Dasar and passing its quiz', () => {
    const mod = getModule('html-form')!;
    const progress = { completedLessons: [], quizScores: {} };
    expect(checkModuleUnlocked(mod, progress)).toBe(false);
    const completedLessons = getVisibleLessons('html-dasar').map(l => l.id);
    // Existing UI treats missing quiz results as falsy (still locked).
    expect(checkModuleUnlocked(mod, { ...progress, completedLessons })).toBeFalsy();
    expect(checkModuleUnlocked(mod, { completedLessons, quizScores: { 'html-dasar': { passed: true, score: 80 } } })).toBe(true);
  });
  it('has unique question IDs and four distinct options with valid keys', () => {
    expect(new Set(quiz.map(q => q.id)).size).toBe(20);
    const questions = [...quiz, ...lessons.flatMap(l => l.cards.flatMap(c => c.type === 'understanding_check' ? c.questions : c.type === 'multiple_choice' ? [c] : []))];
    for (const q of questions) {
      expect(q.options, q.question).toHaveLength(4);
      expect(new Set(q.options).size, q.question).toBe(4);
      expect(Number.isInteger(q.answer)).toBe(true);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(4);
      expect(q.explanation.trim()).not.toBe('');
    }
  });
  for (const [i, lesson] of lessons.entries()) {
    it(`${lesson.title}: follows the nine-card teaching flow`, () => {
      expect(lesson.moduleId).toBe('html-form');
      expect(lesson.order).toBe(i + 1);
      expect(lesson.cards.map(c => c.type)).toEqual(order);
      const check = lesson.cards[5];
      expect(check.type === 'understanding_check' && check.questions.length).toBe(4);
    });
    const card = lesson.cards[7] as CodeChallengeCard;
    it(`${lesson.title}: accepts the authored solution, rejects starter and blank`, () => {
      expect(checkHtmlChallenge(card.solution!, card)).toEqual({ passed: true, messages: [] });
      expect(checkHtmlChallenge(card.starterCode, card).passed).toBe(false);
      expect(checkHtmlChallenge('', card).passed).toBe(false);
      expect(checkHtmlChallenge(`<!-- ${card.solution} -->`, card).passed).toBe(false);
    });
    it(`${lesson.title}: catches a missing control, label, name, or required attribute`, () => {
      for (const selector of ['input', 'label', 'select', 'textarea']) {
        const doc = new DOMParser().parseFromString(card.solution!, 'text/html');
        const node = doc.querySelector(selector);
        if (!node) continue;
        node.remove();
        expect(checkHtmlChallenge(doc.body.innerHTML, card).passed, `missing ${selector}`).toBe(false);
      }
      for (const attr of ['name', 'required']) {
        const doc = new DOMParser().parseFromString(card.solution!, 'text/html');
        const control = doc.querySelector(`[${attr}]`);
        if (!control) continue;
        control.removeAttribute(attr);
        expect(checkHtmlChallenge(doc.body.innerHTML, card).passed, `missing ${attr}`).toBe(false);
      }
    });
    it(`${lesson.title}: accepts equivalent whitespace and quote formatting`, () => {
      const source = card.solution!.replace(/"/g, "'").replace(/>\s*</g, '>\n\n<');
      expect(checkHtmlChallenge(source, card).passed).toBe(true);
    });
  }
});
