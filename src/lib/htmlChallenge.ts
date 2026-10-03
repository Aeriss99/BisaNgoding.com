import type { CodeChallengeCard } from '../types/schema';

/** Parse inert HTML; never execute learner code or compare serialized markup strings. */
export function checkHtmlChallenge(source: string, card: CodeChallengeCard): { passed: boolean; messages: string[] } {
  const rules = card.htmlChecks;
  if (!rules?.length) return { passed: false, messages: ['Kriteria latihan HTML belum tersedia.'] };
  const doc = new DOMParser().parseFromString(source, 'text/html');
  const messages: string[] = [];
  if (card.fullDocument) {
    // DOMParser inserts html/head/body automatically; require the authored document as well.
    const authored = source.replace(/<!--[\s\S]*?-->/g, '');
    if (!doc.doctype || !/^html$/i.test(doc.doctype.name) ||
      !['html', 'head', 'body'].every(tag => new RegExp(`<${tag}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${tag}\\s*>`, 'i').test(authored))) {
      messages.push('Pertahankan <!doctype html> serta pasangan html, head, dan body.');
    }
  }
  for (const rule of rules) {
    try {
      const nodes = Array.from(doc.querySelectorAll(rule.selector));
      const ok = (rule.count === undefined ? nodes.length >= (rule.min ?? 1) : nodes.length === rule.count) && nodes.every(node => {
        const text = (node.textContent ?? '').trim();
        return (rule.text === undefined || text === rule.text) &&
          (rule.notText === undefined || (text.length > 0 && text !== rule.notText)) &&
          (rule.attribute === undefined || (rule.value === undefined
            ? !!node.getAttribute(rule.attribute)?.trim()
            : node.getAttribute(rule.attribute) === rule.value));
      });
      if (!ok) messages.push(rule.message);
    } catch {
      messages.push('Kriteria latihan HTML tidak valid.');
    }
  }
  return { passed: messages.length === 0, messages };
}
