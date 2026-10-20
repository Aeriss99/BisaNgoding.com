import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';

// Kelas Spring Boot dan DevOps: kelas (K) = teori + latihan soal di sini, praktik di komputer sendiri.
// Tidak ada tombol jalankan. Contoh Spring dijalankan di Spring Boot 4.0.8, contoh Docker di Docker 29.
const ROOT = path.resolve(__dirname, '../..');

type Soal = { question: string; options: string[]; answer: number; code?: string; explanation?: string };

const KELAS = [
  { id: 'spring-boot', komentar: '//', modul: ['spring-dasar'] },
  { id: 'devops', komentar: '#', modul: ['devops-pengenalan', 'devops-docker', 'devops-compose', 'devops-cicd', 'devops-deploy', 'devops-kubernetes', 'devops-cloud', 'devops-monitoring', 'devops-terraform'] },
];

for (const kelas of KELAS) {
  const DIR = path.join(ROOT, 'content', kelas.id);

  describe(`Kelas ${kelas.id}`, () => {
    const modules = JSON.parse(fs.readFileSync(path.join(DIR, 'modules.json'), 'utf8')) as {
      id: string; courseId: string; lessonCount: number; status: string; order: number; requires?: string;
    }[];
    const folders = fs.readdirSync(DIR).filter((f) => fs.statSync(path.join(DIR, f)).isDirectory()).sort();
    const lessons = folders.flatMap((f) =>
      fs.readdirSync(path.join(DIR, f))
        .filter((x) => x.startsWith('lesson-') && x.endsWith('.json'))
        .sort()
        .map((x) => ({ folder: f, data: JSON.parse(fs.readFileSync(path.join(DIR, f, x), 'utf8')) }))
    );

    it('terdaftar di courses.json sebagai ready', () => {
      const courses = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/courses.json'), 'utf8')) as { id: string; status?: string; baru?: boolean }[];
      const c = courses.find((x) => x.id === kelas.id);
      expect(c?.status).toBe('ready');
      expect(c?.baru).toBeUndefined();
    });

    it('modul berurutan, milik kelas ini, prasyarat menunjuk modul sebelumnya, jumlah materi sesuai', () => {
      expect(modules.map((m) => m.id)).toEqual(kelas.modul);
      modules.forEach((m, i) => {
        expect(m.courseId).toBe(kelas.id);
        expect(m.status).toBe('ready');
        if (i > 0) expect(m.requires).toBe(modules[i - 1].id);
        expect(lessons.filter((l) => l.data.moduleId === m.id).length, m.id).toBe(m.lessonCount);
      });
    });

    it('urutan modul tidak bentrok dengan kelas lain', () => {
      const lain = fs.readdirSync(path.join(ROOT, 'content'))
        .filter((k) => k !== kelas.id && fs.existsSync(path.join(ROOT, `content/${k}/modules.json`)))
        .flatMap((k) => (JSON.parse(fs.readFileSync(path.join(ROOT, `content/${k}/modules.json`), 'utf8')) as { order: number }[]).map((m) => m.order));
      expect(modules.filter((m) => lain.includes(m.order)).map((m) => m.id)).toEqual([]);
    });

    it('setiap folder punya quiz 20 soal, id berurutan, 4 opsi unik, kunci tersebar, penjelasan ada', () => {
      for (const f of folders) {
        const q = JSON.parse(fs.readFileSync(path.join(DIR, f, 'quiz.json'), 'utf8')) as (Soal & { id: string })[];
        const mid = lessons.find((l) => l.folder === f)!.data.moduleId;
        expect(q.length, f).toBe(20);
        q.forEach((s, i) => {
          expect(s.id).toBe(`${mid}-quiz-${String(i + 1).padStart(2, '0')}`);
          expect(new Set(s.options).size, s.question).toBe(4);
          expect(s.answer >= 0 && s.answer < 4).toBe(true);
          expect((s.explanation ?? '').length).toBeGreaterThan(20);
        });
        for (let k = 0; k < 4; k++) {
          const n = q.filter((s) => s.answer === k).length;
          expect(n >= 4 && n <= 6, `${f}: kunci ${k} muncul ${n} kali`).toBe(true);
        }
        expect(new Set(q.map((s) => s.question)).size).toBe(20);
      }
    });

    for (const { folder, data } of lessons) {
      describe(`${folder}/${data.id}`, () => {
        it('tanpa tombol jalankan', () => {
          expect(data.runnable).toBe(false);
          expect(data.cards.filter((c: { type: string }) => c.type === 'runnable' || c.type === 'code_challenge')).toEqual([]);
        });

        it('8 kartu dengan urutan tetap, ringkasan 3-5 poin, teori cukup panjang', () => {
          expect(data.cards.map((c: { type: string }) => c.type)).toEqual([
            'theory', 'theory', 'theory', 'theory', 'understanding_check', 'predict_output', 'fill_blank', 'summary',
          ]);
          const n = data.cards[7].points.length;
          expect(n >= 3 && n <= 5).toBe(true);
          for (const t of data.cards.slice(0, 4)) expect(t.content.length).toBeGreaterThan(400);
          expect(data.cards[2].content).toContain('### Contoh');
          expect(data.cards[3].content).toContain('### Kesalahan yang sering terjadi');
        });

        it('soal punya 4 opsi unik, kunci valid, penjelasan, dan kunci cek tidak sama semua', () => {
          const cek: Soal[] = data.cards[4].questions;
          expect(cek.length).toBe(3);
          const soal = [...cek, data.cards[5]];
          for (const q of soal) {
            expect(new Set(q.options).size, q.question).toBe(4);
            expect(q.answer >= 0 && q.answer < 4).toBe(true);
            expect((q.explanation ?? '').length).toBeGreaterThan(20);
          }
          expect(new Set(soal.map((q) => q.answer)).size).toBeGreaterThan(1);
          for (const q of cek) expect((q as Soal & { remedial?: string }).remedial).toBeTruthy();
        });

        it(`isian: jumlah ___ sama dengan jawaban, diawali petunjuk ${kelas.komentar}`, () => {
          const c = data.cards[6];
          expect((c.code.match(/___/g) || []).length).toBe(c.answers.length);
          expect(c.code.trimStart().startsWith(kelas.komentar)).toBe(true);
          for (const a of c.answers) expect(a.trim().length).toBeGreaterThan(0);
        });

        it('tidak ada placeholder', () => {
          const teks = JSON.stringify(data);
          expect(teks).not.toMatch(/TODO|lorem ipsum|\bxxx\b/i);
        });
      });
    }
  });
}
