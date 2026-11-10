import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { Lesson, PraktikJavaCard } from '../types/schema';
import { cekWajib, keluaranSama, kodeAwalLangkah, rapikanKeluaran } from '../lib/praktikJava';
import { siapkanNodeTiruan, type HasilNode } from './alat/nodeTiruan';

/**
 * Kelas Node.js (15 modul). Modul editor dijalankan dengan runtime Node tiruan yang sama dengan di browser
 * (src/lib/nodeRuntime: fs di memori, http + fetch localhost, express, zod, bcryptjs, jsonwebtoken).
 * Kuncinya dibuat dari Node.js 26 asli; di sini dipastikan runtime tiruan tetap memberi keluaran yang sama.
 * Modul terminal memakai keluaran rekaman asli (Node.js 26, npm 11, PostgreSQL, Prisma 7).
 */
const akar = path.resolve(__dirname, '../../content/nodejs');
const baca = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8'));
const MODUL = [
  { id: 'node-dasar', folder: 'modul-01-dasar', praktik: 'Kasir CLI' },
  { id: 'node-modul', folder: 'modul-02-modul', praktik: 'Modul Toko' },
  { id: 'node-npm', folder: 'modul-03-npm', praktik: 'Proyek npm', terminal: true },
  { id: 'node-fs', folder: 'modul-04-fs', praktik: 'Arsip Node' },
  { id: 'node-async', folder: 'modul-05-async', praktik: 'Antrean Pesanan' },
  { id: 'node-stream', folder: 'modul-06-stream', praktik: 'Log Toko' },
  { id: 'node-http', folder: 'modul-07-http', praktik: 'Server Toko' },
  { id: 'node-express', folder: 'modul-08-express', praktik: 'Express Toko' },
  { id: 'node-middleware', folder: 'modul-09-middleware', praktik: 'Pengaman API' },
  { id: 'node-rest', folder: 'modul-10-rest', praktik: 'API Produk' },
  { id: 'node-auth', folder: 'modul-11-auth', praktik: 'Login API' },
  { id: 'node-prisma', folder: 'modul-12-prisma', praktik: 'Database Toko', terminal: true },
  { id: 'node-testing', folder: 'modul-13-testing', praktik: 'Uji API', terminal: true },
  { id: 'node-produksi', folder: 'modul-14-produksi', praktik: 'Rilis API', terminal: true },
  { id: 'node-todolist', folder: 'modul-15-todolist', praktik: 'Todolist API' },
];
const SUSUNAN_EDITOR = ['theory', 'theory', 'runnable', 'theory', 'theory', 'praktik_java', 'understanding_check', 'multiple_choice', 'code_challenge', 'summary'];
const SUSUNAN_TERMINAL = ['theory', 'theory', 'theory', 'theory', 'theory', 'praktik_terminal', 'understanding_check', 'multiple_choice', 'fill_blank', 'summary'];
const TANDA = /`|\*\*/;
const baris = (s: string) => rapikanKeluaran(s).split('\n');

const semuaModul = MODUL.map((m) => {
  const dir = path.join(akar, m.folder);
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.startsWith('lesson-')).sort() : [];
  return { ...m, dir, lessons: files.map((f) => baca(path.join(dir, f))) as Lesson[], quiz: fs.existsSync(path.join(dir, 'quiz.json')) ? (baca(path.join(dir, 'quiz.json')) as any[]) : [] };
});

/** Semua kode yang perlu dijalankan, dijalankan sekali dalam satu proses. */
const hasil = new Map<string, HasilNode>();
beforeAll(async () => {
  const kode = new Set<string>();
  for (const m of semuaModul) {
    for (const l of m.lessons) {
      for (const c of l.cards as any[]) {
        if (c.type === 'runnable') kode.add(c.code);
        if (c.type === 'code_challenge') kode.add(c.solution);
        if (c.type === 'understanding_check') c.questions.filter((q: any) => q.code).forEach((q: any) => kode.add(q.code));
        if (c.type === 'praktik_java') c.langkah.forEach((x: any, i: number) => {
          kode.add(x.jawaban);
          if (!x.otomatis) kode.add(kodeAwalLangkah(c, i));
        });
      }
    }
    m.quiz.filter((q) => q.code).forEach((q) => kode.add(q.code));
  }
  const daftar = [...kode];
  const jalan = await siapkanNodeTiruan();
  jalan(daftar).forEach((h, i) => hasil.set(daftar[i], h));
}, 600_000);
const h = (kode: string) => {
  const x = hasil.get(kode);
  if (!x) throw new Error('kode belum dijalankan:\n' + kode);
  return x;
};

describe('Kelas Node.js', () => {
  const modules: any[] = baca(path.join(akar, 'modules.json'));

  it('kelas siap dan 15 modul terdaftar berurutan', () => {
    const kelas = baca(path.resolve(__dirname, '../../content/courses.json')).find((c: any) => c.id === 'nodejs');
    expect(kelas.status).toBe('ready');
    expect(kelas.language).toBe('nodejs');
    expect(modules.map((m) => m.id)).toEqual(MODUL.map((m) => m.id));
    modules.forEach((m, i) => {
      expect(m).toMatchObject({ courseId: 'nodejs', status: 'ready', order: 200 + i });
      if (i) expect(m.requires).toBe(modules[i - 1].id);
      expect(m.lessonCount).toBe(semuaModul[i].lessons.length);
    });
  });

  for (const m of semuaModul) {
    describe(m.id, () => {
      it('materi berurutan, quiz 20 soal, jawaban terpanjang tidak jadi petunjuk', () => {
        expect(m.lessons.length).toBeGreaterThanOrEqual(6);
        m.lessons.forEach((l, i) => {
          expect(l.moduleId).toBe(m.id);
          expect(l.id).toBe(`${m.id}-${String(i + 1).padStart(2, '0')}`);
          expect(l.order).toBe(i + 1);
        });
        expect(m.quiz.length).toBe(20);
        m.quiz.forEach((q, i) => expect(q.id).toBe(`${m.id}-quiz-${String(i + 1).padStart(2, '0')}`));
        expect(new Set(m.quiz.map((q) => q.answer)).size).toBeGreaterThan(2);
        const terpanjang = m.quiz.filter((q) => {
          const p = q.options.map((o: string) => o.length);
          const max = Math.max(...p);
          return p.filter((x: number) => x === max).length === 1 && p[q.answer] === max;
        });
        expect(terpanjang.length).toBeLessThanOrEqual(6);
        const teori = m.lessons.flatMap((l) => l.cards.filter((c) => c.type === 'theory').map((c: any) => c.content)).join('\n');
        expect(teori).toMatch(/\b(ibarat|bayangkan|analogi)\b/i);
      });

      for (const l of m.lessons) {
        describe(`${l.id} ${l.title}`, () => {
          it('susunan kartu dan kartu wajib', () => {
            expect(l.cards.map((c) => c.type)).toEqual(m.terminal ? SUSUNAN_TERMINAL : SUSUNAN_EDITOR);
            if (m.terminal) expect((l as any).runnable).toBe(false);
            const teori = l.cards.filter((c) => c.type === 'theory').map((c: any) => c.content as string);
            expect(teori.some((t) => t.includes('### Contoh'))).toBe(true);
            const iKes = teori.findIndex((t) => t.startsWith('### Kesalahan yang sering terjadi'));
            expect(iKes).toBeGreaterThan(-1);
            expect(teori[iKes + 1]).toMatch(/^### Di dunia kerja\n/);
          });

          it('soal pilihan tanpa tanda Markdown, cek pemahaman tersebar dengan remedial', () => {
            const soal: any[] = [];
            for (const c of l.cards as any[]) {
              if (c.type === 'understanding_check') soal.push(...c.questions);
              if (c.type === 'multiple_choice') soal.push(c);
              if (c.type === 'runnable') soal.push({ ...c.predict, explanation: c.explanation });
            }
            for (const q of soal) {
              expect(new Set(q.options).size).toBe(q.options.length);
              for (const t of [q.question, q.explanation, ...q.options]) expect(t, t).not.toMatch(TANDA);
            }
            const cek = l.cards.find((c) => c.type === 'understanding_check') as any;
            expect(cek.questions.length).toBe(3);
            expect(new Set(cek.questions.map((q: any) => q.answer)).size).toBeGreaterThan(1);
            for (const q of cek.questions) expect(q.remedial.length).toBeGreaterThan(40);
            const cc = l.cards.find((c) => c.type === 'code_challenge') as any;
            if (cc) expect(cc.prompt).not.toMatch(TANDA);
          });

          if (m.terminal) {
            it('praktik terminal: contoh lalu minimal 2 tugas, keluaran asli tanpa jejak mesin pembuat', () => {
              const card = l.cards.find((c) => c.type === 'praktik_terminal') as any;
              expect(card.judul).toMatch(new RegExp(`^${m.praktik} ${l.order}: `));
              expect(card.folder).toBe('~/toko-api');
              expect(card.langkah[0].otomatis).toBe(true);
              expect(card.langkah.slice(1).some((x: any) => x.otomatis)).toBe(false);
              expect(card.langkah.filter((x: any) => !x.otomatis).length).toBeGreaterThanOrEqual(2);
              for (const x of card.langkah) {
                expect(x.terima.length).toBeGreaterThan(0);
                if (!x.otomatis) expect(x.petunjuk.length).toBeGreaterThan(0);
              }
              expect(JSON.stringify(card)).not.toMatch(/\/tmp\/|scratchpad|claude|\/var\/tmp/);
            });
          } else {
            it('praktik bersama Lingga: aturan langkah dan keluaran runtime', () => {
              const card = l.cards.find((c) => c.type === 'praktik_java') as PraktikJavaCard;
              expect(card.bahasa).toBe('nodejs');
              expect(card.judul).toMatch(new RegExp(`^${m.praktik} ${l.order}: `));
              expect(card.langkah[0].otomatis).toBe(true);
              expect(card.langkah.slice(1).some((x) => x.otomatis)).toBe(false);
              expect(card.langkah.filter((x) => !x.otomatis).length).toBeGreaterThanOrEqual(2);
              card.langkah.forEach((x, i) => {
                expect(cekWajib(x.jawaban, x.wajib)).toBeNull();
                const r = h(x.jawaban);
                expect(r.exitCode, `${r.stderr}\n${x.jawaban}`).toBe(0);
                expect(keluaranSama(r.stdout, x.keluaran), `${r.stdout}\n!=\n${x.keluaran}`).toBe(true);
                if (x.otomatis) return;
                expect(x.petunjuk.length).toBeGreaterThan(0);
                const awal = kodeAwalLangkah(card, i);
                expect(awal.trim()).not.toBe(x.jawaban.trim());
                const ra = h(awal);
                expect(ra.exitCode !== 0 || !keluaranSama(ra.stdout, x.keluaran), `langkah ${i + 1} sudah lulus tanpa diubah`).toBe(true);
                const berikut = card.langkah[i + 1];
                if (berikut) expect(keluaranSama(berikut.keluaran, x.keluaran)).toBe(false);
              });
            });

            it('runnable dan tantangan: keluaran cocok dengan kunci', () => {
              const rn = l.cards.find((c) => c.type === 'runnable') as any;
              const r = h(rn.code);
              expect(r.exitCode, r.stderr).toBe(0);
              expect(baris(r.stdout)).toContain(rn.predict.options[rn.predict.answer]);
              const cc = l.cards.find((c) => c.type === 'code_challenge') as any;
              const rc = h(cc.solution);
              expect(rc.exitCode, rc.stderr).toBe(0);
              expect(keluaranSama(rc.stdout, cc.tests[0].expectedOutput)).toBe(true);
            });
          }

          it('soal berkode: kunci sesuai hasil runtime', () => {
            const soal = (l.cards as any[]).flatMap((c) => (c.type === 'understanding_check' ? c.questions : [])).filter((q) => q.code);
            soal.forEach(cekSoal);
          });
        });
      }

      it('quiz berkode: kunci sesuai hasil runtime', () => {
        m.quiz.filter((q) => q.code).forEach(cekSoal);
      });
    });
  }
});

/** Soal "Apa output": kunci = seluruh keluaran, baris dipisah " / ". Kunci berawalan Error/Program berhenti: program harus gagal. */
function cekSoal(q: any) {
  const kunci: string = q.options[q.answer];
  const r = h(q.code);
  if (/^(Error|Program berhenti)/.test(kunci) && !/output/i.test(q.question)) {
    expect(r.exitCode, `${q.question}\n${q.code}`).not.toBe(0);
    return;
  }
  expect(r.exitCode, `${r.stderr}\n${q.code}`).toBe(0);
  if (/output/i.test(q.question)) expect(baris(r.stdout).join(' / '), q.code).toBe(kunci);
}
