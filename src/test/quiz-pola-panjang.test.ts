import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Jawaban benar tidak boleh bisa ditebak dari panjangnya: di setiap kelas, soal quiz yang jawaban
// benarnya adalah satu-satunya pilihan terpanjang maksimal 30% (kalau acak murni sekitar 25%).
const AKAR = path.resolve(__dirname, '../../content');
const BATAS = 0.3;

type Soal = { options: string[]; answer: number };

function quizKelas(kelas: string): Soal[] {
  const folder = path.join(AKAR, kelas);
  return fs
    .readdirSync(folder, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(folder, e.name, 'quiz.json')))
    .flatMap((e) => JSON.parse(fs.readFileSync(path.join(folder, e.name, 'quiz.json'), 'utf-8')) as Soal[]);
}

function benarTerpanjang(s: Soal): boolean {
  const panjang = s.options.map((o) => o.length);
  const maks = Math.max(...panjang);
  return panjang[s.answer] === maks && panjang.filter((p) => p === maks).length === 1;
}

const kelasDenganQuiz = fs
  .readdirSync(AKAR, { withFileTypes: true })
  .filter((e) => e.isDirectory() && quizKelas(e.name).length > 0)
  .map((e) => e.name);

describe('Pola jawaban terpanjang di quiz', () => {
  it.each(kelasDenganQuiz)('kelas %s: jawaban benar tidak selalu pilihan terpanjang', (kelas) => {
    const soal = quizKelas(kelas);
    const persen = soal.filter(benarTerpanjang).length / soal.length;
    expect(persen).toBeLessThanOrEqual(BATAS);
  });
});
