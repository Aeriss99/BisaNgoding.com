import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Pengaman soal isian (fill_blank) di semua kelas.
 * Soal isian tanpa petunjuk ("git ___") membuat pelajar menebak-nebak dan terjebak.
 */
const ROOT = path.resolve(__dirname, '../..');
type Isian = { lesson: string; no: number; kelas: string; code: string; answers: string[] };

function semuaIsian(): Isian[] {
  const hasil: Isian[] = [];
  const content = path.join(ROOT, 'content');
  for (const kelas of fs.readdirSync(content)) {
    const dirKelas = path.join(content, kelas);
    if (!fs.statSync(dirKelas).isDirectory()) continue;
    for (const folder of fs.readdirSync(dirKelas)) {
      const dir = path.join(dirKelas, folder);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const f of fs.readdirSync(dir).filter((x) => x.startsWith('lesson-') && x.endsWith('.json'))) {
        const l = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        (l.cards ?? []).forEach((c: { type: string; code?: string; answers?: string[] }, i: number) => {
          if (c.type === 'fill_blank') hasil.push({ lesson: l.id, no: i + 1, kelas, code: c.code ?? '', answers: c.answers ?? [] });
        });
      }
    }
  }
  return hasil;
}

describe('Soal isian (fill_blank)', () => {
  const isian = semuaIsian();

  it('ada soal isian yang diperiksa', () => {
    expect(isian.length).toBeGreaterThan(0);
  });

  it('jumlah ___ sama dengan jumlah jawaban', () => {
    const salah = isian
      .filter((s) => s.code.split('___').length - 1 !== s.answers.length)
      .map((s) => `${s.lesson} kartu ${s.no}`);
    expect(salah).toEqual([]);
  });

  it('tidak ada jawaban atau alternatif jawaban yang kosong', () => {
    const salah = isian
      .filter((s) => s.answers.some((a) => a.split('|').some((x) => !x.trim())))
      .map((s) => `${s.lesson} kartu ${s.no}`);
    expect(salah).toEqual([]);
  });

  it('soal isian Git diawali baris petunjuk (# ...)', () => {
    const salah = isian
      .filter((s) => s.kelas === 'git' && !s.code.trimStart().startsWith('# '))
      .map((s) => `${s.lesson} kartu ${s.no}: ${s.code.split('\n')[0]}`);
    expect(salah).toEqual([]);
  });

  it('kode di luar kotak isian tidak kosong (ada konteks yang bisa dibaca)', () => {
    const salah = isian
      .filter((s) => s.code.replace(/___/g, '').replace(/\s+/g, '').length < 8)
      .map((s) => `${s.lesson} kartu ${s.no}`);
    expect(salah).toEqual([]);
  });
});
