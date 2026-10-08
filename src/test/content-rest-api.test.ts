import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';

const ROOT = path.resolve(__dirname, '../..');
const DIR = path.join(ROOT, 'content/rest-api');

type Soal = { question: string; options: string[]; answer: number; code?: string };

describe('Kelas RESTful API', () => {
  if (!fs.existsSync(DIR)) {
    it('belum ada konten', () => expect(true).toBe(true));
    return;
  }

  const modules = JSON.parse(fs.readFileSync(path.join(DIR, 'modules.json'), 'utf8')) as {
    id: string; courseId: string; lessonCount: number; status: string; order: number; requires: string[];
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

  it('semua modul memiliki requires yang benar sesuai kurikulum', () => {
    // Kurikulum rantai: api-dasar -> api-rest -> api-client -> api-desain -> api-dokumentasi -> api-keamanan -> api-proyek
    const reqMap = {
      'api-dasar': [],
      'api-rest': ['api-dasar'],
      'api-client': ['api-rest'],
      'api-desain': ['api-client'],
      'api-dokumentasi': ['api-desain'],
      'api-keamanan': ['api-dokumentasi'],
      'api-proyek': ['api-keamanan']
    };
    for (const m of modules) {
      expect(m.requires).toEqual(reqMap[m.id]);
    }
  });

  it('urutan modul tidak bentrok dengan kelas lain', () => {
    const lain = ['java', 'javascript', 'git', 'english', 'mysql', 'linux']
      .map((k) => path.join(ROOT, `content/${k}/modules.json`))
      .filter((p) => fs.existsSync(p))
      .flatMap((p) => (JSON.parse(fs.readFileSync(p, 'utf8')) as { order: number }[]).map((m) => m.order));
    expect(modules.filter((m) => lain.includes(m.order)).map((m) => m.id)).toEqual([]);
  });

  it('setiap folder punya quiz tepat 20 soal', () => {
    for (const f of folders) {
      const q = JSON.parse(fs.readFileSync(path.join(DIR, f, 'quiz.json'), 'utf8')) as Soal[];
      expect(q.length, f).toBe(20);
    }
  });

  for (const { folder, data } of lessons) {
    describe(`${folder}/${data.id}`, () => {
      it('tanpa tombol jalankan (runnable false, tanpa runnable/code_challenge)', () => {
        expect(data.runnable).toBe(false);
        expect(data.cards.filter((c: { type: string }) => c.type === 'runnable' || c.type === 'code_challenge')).toEqual([]);
      });

      it('soal punya 4 opsi unik dan kunci yang valid', () => {
        const soal: Soal[] = data.cards.flatMap((c: any) =>
          c.type === 'understanding_check' ? c.questions : c.type === 'predict_output' || c.type === 'multiple_choice' ? [c] : []
        );
        for (const q of soal) {
          expect(new Set(q.options).size, q.question).toBe(4);
          expect(q.answer).toBeGreaterThanOrEqual(0);
          expect(q.answer).toBeLessThan(4);
        }
      });

      it('isian: jumlah ___ sama dengan jawaban, diawali petunjuk #', () => {
        for (const c of data.cards.filter((x: { type: string }) => x.type === 'fill_blank')) {
          expect((c.code.match(/___/g) || []).length).toBe(c.answers.length);
          expect(c.code.trimStart().startsWith('#')).toBe(true);
        }
      });

      it('8 kartu dengan urutan tetap', () => {
        expect(data.cards.map((c: { type: string }) => c.type)).toEqual([
          'theory', 'theory', 'theory', 'theory', 'understanding_check', 'predict_output', 'fill_blank', 'summary',
        ]);
      });
    });
  }
});
