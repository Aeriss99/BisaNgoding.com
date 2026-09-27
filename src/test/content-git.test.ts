import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import type { Lesson, Card, FillBlankCard, PredictOutputCard, TheoryCard } from '../types/schema';

describe('Git Content Integrity', () => {
  const contentDir = path.resolve(__dirname, '../../content/git');
  if (!fs.existsSync(contentDir)) {
    it('skips when no content', () => {
      expect(true).toBe(true);
    });
    return;
  }

  const dirs = fs.readdirSync(contentDir).filter(f => fs.statSync(path.join(contentDir, f)).isDirectory());

  if (dirs.length === 0) {
    it('skips when no content', () => {
      expect(true).toBe(true);
    });
    return;
  }

  for (const moduleDir of dirs) {
    const lessonFiles = fs.readdirSync(path.join(contentDir, moduleDir)).filter(f => f.endsWith('.json') && f.startsWith('lesson-'));
    
    for (const file of lessonFiles) {
      const lessonPath = path.join(contentDir, moduleDir, file);
      const lesson: Lesson = JSON.parse(fs.readFileSync(lessonPath, 'utf-8'));

      describe(`Lesson: ${lesson.title} (${file})`, () => {
        
        it('has runnable false', () => {
          expect(lesson.runnable).toBe(false);
        });

        it('does not have runnable or code_challenge cards', () => {
          const invalidCards = lesson.cards.filter(c => c.type === 'runnable' || c.type === 'code_challenge');
          expect(invalidCards.length).toBe(0);
        });

        lesson.cards.forEach((card, index) => {
          describe(`Card ${index + 1} (${card.type})`, () => {
            
            if (card.type === 'fill_blank') {
              it('has blanks equal to answers length', () => {
                const fbc = card as FillBlankCard;
                const blanksCount = (fbc.code.match(/___/g) || []).length;
                expect(blanksCount).toBe(fbc.answers.length);
              });
            }

            if (card.type === 'predict_output') {
              it('has exactly 4 options', () => {
                const poc = card as PredictOutputCard;
                expect(poc.options.length).toBe(4);
              });
              
              it('has unique options', () => {
                const poc = card as PredictOutputCard;
                expect(new Set(poc.options).size).toBe(poc.options.length);
              });

              it('has valid answer index', () => {
                const poc = card as PredictOutputCard;
                expect(poc.answer).toBeGreaterThanOrEqual(0);
                expect(poc.answer).toBeLessThan(poc.options.length);
              });
            }

            if (card.type === 'theory') {
              it('starts mermaid blocks with gitGraph or flowchart', () => {
                const tc = card as TheoryCard;
                const mermaidBlocks = Array.from(tc.content.matchAll(/```mermaid\n([\s\S]*?)```/g));
                for (const match of mermaidBlocks) {
                  const content = match[1].trim();
                  expect(content.startsWith('gitGraph') || content.startsWith('flowchart')).toBe(true);
                }
              });
            } else if (card.type === 'understanding_check' || card.type === 'summary') {
              it('exists', () => {
                expect(card).toBeDefined();
              });
            }
          });
        });
      });
    }
  }
});
