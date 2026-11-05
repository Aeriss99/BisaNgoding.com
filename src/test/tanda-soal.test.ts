import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Soal, pilihan jawaban, dan penjelasan ditampilkan sebagai teks biasa (bukan Markdown),
// jadi tanda ` dan **teks** tampil mentah. Pakai kutip: 'git'. Lihat scripts/ganti-tanda-soal.py.
const AKAR = path.resolve(__dirname, '../../content');
const BOLEH_BACKTICK = new Set(['SELECT * FROM `group`;']); // sintaks SQL asli
const RE_TEBAL = /(?<!\*)\*\*[^\s*](?:[^*\n]*?[^\s*])?\*\*(?!\*)/;

function semuaJson(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return semuaJson(p);
    return e.name.endsWith('.json') ? [p] : [];
  });
}

function kumpulkan(o: unknown, hasil: string[]): void {
  if (Array.isArray(o)) {
    o.forEach((x) => kumpulkan(x, hasil));
    return;
  }
  if (!o || typeof o !== 'object') return;
  const obj = o as Record<string, unknown>;
  if ('options' in obj && 'answer' in obj) {
    for (const k of ['question', 'explanation']) {
      if (typeof obj[k] === 'string') hasil.push(obj[k] as string);
    }
    if (Array.isArray(obj.options)) {
      obj.options.forEach((x) => typeof x === 'string' && hasil.push(x));
    }
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k !== 'code' && k !== 'remedial') kumpulkan(v, hasil);
  }
}

describe('Tanda Markdown di soal', () => {
  const salah: string[] = [];
  for (const f of semuaJson(AKAR)) {
    const teks: string[] = [];
    kumpulkan(JSON.parse(fs.readFileSync(f, 'utf-8')), teks);
    for (const t of teks) {
      if ((t.includes('`') && !BOLEH_BACKTICK.has(t)) || RE_TEBAL.test(t)) {
        salah.push(`${path.relative(AKAR, f)}: ${t.slice(0, 80)}`);
      }
    }
  }

  it('soal, pilihan, dan penjelasan tidak memakai ` atau **teks**', () => {
    expect(salah).toEqual([]);
  });
});
