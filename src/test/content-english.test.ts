import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { normalisasi } from '../lib/latihan';
import type { Lesson, Card, TranslateTilesCard, ListenTilesCard, MatchPairsCard, MultipleChoiceCard } from '../types/schema';

describe('English Content Integrity', () => {
  const contentDir = path.resolve(__dirname, '../../content/english');
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

      if (lesson.mode !== 'latihan') continue;

      describe(`Lesson: ${lesson.title} (${file})`, () => {
        
        it('has all newWords in glossary', () => {
          if (lesson.newWords && lesson.newWords.length > 0) {
            expect(lesson.glossary).toBeDefined();
            for (const nw of lesson.newWords) {
              const cleanWord = nw.word.toLowerCase().replace(/[.,!?]/g, '');
              expect(lesson.glossary![cleanWord]).toBeDefined();
            }
          }
        });

        lesson.cards.forEach((card, index) => {
          describe(`Card ${index + 1} (${card.type})`, () => {
            if (card.type === 'translate_tiles' || card.type === 'listen_tiles') {
              const tc = card as TranslateTilesCard | ListenTilesCard;
              
              it('can construct all answers from available tiles', () => {
                const availableTiles = tc.tiles.map(t => t.toLowerCase().trim());
                tc.answers.forEach(ans => {
                  const ansTiles = ans.map(a => a.toLowerCase().trim());
                  const tempAvailable = [...availableTiles];
                  for (const t of ansTiles) {
                    const idx = tempAvailable.indexOf(t);
                    expect(idx, `Tile "${t}" missing for answer: ${ans.join(' ')}`).not.toBe(-1);
                    tempAvailable.splice(idx, 1);
                  }
                });
              });

              it('has at least 2 distractor tiles', () => {
                const answerLength = tc.answers[0].length;
                const totalTiles = tc.tiles.length;
                expect(totalTiles - answerLength).toBeGreaterThanOrEqual(2);
              });
            }

            if (card.type === 'listen_tiles') {
              const lc = card as ListenTilesCard;
              it('has text matching answers[0]', () => {
                const normText = normalisasi(lc.text);
                const normAns = normalisasi(lc.answers[0].join(' '));
                expect(normText).toBe(normAns);
              });
            }

            if (card.type === 'match_pairs') {
              const mc = card as MatchPairsCard;
              it('has 4-5 pairs', () => {
                expect(mc.pairs.length).toBeGreaterThanOrEqual(4);
                expect(mc.pairs.length).toBeLessThanOrEqual(5);
              });
              
              it('has unique text on each side', () => {
                const lefts = mc.pairs.map(p => p.en);
                const rights = mc.pairs.map(p => p.id);
                expect(new Set(lefts).size).toBe(lefts.length);
                expect(new Set(rights).size).toBe(rights.length);
              });
            }

            if (card.type === 'type_translation') {
              it('has answers', () => {
                expect((card as any).answers.length).toBeGreaterThan(0);
              });
            }

            if (card.type === 'multiple_choice') {
              const mc = card as MultipleChoiceCard;
              it('has valid answer index', () => {
                expect(mc.answer).toBeGreaterThanOrEqual(0);
                expect(mc.answer).toBeLessThan(mc.options.length);
              });

              it('has unique options', () => {
                expect(new Set(mc.options).size).toBe(mc.options.length);
              });
            }
          });
        });
      });
    }
  }
});
