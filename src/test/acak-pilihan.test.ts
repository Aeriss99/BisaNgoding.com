import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { acak, acakOpsi, acakPilihanPelajaran } from '../lib/quizLogic';
import { getLesson } from '../lib/content';

type Soal = { options: string[]; answer: number };
const ROOT = path.resolve(__dirname, '../..');

function semuaPelajaran(): { id: string; cards: any[] }[] {
  const hasil: { id: string; cards: any[] }[] = [];
  const content = path.join(ROOT, 'content');
  for (const kelas of fs.readdirSync(content)) {
    const dk = path.join(content, kelas);
    if (!fs.statSync(dk).isDirectory()) continue;
    for (const folder of fs.readdirSync(dk)) {
      const d = path.join(dk, folder);
      if (!fs.statSync(d).isDirectory()) continue;
      for (const f of fs.readdirSync(d).filter((x) => x.startsWith('lesson-') && x.endsWith('.json'))) {
        hasil.push(JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')));
      }
    }
  }
  return hasil;
}

function soalDari(cards: any[]): Soal[] {
  return cards.flatMap((c) =>
    c.type === 'multiple_choice' || c.type === 'predict_output' ? [c] : c.type === 'understanding_check' ? c.questions : []
  );
}

function rngBerbenih(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

describe('Pengacakan pilihan jawaban', () => {
  it('acak() adil: tiap posisi mendapat peluang yang sama', () => {
    const hitung = [0, 0, 0, 0];
    const rng = rngBerbenih(7);
    for (let i = 0; i < 8000; i++) hitung[acak([0, 1, 2, 3], rng).indexOf(0)]++;
    for (const n of hitung) {
      expect(n).toBeGreaterThan(1700);
      expect(n).toBeLessThan(2300);
    }
  });

  it('acakOpsi() tetap menunjuk ke teks jawaban yang sama', () => {
    const rng = rngBerbenih(3);
    for (let k = 0; k < 200; k++) {
      const q = { options: ['a', 'b', 'c', 'd'], answer: k % 4 };
      const h = acakOpsi(q, rng);
      expect(h.options[h.answer]).toBe(q.options[q.answer]);
      expect([...h.options].sort()).toEqual([...q.options].sort());
    }
  });

  it('semua soal di semua pelajaran: kunci tetap benar setelah diacak', () => {
    const rng = rngBerbenih(11);
    let n = 0;
    for (const l of semuaPelajaran()) {
      const asli = soalDari(l.cards);
      const baru = soalDari(acakPilihanPelajaran(l, rng).cards);
      expect(baru.length).toBe(asli.length);
      asli.forEach((q, i) => {
        expect(baru[i].options[baru[i].answer], `${l.id}`).toBe(q.options[q.answer]);
        n++;
      });
    }
    expect(n).toBeGreaterThan(0);
  });

  it('setelah diacak, kunci jawaban tersebar rata (tidak menumpuk di satu huruf)', () => {
    const rng = rngBerbenih(5);
    const hitung = [0, 0, 0, 0];
    let total = 0;
    for (const l of semuaPelajaran()) {
      for (const q of soalDari(acakPilihanPelajaran(l, rng).cards)) {
        if (q.options.length !== 4) continue;
        hitung[q.answer]++;
        total++;
      }
    }
    for (const n of hitung) {
      expect(n / total).toBeGreaterThan(0.2);
      expect(n / total).toBeLessThan(0.3);
    }
  });

  it('pelajaran yang dimuat aplikasi sudah memakai versi teracak dengan kunci yang benar', () => {
    for (const l of semuaPelajaran().slice(0, 50)) {
      const dimuat = getLesson(l.id);
      expect(dimuat).toBeDefined();
      const asli = soalDari(l.cards);
      soalDari(dimuat!.cards).forEach((q, i) => {
        expect(q.options[q.answer]).toBe(asli[i].options[asli[i].answer]);
      });
    }
  });
});
