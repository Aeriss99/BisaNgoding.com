import type { CodeChallengeCard } from '../types/schema';

/** Check authored declarations with the browser parser, without mounting learner CSS.
 * This is a rule-writing exercise, not a computed-layout or screenshot comparison.
 */
export function checkCssChallenge(source: string, card: CodeChallengeCard): { passed: boolean; messages: string[] } {
  if (!card.cssChecks?.length) return { passed: false, messages: ['Kriteria latihan CSS belum tersedia.'] };
  const sheet = new CSSStyleSheet();
  try { sheet.replaceSync(source); } catch {
    return { passed: false, messages: ['CSS belum dapat dibaca. Periksa kurung kurawal dan deklarasi.'] };
  }
  const normalize = (s: string) => s.trim().replace(/\s+/g, ' ');
  const selectorKey = (s: string) => normalize(s).replace(/\s*([>+~])\s*/g, '$1').replace(/'/g, '"');
  const mediaKey = (s: string) => normalize(s).replace(/\s*([():])\s*/g, '$1');
  const messages: string[] = [];
  for (const check of card.cssChecks) {
    let actual = '';
    let priority = '';
    const visit = (rules: CSSRuleList, media = '') => {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSMediaRule) {
          // Nested conditions are outside the beginner challenge contract.
          if (!media) visit(rule.cssRules, mediaKey(rule.conditionText));
        } else if (rule instanceof CSSStyleRule && media === mediaKey(check.media ?? '') &&
          selectorKey(rule.selectorText) === selectorKey(check.selector)) {
          const value = rule.style.getPropertyValue(check.property);
          const nextPriority = rule.style.getPropertyPriority(check.property);
          if (value && (priority !== 'important' || nextPriority === 'important')) {
            actual = value;
            priority = nextPriority;
          }
        }
      }
    };
    visit(sheet.cssRules);
    const expected = document.createElement('div').style;
    expected.setProperty(check.property, check.value);
    const target = expected.getPropertyValue(check.property);
    if (!actual || !target || normalize(actual) !== normalize(target)) {
      messages.push(`${check.media ? `@media ${check.media}: ` : ''}${check.selector} perlu ${check.property}: ${check.value};`);
    }
  }
  return { passed: messages.length === 0, messages };
}
