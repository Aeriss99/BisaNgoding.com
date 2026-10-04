import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { checkCssChallenge } from '../lib/cssChallenge';
import { checkModuleUnlocked, getModule, getQuizQuestions, getVisibleLessons } from '../lib/content';
import type { CodeChallengeCard, Lesson, QuizQuestion } from '../types/schema';
import postcss from 'postcss';

for (const [moduleId, folder, count, requires] of [
  ['css-dasar', 'modul-03-css-dasar', 12, 'html-form'],
  ['css-layout', 'modul-04-css-layout', 10, 'css-dasar'],
] as const) {
  const dir = `content/html-css/${folder}`;
  const lessons: Lesson[] = readdirSync(dir).filter(n => /^lesson-\d+\.json$/.test(n)).sort()
    .map(n => JSON.parse(readFileSync(`${dir}/${n}`, 'utf8')));
  const quiz: QuizQuestion[] = JSON.parse(readFileSync(`${dir}/quiz.json`, 'utf8'));
  describe(moduleId, () => {
    it('loads its lessons, CSS language, prerequisite and quiz', () => {
      expect(getModule(moduleId)).toMatchObject({ language: 'css', lessonCount: count, requires });
      expect(getVisibleLessons(moduleId).map(l => l.id)).toEqual(lessons.map(l => l.id));
      expect(lessons).toHaveLength(count);
      expect(getQuizQuestions(moduleId)).toEqual(quiz);
      expect(quiz).toHaveLength(20);
      expect(new Set(quiz.map(q => q.id)).size).toBe(20);
    });
    it('requires both prior lessons and a passed quiz', () => {
      const mod = getModule(moduleId)!;
      const completedLessons = getVisibleLessons(requires).map(l => l.id);
      expect(checkModuleUnlocked(mod, { completedLessons: [], quizScores: {} })).toBeFalsy();
      expect(checkModuleUnlocked(mod, { completedLessons, quizScores: {} })).toBeFalsy();
      expect(checkModuleUnlocked(mod, { completedLessons: [], quizScores: { [requires]: { passed: true, score: 80 } } })).toBeFalsy();
      expect(checkModuleUnlocked(mod, { completedLessons, quizScores: { [requires]: { passed: true, score: 80 } } })).toBe(true);
    });
    it('has valid answer keys and distinct options', () => {
      const questions = [...quiz, ...lessons.flatMap(l => l.cards.flatMap(c => c.type === 'understanding_check' ? c.questions : c.type === 'multiple_choice' ? [c] : []))];
      for (const q of questions) {
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(4);
        expect(q.explanation.trim()).not.toBe('');
      }
    });
    for (const [i, lesson] of lessons.entries()) {
      it(`${lesson.title}: follows the nine-card flow`, () => {
        expect(lesson.order).toBe(i + 1);
        expect(lesson.moduleId).toBe(moduleId);
        expect(lesson.cards.map(c => c.type)).toEqual(['theory', 'theory', 'theory', 'html_css_preview', 'theory', 'understanding_check', 'multiple_choice', 'code_challenge', 'summary']);
        const check = lesson.cards[5];
        expect(check.type === 'understanding_check' && check.questions.length).toBe(4);
      });
      const card = lesson.cards[7] as CodeChallengeCard;
      it(`${lesson.title}: accepts solution and rejects starter, blank and comments`, () => {
        expect(checkCssChallenge(card.solution!, card)).toEqual({ passed: true, messages: [] });
        for (const source of ['', card.starterCode, `/* ${card.solution} */`]) {
          expect(checkCssChallenge(source, card).passed).toBe(false);
        }
        for (const check of card.cssChecks!) {
          expect(checkCssChallenge(card.starterCode, { ...card, cssChecks: [check] }).passed, `${check.selector} ${check.property} remains in the starter`).toBe(false);
        }
      });
      it(`${lesson.title}: catches every omitted declaration`, () => {
        // Remove a required declaration from the complete stylesheet, including media rules.
        for (const check of card.cssChecks!) {
          const root = postcss.parse(card.solution!);
          const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').replace(/\s*([>+~])\s*/g, '$1').replace(/'/g, '"');
          const normalizeMedia = (value: string) => value.trim().replace(/\s+/g, ' ').replace(/\s*([():])\s*/g, '$1');
          root.walkRules(rule => {
            let media = '';
            for (let parent = rule.parent; parent && parent.type !== 'root'; parent = parent.parent) {
              if (parent.type === 'atrule' && parent.name === 'media') { media = normalizeMedia(parent.params); break; }
            }
            if (normalize(rule.selector) === normalize(check.selector) && media === normalizeMedia(check.media ?? '')) {
              rule.walkDecls(check.property, declaration => declaration.remove());
            }
          });
          const source = root.toString();
          expect(source).not.toBe(card.solution);
          expect(checkCssChallenge(source, card).passed, `${check.selector} ${check.property}`).toBe(false);
        }
      });
    }
  });
}

describe('CSS rule validation boundaries', () => {
  const card: CodeChallengeCard = { type: 'code_challenge', prompt: '', starterCode: '', hints: [], tests: [], cssChecks: [{ selector: '.box', property: 'color', value: 'navy' }] };
  it('does not accept a later overridden declaration', () => {
    expect(checkCssChallenge('.box { color: navy; } .box { color: red; }', card).passed).toBe(false);
    expect(checkCssChallenge('.box { color: navy !important; } .box { color: red; }', card).passed).toBe(true);
  });
  it('rejects unrelated selectors and inactive conditional rules', () => {
    expect(checkCssChallenge('.other { color: navy; }', card).passed).toBe(false);
    expect(checkCssChallenge('@media (min-width: 600px) { .box { color: navy; } }', card).passed).toBe(false);
  });
  it('accepts spacing and comments without mounting the stylesheet', () => {
    expect(checkCssChallenge('/* comment */ .box{color:navy;}', card).passed).toBe(true);
    expect(document.querySelector('style[data-challenge]')).toBeNull();
  });
  it('requires the requested media condition', () => {
    const responsive = { ...card, cssChecks: [{ ...card.cssChecks![0], media: '(min-width: 600px)' }] };
    expect(checkCssChallenge('.box { color: navy; }', responsive).passed).toBe(false);
    expect(checkCssChallenge('@media (max-width: 600px) { .box { color: navy; } }', responsive).passed).toBe(false);
    expect(checkCssChallenge('@media (min-width: 600px) { .box { color: navy; } }', responsive).passed).toBe(true);
  });
  it('fails closed without grading rules', () => {
    expect(checkCssChallenge('.box { color: navy; }', { ...card, cssChecks: [] }).passed).toBe(false);
  });
  it('accepts compact combinators, alternate attribute quotes and media whitespace', () => {
    const compact = { ...card, cssChecks: [{ selector: ".box > input[type=\"email\"]", property: 'color', value: 'navy', media: '(min-width: 600px)' }] };
    expect(checkCssChallenge("@media (min-width:600px){.box>input[type='email']{color:navy}}", compact).passed).toBe(true);
  });
});
