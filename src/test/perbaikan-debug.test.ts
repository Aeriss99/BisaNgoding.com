import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { rapikanKetikan } from '../lib/ketikan';

const baca = (f: string) => fs.readFileSync(f, 'utf8');
const ROOT = path.resolve(__dirname, '../..');

describe('Ketikan dari keyboard HP dirapikan', () => {
  it('em dash / en dash jadi --, kutip miring jadi lurus', () => {
    expect(rapikanKetikan('\u2014oneline')).toBe('--oneline');
    expect(rapikanKetikan('\u2013version')).toBe('--version');
    expect(rapikanKetikan('git commit -m \u201CHalo\u201D')).toBe('git commit -m "Halo"');
    expect(rapikanKetikan('I\u2019m')).toBe("I'm");
    expect(rapikanKetikan('--oneline -2')).toBe('--oneline -2');
  });
  it('dipakai di kartu isian dan kedua runner', () => {
    expect(baca('src/components/cards/QuizCards.tsx')).toContain('rapikanKetikan(e.target.value)');
    expect(baca('src/lib/javaRunner.ts')).toContain('code = rapikanKetikan(code)');
    expect(baca('src/lib/jsRunner.ts')).toContain('code = rapikanKetikan(code)');
  });
});

describe('Kunci modul tidak bisa dilewati lewat alamat langsung', () => {
  it('Lesson: pengecekan kunci sebelum pemutar latihan', () => {
    const s = baca('src/pages/Lesson.tsx');
    const kunci = s.indexOf('!checkModuleUnlocked(mod, progress)');
    expect(kunci).toBeGreaterThan(0);
    expect(s.indexOf("lesson.mode === 'latihan'")).toBeGreaterThan(kunci);
  });
  it('Quiz: ada penjaga kunci sebelum soal dimuat', () => {
    const s = baca('src/pages/Quiz.tsx');
    const jaga = s.indexOf('!checkModuleUnlocked(mod, progress)');
    expect(jaga).toBeGreaterThan(0);
    expect(s.indexOf('Memuat quiz...')).toBeGreaterThan(jaga);
  });
  it('ErrorBoundary: tautan beranda memakai BASE_URL', () => {
    const s = baca('src/components/ErrorBoundary.tsx');
    expect(s).not.toContain('href="/"');
    expect(s).toContain('import.meta.env.BASE_URL');
  });
});

describe('Soal membawa konteksnya sendiri', () => {
  const lessons: any[] = [];
  for (const kelas of fs.readdirSync(path.join(ROOT, 'content'))) {
    const dk = path.join(ROOT, 'content', kelas);
    if (!fs.statSync(dk).isDirectory()) continue;
    for (const m of fs.readdirSync(dk)) {
      const d = path.join(dk, m);
      if (!fs.statSync(d).isDirectory()) continue;
      for (const f of fs.readdirSync(d).filter((x) => x.startsWith('lesson-'))) lessons.push(JSON.parse(baca(path.join(d, f))));
    }
  }
  const soal = lessons.flatMap((l) => l.cards.flatMap((c: any, i: number) =>
    c.type === 'understanding_check' ? c.questions.map((q: any) => ({ id: l.id + '#' + i, q })) :
    c.type === 'predict_output' || c.type === 'multiple_choice' ? [{ id: l.id + '#' + i, q: c }] : []));

  it('soal "kode/perintah ini" selalu menampilkan kodenya', () => {
    const bolong = soal.filter(({ q }) => /\b(kode|perintah|program) ini\b/i.test(q.question) && !q.code && !q.question.includes('\n'));
    expect(bolong.map((x) => x.id)).toEqual([]);
  });

  it('soal git log di Git Dasar menyebut riwayat commit-nya', () => {
    const gitLog = soal.filter(({ id, q }) => id.startsWith('git-dasar-06') && /git log --oneline/.test(q.code || ''));
    expect(gitLog.length).toBeGreaterThan(0);
    for (const { q } of gitLog) expect(q.code).toMatch(/Riwayat/);
  });
});
