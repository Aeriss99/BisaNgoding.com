import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Lembar, cekLangkah, isGalat, periksaRumus, rentangAlamat, tampilkan } from '../lib/excel';
import type { Lesson, Module, PraktikExcelCard, QuizQuestion } from '../types/schema';

// Kelas Excel: struktur materi, dan setiap jawaban (praktik, tebak hasil, quiz) dihitung ulang dengan mesin rumus.
const AKAR = path.resolve(__dirname, '../../content/excel');
const modul = JSON.parse(fs.readFileSync(path.join(AKAR, 'modules.json'), 'utf-8')) as Module[];
const folder = fs.readdirSync(AKAR).filter((n) => n.startsWith('modul-')).sort();

/** Materi yang isinya fitur menu (bukan rumus), jadi tidak punya kartu praktik_excel. */
const TANPA_PRAKTIK = new Set(['excel-format-04', 'excel-format-06', 'excel-data-05', 'excel-data-07', 'excel-tes-kerja-06']);

function bacaMateri(f: string): Lesson[] {
  return fs
    .readdirSync(path.join(AKAR, f))
    .filter((n) => /^lesson-\d+\.json$/.test(n))
    .sort()
    .map((n) => JSON.parse(fs.readFileSync(path.join(AKAR, f, n), 'utf-8')) as Lesson);
}

const semua = folder.map((f) => ({ f, materi: bacaMateri(f) }));
const akhir = modul.find((m) => m.syaratAkhir);

/** "A1: 10\nB1: =A1*2" -> lembar. Soal yang berbunyi "tampil di X" dicek dengan mesin. */
function hasilKode(code: string, sel: string): string {
  const isi: Record<string, string | number> = {};
  for (const baris of code.split('\n')) {
    const m = /^([A-Z]{1,3}\d+): (.*)$/.exec(baris);
    if (!m) throw new Error(`baris kode bukan format sel: ${baris}`);
    isi[m[1]] = /^-?\d+$/.test(m[2]) ? Number(m[2]) : m[2];
  }
  return tampilkan(new Lembar(isi).nilai(sel));
}

function cekSoalKode(s: { question?: string; code?: string; options: string[]; answer: number }, asal: string) {
  const m = /tampil di ([A-Z]{1,3}\d+)/.exec(s.question ?? '');
  if (!m || !s.code) return 0;
  const h = hasilKode(s.code, m[1]);
  expect(s.options[s.answer], `${asal}: ${s.question}`).toBe(h);
  expect(s.options.filter((o) => o === h), `${asal}: pilihan lain sama dengan jawaban`).toHaveLength(1);
  return 1;
}

/** Pilihan yang hanya beda jumlah spasi tidak bisa dibedakan di layar. */
function cekPilihanBeda(s: { options: string[] }, asal: string) {
  expect(new Set(s.options.map((o) => o.replace(/\s+/g, ' ').trim())).size, `${asal}: pilihan hanya beda spasi`).toBe(s.options.length);
}

describe('Kelas Excel: modul', () => {
  it('9 modul berurutan, order 170-178, requires berantai, modul terakhir Proyek Akhir', () => {
    expect(modul.map((m) => m.order)).toEqual([170, 171, 172, 173, 174, 175, 176, 177, 178]);
    modul.forEach((m, i) => {
      expect(m.courseId).toBe('excel');
      if (i > 0) expect(m.requires).toBe(modul[i - 1].id);
    });
    expect(akhir?.id).toBe('excel-akhir');
    expect(akhir?.syaratAkhir).toEqual({ rataQuizMinimal: 80, namaLulus: 'Lulus Proyek Excel' });
  });

  it('lessonCount sama dengan jumlah file, dan setiap modul selain Proyek Akhir punya quiz 20 soal', () => {
    semua.forEach(({ f, materi }) => {
      const id = materi[0].moduleId;
      const m = modul.find((x) => x.id === id)!;
      expect(materi.length, f).toBe(m.lessonCount);
      materi.forEach((l, i) => expect(l.id).toBe(`${id}-${String(i + 1).padStart(2, '0')}`));
      const adaQuiz = fs.existsSync(path.join(AKAR, f, 'quiz.json'));
      expect(adaQuiz, f).toBe(id !== 'excel-akhir');
    });
  });
});

describe('Kelas Excel: susunan kartu', () => {
  for (const { materi } of semua) {
    for (const l of materi) {
      it(`${l.id}: susunan kartu`, () => {
        const jenis = l.cards.map((c) => c.type);
        if (l.moduleId === 'excel-akhir') {
          expect(jenis).toEqual(['theory', 'praktik_excel', 'summary']);
          return;
        }
        const teori = l.cards.filter((c) => c.type === 'theory') as { content: string }[];
        expect(teori.length).toBeGreaterThanOrEqual(3);
        expect(jenis.slice(0, teori.length).every((j) => j === 'theory')).toBe(true);
        teori.forEach((t) => expect(t.content.length).toBeGreaterThan(400));
        expect(teori.some((t) => t.content.includes('### Contoh'))).toBe(true);
        expect(teori.some((t) => t.content.includes('### Kesalahan yang sering terjadi'))).toBe(true);
        const sisa = jenis.slice(teori.length);
        const harap = TANPA_PRAKTIK.has(l.id)
          ? ['understanding_check', 'predict_output', 'fill_blank', 'summary']
          : ['praktik_excel', 'understanding_check', 'predict_output', 'fill_blank', 'summary'];
        expect(sisa).toEqual(harap);
      });
    }
  }
});

describe('Kelas Excel: praktik di lembar tiruan', () => {
  const praktik = semua.flatMap(({ materi }) =>
    materi.flatMap((l) => l.cards.filter((c): c is PraktikExcelCard => c.type === 'praktik_excel').map((c) => ({ l, c })))
  );

  it('ada praktik di hampir setiap materi', () => {
    expect(praktik.length).toBe(semua.reduce((n, x) => n + x.materi.length, 0) - TANPA_PRAKTIK.size);
  });

  for (const { l, c } of praktik) {
    it(`${l.id}: semua jawaban diterima mesin dan tidak ada nama fungsi yang salah`, () => {
      const tugas = c.langkah.filter((x) => !x.otomatis);
      expect(tugas.length).toBeGreaterThanOrEqual(2);
      if (l.moduleId !== 'excel-akhir') {
        expect(c.langkah[0].otomatis).toBe(true);
        expect(c.langkah.slice(1).some((x) => x.otomatis)).toBe(false);
      } else {
        expect(c.langkah.every((x) => x.tantangan)).toBe(true);
      }
      let lembar = new Lembar(c.sel);
      for (const langkah of c.langkah) {
        if (langkah.jawaban.startsWith('=')) expect(periksaRumus(langkah.jawaban), langkah.jawaban).toBeNull();
        const h = cekLangkah(lembar, langkah, langkah.jawaban);
        expect(h.benar, `${langkah.sel}: ${langkah.jawaban} -> ${h.pesan}`).toBe(true);
        lembar = h.lembar!;
        for (const a of rentangAlamat(langkah.sel, langkah.sampai)) {
          const v = lembar.nilai(a);
          expect(isGalat(v) && v.galat === '#NAME?', `${a}: #NAME?`).toBe(false);
        }
        for (const s of langkah.salah ?? []) expect(() => new RegExp(s.pola, 'i')).not.toThrow();
        for (const w of langkah.wajib ?? []) expect(new RegExp(w.pola, 'i').test(langkah.jawaban), `${langkah.sel}: wajib ${w.pola}`).toBe(true);
      }
    });
  }
});

describe('Kelas Excel: soal dengan isi sel dicek dengan mesin', () => {
  it('tebak hasil, cek pemahaman, dan quiz yang berbunyi "tampil di X" kuncinya benar', () => {
    let dicek = 0;
    for (const { f, materi } of semua) {
      for (const l of materi) {
        for (const c of l.cards) {
          if (c.type === 'predict_output') {
            expect(c.question, l.id).toMatch(/tampil di [A-Z]+\d+/);
            cekPilihanBeda(c, l.id);
            dicek += cekSoalKode(c, l.id);
          }
          if (c.type === 'understanding_check') {
            expect(c.questions).toHaveLength(3);
            expect(new Set(c.questions.map((q) => q.answer)).size, l.id).toBeGreaterThan(1);
            for (const q of c.questions) {
              cekPilihanBeda(q, l.id);
              dicek += cekSoalKode(q, l.id);
            }
          }
          if (c.type === 'fill_blank') {
            expect((c.code.match(/___/g) ?? []).length, l.id).toBe(c.answers.length);
            expect(c.question?.trim(), l.id).toBeTruthy();
          }
        }
      }
      const q = path.join(AKAR, f, 'quiz.json');
      if (fs.existsSync(q)) {
        const soal = JSON.parse(fs.readFileSync(q, 'utf-8')) as QuizQuestion[];
        expect(soal).toHaveLength(20);
        expect(new Set(soal.map((s) => s.question + (s.code ?? ''))).size).toBe(20);
        for (const s of soal) {
          expect(new Set(s.options).size, s.id).toBe(4);
          cekPilihanBeda(s, s.id);
          dicek += cekSoalKode(s, s.id);
        }
      }
    }
    expect(dicek).toBeGreaterThan(150);
  });
});
