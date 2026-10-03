import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { checkHtmlChallenge } from '../lib/htmlChallenge';
import type { CodeChallengeCard } from '../types/schema';

const dir = 'content/html-css/modul-01-html-dasar';
const challenges = readdirSync(dir).filter(n => n.startsWith('lesson-')).sort().map(name => {
  const lesson = JSON.parse(readFileSync(`${dir}/${name}`, 'utf8'));
  return { name: lesson.title, card: lesson.cards[7] as CodeChallengeCard };
});
describe('HTML challenge criteria', () => {
  for (const { name, card } of challenges) {
    it(`${name}: accepts the solution, rejects blank and incomplete starter`, () => {
      expect(checkHtmlChallenge(card.solution!, card)).toEqual({ passed: true, messages: [] });
      expect(checkHtmlChallenge('', card).passed).toBe(false);
      expect(checkHtmlChallenge(card.starterCode, card).passed).toBe(false);
    });
    it(`${name}: ignores HTML mentioned inside a comment`, () => {
      expect(checkHtmlChallenge(`<!-- ${card.solution} -->`, card).passed).toBe(false);
    });
  }
  it('accepts equivalent HTML formatting instead of exact strings', () => {
    const card = challenges[4].card;
    expect(checkHtmlChallenge("<nav><a href='index.html'>Beranda</a> <a href='portfolio'>Portofolio</a><a href='contact'>Kontak</a></nav>", card).passed).toBe(true);
  });
  it('does not accept auto-inserted document structure', () => {
    const card = challenges[1].card;
    expect(checkHtmlChallenge('<title>Rina</title><h1>Rina</h1><p>Profil saya</p>', card).passed).toBe(false);
  });
  it('does not run learner scripts', () => {
    const card = challenges[0].card;
    checkHtmlChallenge('<script>globalThis.htmlChallengeExecuted = true</script>', card);
    expect((globalThis as any).htmlChallengeExecuted).toBeUndefined();
  });
  it('fails closed if criteria are missing', () => {
    expect(checkHtmlChallenge('<h1>Halo</h1>', { ...challenges[0].card, htmlChecks: [] }).passed).toBe(false);
  });
});
