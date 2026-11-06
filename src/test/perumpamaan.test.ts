import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Setiap modul materi punya minimal satu perumpamaan ("Ibarat ...", "Bayangkan ...") di kartu teori,
// supaya konsep baru selalu dikenalkan dengan gambaran sehari-hari. Kelas English (latihan) tidak dihitung.
const AKAR = path.resolve(__dirname, '../../content');
const PENANDA = /\b(ibarat|bayangkan|analogi)\b/i;

type Kartu = { type: string; content?: string };

const modul = fs
  .readdirSync(AKAR, { withFileTypes: true })
  .filter((k) => k.isDirectory() && k.name !== 'english')
  .flatMap((k) =>
    fs
      .readdirSync(path.join(AKAR, k.name), { withFileTypes: true })
      .filter((m) => m.isDirectory())
      .map((m) => path.join(k.name, m.name))
  )
  .map((rel) => {
    const lesson = fs.readdirSync(path.join(AKAR, rel)).filter((n) => /^lesson-\d+\.json$/.test(n));
    return { rel, lesson };
  })
  .filter((m) => m.lesson.length > 0);

describe('Perumpamaan di setiap modul', () => {
  it.each(modul.map((m) => [m.rel, m.lesson] as const))('%s punya perumpamaan', (rel, lesson) => {
    const ada = lesson.some((n) => {
      const d = JSON.parse(fs.readFileSync(path.join(AKAR, rel, n), 'utf-8')) as { cards: Kartu[] };
      return d.cards.some((c) => c.type === 'theory' && PENANDA.test(c.content ?? ''));
    });
    expect(ada).toBe(true);
  });
});
