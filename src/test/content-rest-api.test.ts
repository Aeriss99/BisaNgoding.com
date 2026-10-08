import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';

const ROOT = path.resolve(__dirname, '../..');
const DIR = path.join(ROOT, 'content/rest-api');

type Soal = { question: string; options: string[]; answer: number; code?: string; explanation?: string };

describe('Kelas RESTful API', () => {
  if (!fs.existsSync(DIR)) {
    it('belum ada konten', () => expect(true).toBe(true));
    return;
  }

  const modules = JSON.parse(fs.readFileSync(path.join(DIR, 'modules.json'), 'utf8')) as {
    id: string; courseId: string; lessonCount: number; status: string; order: number; requires: string;
  }[];
  const folders = fs.readdirSync(DIR).filter((f) => fs.statSync(path.join(DIR, f)).isDirectory());
  const lessons = folders.flatMap((f) =>
    fs.readdirSync(path.join(DIR, f))
      .filter((x) => x.startsWith('lesson-') && x.endsWith('.json'))
      .map((x) => ({ folder: f, data: JSON.parse(fs.readFileSync(path.join(DIR, f, x), 'utf8')) }))
  );

  it('kelas rest-api terdaftar di courses.json', () => {
    const courses = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/courses.json'), 'utf8'));
    expect(courses.some((c: { id: string }) => c.id === 'rest-api' && (c as { status?: string }).status === 'ready')).toBe(true);
  });

  it('modul yang ada punya file lesson sesuai lessonCount', () => {
    for (const m of modules) {
      const n = lessons.filter((l) => l.data.moduleId === m.id).length;
      expect(n, m.id).toBe(m.lessonCount);
    }
  });

  it('requires berupa string', () => {
    for (const m of modules) {
      if (m.requires !== undefined) {
        expect(typeof m.requires, m.id).toBe('string');
      }
    }
  });

  it('setiap folder punya quiz tepat 20 soal', () => {
    for (const f of folders) {
      const q = JSON.parse(fs.readFileSync(path.join(DIR, f, 'quiz.json'), 'utf8')) as Soal[];
      expect(q.length, f).toBe(20);
    }
  });

  const terlarang = ["Lesson ", "Q1", "Exp", "Intro", "Core theory", "P1", "Quiz Q", "TODO", "lorem", "placeholder"];
  function cekTeks(teks: string, minLen: number) {
    if (!teks) return;
    expect(teks.length).toBeGreaterThanOrEqual(minLen);
    for (const t of terlarang) {
      expect(teks.includes(t), `Ditemukan kata terlarang: ${t}`).toBe(false);
    }
  }

  for (const { folder, data } of lessons) {
    describe(`${folder}/${data.id}`, () => {
      it('tanpa tombol jalankan (runnable false)', () => {
        expect(data.runnable).toBe(false);
        expect(data.cards.filter((c: { type: string }) => c.type === 'runnable' || c.type === 'code_challenge')).toEqual([]);
      });

      it('8 kartu urutan tetap, panjang memadai, no placeholder', () => {
        expect(data.cards.map((c: { type: string }) => c.type)).toEqual([
          'theory', 'theory', 'theory', 'theory', 'understanding_check', 'predict_output', 'fill_blank', 'summary',
        ]);
        
        for (let j=0; j<4; j++) {
           cekTeks(data.cards[j].content, 400);
        }
        
        const q = data.cards[4];
        expect(q.questions.length).toBe(4);
        for (const qs of q.questions) {
          cekTeks(qs.question, 25);
          cekTeks(qs.explanation, 30);
          for (const o of qs.options) {
             expect(o.length).toBeGreaterThanOrEqual(2);
          }
        }

        const sum = data.cards[7];
        expect(sum.points.length >= 3 && sum.points.length <= 5).toBe(true);
        for (const p of sum.points) cekTeks(p, 25);
      });
      
      it('isian diawali # dan jumlah garis sama dengan jawaban', () => {
         const fb = data.cards[6];
         const code = fb.code || '';
         expect(code.trimStart().startsWith('# ')).toBe(true);
         const lines = (code.match(/___/g) || []).length;
         expect(lines).toBe(fb.answers.length);
      });
    });
  }
});
