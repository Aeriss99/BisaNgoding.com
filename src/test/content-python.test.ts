import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { PY_SETUP } from '../lib/pythonRunner';
import { nilaiLangkahPython, rapikanKeluaran } from '../lib/praktikPython';
import type { Lesson, Module, PraktikPythonCard, QuizQuestion } from '../types/schema';

// Kelas Python: struktur materi, dan setiap jawaban (praktik konsol, tantangan, tebak keluaran, quiz)
// dijalankan ulang dengan Python asli memakai PY_SETUP yang sama dengan di browser (Pyodide).
const AKAR = path.resolve(__dirname, '../../content/python');
const modul = JSON.parse(fs.readFileSync(path.join(AKAR, 'modules.json'), 'utf-8')) as Module[];
const folder = fs.readdirSync(AKAR).filter((n) => n.startsWith('modul-')).sort();
const AKHIR = 'python-proyek';

function bacaMateri(f: string): Lesson[] {
  return fs
    .readdirSync(path.join(AKAR, f))
    .filter((n) => /^lesson-\d+\.json$/.test(n))
    .sort()
    .map((n) => JSON.parse(fs.readFileSync(path.join(AKAR, f, n), 'utf-8')) as Lesson);
}
function bacaQuiz(f: string): QuizQuestion[] {
  const p = path.join(AKAR, f, 'quiz.json');
  return fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, 'utf-8')) as QuizQuestion[]) : [];
}

const semua = folder.map((f) => ({ f, materi: bacaMateri(f), quiz: bacaQuiz(f) }));

type Soal = { question?: string; code?: string; options: string[]; answer: number };
type Kartu = Lesson['cards'][number];

/** Kumpulkan semua pekerjaan untuk Python, jalankan sekali, lalu periksa di TS. */
interface Tugas {
  praktik: { persiapan: string; perintah: string[]; cek: (string | null)[] }[];
  program: { kode: string; masukan: string }[];
}

const DRIVER = `
import json, sys, os, tempfile
os.chdir(tempfile.mkdtemp())
G = {}
exec(SETUP, G)
t = json.load(sys.stdin)
out = {'praktik': [], 'program': []}
for p in t['praktik']:
    G['_bn_reset']('', '')
    if p['persiapan']:
        G['_bn_persiapan'](p['persiapan'], '')
    hasil = []
    for baris, cek in zip(p['perintah'], p['cek']):
        G['_bn_simpan']('', '')
        h = list(G['_bn_repl'](baris, ''))
        c = None
        if cek and not h[2]:
            c = G['_bn_cek'](cek, '')[0] == 'True'
        hasil.append(h + [c])
    out['praktik'].append(hasil)
for p in t['program']:
    out['program'].append(list(G['_bn_program'](p['kode'], p['masukan'])))
json.dump(out, sys.stdout)
`;

function jalankanPython(t: Tugas): { praktik: [string, string, string, boolean | null][][]; program: [string, string, string][] } {
  const skrip = `SETUP = ${JSON.stringify(PY_SETUP)}\n${DRIVER}`;
  const r = spawnSync('python3', ['-c', skrip], { input: JSON.stringify(t), encoding: 'utf-8', cwd: os.tmpdir(), maxBuffer: 64 * 1024 * 1024, timeout: 120000 });
  if (r.status !== 0) throw new Error(`python3 gagal: ${r.stderr || r.error}`);
  return JSON.parse(r.stdout);
}

const praktik = semua.flatMap(({ materi }) =>
  materi.flatMap((l) => l.cards.filter((c): c is PraktikPythonCard => c.type === 'praktik_python').map((c) => ({ l, c })))
);
const tantangan = semua.flatMap(({ materi }) =>
  materi.flatMap((l) =>
    l.cards
      .filter((c): c is Extract<Kartu, { type: 'code_challenge' }> => c.type === 'code_challenge')
      .map((c) => ({ l, c }))
  )
);
const soalKeluaran: { asal: string; s: Soal }[] = [];
const blokTeori: { asal: string; kode: string }[] = [];
for (const { materi, quiz } of semua) {
  for (const l of materi) {
    for (const c of l.cards) {
      if (c.type === 'predict_output') soalKeluaran.push({ asal: l.id, s: c as unknown as Soal });
      if (c.type === 'understanding_check') {
        for (const s of (c as unknown as { questions: Soal[] }).questions) {
          if (s.code && /keluaran/i.test(s.question ?? '')) soalKeluaran.push({ asal: l.id, s });
        }
      }
      if (c.type === 'theory') {
        for (const m of (c as { content: string }).content.matchAll(/```python run\n([\s\S]*?)```/g)) blokTeori.push({ asal: l.id, kode: m[1] });
      }
    }
  }
  for (const s of quiz) if (s.code && /keluaran/i.test(s.question)) soalKeluaran.push({ asal: s.id, s: s as Soal });
}

let hasil: ReturnType<typeof jalankanPython>;
const urutProgram: { jenis: string; i: number; j?: number }[] = [];

beforeAll(() => {
  const t: Tugas = { praktik: [], program: [] };
  for (const { c } of praktik) {
    t.praktik.push({ persiapan: c.persiapan ?? '', perintah: c.langkah.map((x) => x.perintah), cek: c.langkah.map((x) => x.cek ?? null) });
  }
  tantangan.forEach(({ c }, i) =>
    c.tests.forEach((u, j) => {
      t.program.push({ kode: c.solution!, masukan: u.input });
      urutProgram.push({ jenis: 'solusi', i, j });
      t.program.push({ kode: c.starterCode, masukan: u.input });
      urutProgram.push({ jenis: 'awal', i, j });
    })
  );
  soalKeluaran.forEach(({ s }, i) => {
    t.program.push({ kode: s.code!, masukan: '' });
    urutProgram.push({ jenis: 'soal', i });
  });
  blokTeori.forEach(({ kode }, i) => {
    t.program.push({ kode, masukan: '' });
    urutProgram.push({ jenis: 'teori', i });
  });
  hasil = jalankanPython(t);
}, 180000);

function hasilProgram(jenis: string, i: number, j?: number) {
  const k = urutProgram.findIndex((u) => u.jenis === jenis && u.i === i && u.j === j);
  return hasil.program[k];
}

describe('Kelas Python: modul', () => {
  it('8 modul berurutan, order 180-187, requires berantai, modul terakhir Proyek Akhir', () => {
    expect(modul.map((m) => m.order)).toEqual([180, 181, 182, 183, 184, 185, 186, 187]);
    modul.forEach((m, i) => {
      expect(m.courseId).toBe('python');
      if (i > 0) expect(m.requires).toBe(modul[i - 1].id);
    });
    const akhir = modul.find((m) => m.syaratAkhir);
    expect(akhir?.id).toBe(AKHIR);
    expect(akhir?.syaratAkhir).toEqual({ rataQuizMinimal: 80, namaLulus: 'Lulus Proyek Python' });
  });

  it('lessonCount sama dengan jumlah file, dan setiap modul selain Proyek Akhir punya quiz 20 soal', () => {
    semua.forEach(({ f, materi, quiz }) => {
      const id = materi[0].moduleId;
      const m = modul.find((x) => x.id === id)!;
      expect(materi.length, f).toBe(m.lessonCount);
      materi.forEach((l, i) => {
        expect(l.id).toBe(`${id}-${String(i + 1).padStart(2, '0')}`);
        expect(l.runnable).toBe(true);
      });
      expect(quiz.length, f).toBe(id === AKHIR ? 0 : 20);
    });
  });
});

describe('Kelas Python: susunan kartu', () => {
  for (const { materi } of semua) {
    for (const l of materi) {
      it(`${l.id}: susunan kartu`, () => {
        const jenis = l.cards.map((c) => c.type);
        if (l.moduleId === AKHIR) {
          expect(jenis).toEqual(['theory', 'code_challenge', 'summary']);
          expect((l.cards[0] as { content: string }).content).toContain('### Yang dinilai');
          return;
        }
        const teori = l.cards.filter((c) => c.type === 'theory') as { content: string }[];
        expect(teori.length).toBeGreaterThanOrEqual(3);
        expect(jenis.slice(0, teori.length).every((j) => j === 'theory')).toBe(true);
        expect(teori.some((t) => t.content.includes('### Contoh'))).toBe(true);
        expect(teori.some((t) => t.content.includes('### Kesalahan yang sering terjadi'))).toBe(true);
        const sisa = jenis.slice(teori.length);
        expect(['praktik_python', 'code_challenge']).toContain(sisa[0]);
        expect(sisa.slice(1)).toEqual(['understanding_check', 'predict_output', 'fill_blank', 'summary']);
      });
    }
  }
});

describe('Kelas Python: dijalankan dengan Python asli', () => {
  it('ada praktik konsol dan tantangan di setiap modul', () => {
    for (const { materi } of semua) {
      const ada = materi.some((l) => l.cards.some((c) => c.type === 'praktik_python' || c.type === 'code_challenge'));
      expect(ada, materi[0].moduleId).toBe(true);
    }
    expect(praktik.length).toBeGreaterThanOrEqual(20);
  });

  it('setiap langkah praktik konsol diterima dengan jawabannya sendiri', () => {
    praktik.forEach(({ l, c }, i) => {
      const tugas = c.langkah.filter((x) => !x.otomatis);
      expect(tugas.length, l.id).toBeGreaterThanOrEqual(2);
      expect(c.langkah[0].otomatis, l.id).toBe(true);
      c.langkah.forEach((langkah, j) => {
        const [keluaran, galat, jenisGalat, cek] = hasil.praktik[i][j];
        const n = nilaiLangkahPython(langkah, langkah.perintah, { keluaran, galat, jenisGalat }, cek);
        expect(n.benar, `${l.id} "${langkah.perintah}": ${n.pesan} ${galat}`).toBe(true);
        for (const s of langkah.salah ?? []) expect(() => new RegExp(s.pola, 'i')).not.toThrow();
        for (const w of langkah.wajib ?? []) expect(new RegExp(w.pola, 'i').test(langkah.perintah), `${l.id}: wajib ${w.pola}`).toBe(true);
      });
    });
  });

  it('solusi tantangan menghasilkan keluaran yang diharapkan, dan kode awal belum lulus', () => {
    tantangan.forEach(({ l, c }, i) => {
      expect(c.solution, l.id).toBeTruthy();
      let awalLulus = true;
      c.tests.forEach((u, j) => {
        const [out, galat] = hasilProgram('solusi', i, j);
        expect(galat, `${l.id} masukan ${JSON.stringify(u.input)}`).toBe('');
        expect(rapikanKeluaran(out), `${l.id} masukan ${JSON.stringify(u.input)}`).toBe(rapikanKeluaran(u.expectedOutput));
        const [outAwal, galatAwal] = hasilProgram('awal', i, j);
        if (galatAwal || rapikanKeluaran(outAwal) !== rapikanKeluaran(u.expectedOutput)) awalLulus = false;
      });
      expect(awalLulus, `${l.id}: kode awal langsung lulus`).toBe(false);
    });
  });

  it('soal "apa keluaran" kuncinya sama dengan hasil Python', () => {
    expect(soalKeluaran.length).toBeGreaterThan(150);
    soalKeluaran.forEach(({ asal, s }, i) => {
      const [out, galat, jenis] = hasilProgram('soal', i);
      const h = galat ? jenis : rapikanKeluaran(out);
      expect(s.options[s.answer], `${asal}: ${s.question}`).toBe(h);
      expect(s.options.filter((o) => o === h), `${asal}: pilihan lain sama dengan jawaban`).toHaveLength(1);
    });
  });

  it('setiap blok ```python run di teori jalan tanpa error', () => {
    expect(blokTeori.length).toBeGreaterThan(30);
    blokTeori.forEach(({ asal }, i) => {
      const [, galat] = hasilProgram('teori', i);
      expect(galat, asal).toBe('');
    });
  });
});

describe('Kelas Python: pilihan jawaban', () => {
  it('tidak ada pilihan kembar atau hanya beda spasi', () => {
    for (const { materi, quiz } of semua) {
      const soal: { asal: string; s: Soal }[] = quiz.map((s) => ({ asal: s.id, s: s as Soal }));
      for (const l of materi) {
        for (const c of l.cards) {
          if (c.type === 'predict_output') soal.push({ asal: l.id, s: c as unknown as Soal });
          if (c.type === 'understanding_check') for (const s of (c as unknown as { questions: Soal[] }).questions) soal.push({ asal: l.id, s });
        }
      }
      for (const { asal, s } of soal) {
        expect(new Set(s.options.map((o) => o.replace(/\s+/g, ' ').trim())).size, `${asal}: ${s.question}`).toBe(s.options.length);
        expect(s.answer).toBeGreaterThanOrEqual(0);
        expect(s.answer).toBeLessThan(s.options.length);
      }
    }
  });
});
