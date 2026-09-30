import { describe, it, expect } from 'vitest';
import { ringkasanProgres } from '../lib/progres';
import { coursesData, modulesData, getVisibleLessons } from '../lib/content';
import type { UserProgress } from '../types/schema';

function progres(isi: Partial<UserProgress> = {}): UserProgress {
  return { completedLessons: [], passedChecks: [], moduleStatus: {}, quizScores: {}, xp: 0, streak: 0, lastActiveDate: '', ...isi };
}

const modulMysql = modulesData.filter((m) => m.courseId === 'mysql' && m.status !== 'draft').sort((a, b) => a.order - b.order);
const materi = (id: string) => getVisibleLessons(id).map((l) => l.id);

describe('ringkasanProgres', () => {
  it('pengguna baru: semua kelas siap ada, belum ada yang dimulai', () => {
    const r = ringkasanProgres(progres({ streak: 3, xp: 1240 }));
    const siap = coursesData.filter((c) => c.status !== 'soon').map((c) => c.id);
    expect(r.kelas.map((k) => k.course.id).sort()).toEqual([...siap].sort());
    expect(r.kelas.every((k) => k.totalSelesai === 0 && k.persen === 0)).toBe(true);
    expect(r).toMatchObject({ streak: 3, xp: 1240, totalSelesai: 0, quizLulus: 0, quiz: [] });
    expect(r.totalMateri).toBe(r.kelas.reduce((t, k) => t + k.totalMateri, 0));
    // urutan kelas mengikuti urutan di courses.json
    expect(r.kelas[0].course.id).toBe('java');
  });

  it('kelas yang sudah dimulai tampil paling atas dan dihitung benar', () => {
    const m1 = modulMysql[0];
    const r = ringkasanProgres(progres({ completedLessons: materi(m1.id).slice(0, 2) }));
    expect(r.kelas[0].course.id).toBe('mysql');
    expect(r.kelas[0].totalSelesai).toBe(2);
    expect(r.totalSelesai).toBe(2);
    expect(r.kelas[0].lanjut?.url).toBe(`/lesson/${materi(m1.id)[2]}`);
  });

  it('hasil quiz: lulus dulu, lengkap dengan kelas dan skor', () => {
    const [a, b] = modulMysql;
    const r = ringkasanProgres(progres({ quizScores: { [b.id]: { score: 40, passed: false }, [a.id]: { score: 90, passed: true }, 'modul-hilang': { score: 80, passed: true } } }));
    expect(r.quiz.map((q) => [q.modulId, q.lulus, q.skor])).toEqual([
      [a.id, true, 90],
      [b.id, false, 40],
    ]);
    expect(r.quiz[0]).toMatchObject({ judul: a.title, kelasId: 'mysql', kelasJudul: 'MySQL Database' });
    expect(r.quizLulus).toBe(1);
  });

  it('kelas yang selesai semua tidak punya tombol lanjut, tapi punya materi pertama', () => {
    const semua = modulMysql.flatMap((m) => materi(m.id));
    const skor = Object.fromEntries(modulMysql.map((m) => [m.id, { score: 100, passed: true }]));
    const k = ringkasanProgres(progres({ completedLessons: semua, quizScores: skor })).kelas.find((x) => x.course.id === 'mysql')!;
    expect(k.persen).toBe(100);
    expect(k.lanjut).toBeNull();
    expect(k.modulSelesai).toBe(k.jumlahModul);
    expect(k.materiPertama).toBe(`/lesson/${semua[0]}`);
  });
});
