import { describe, it, expect } from 'vitest';
import { formatDurasi, ringkasanKelas, jalurKelas } from '../lib/kelas';
import { modulesData, getVisibleLessons, getQuizQuestions } from '../lib/content';
import type { UserProgress } from '../types/schema';

const modulJava = modulesData
  .filter((m) => (m.courseId || 'java') === 'java' && m.status !== 'draft')
  .sort((a, b) => a.order - b.order);
const materi = (id: string) => getVisibleLessons(id).map((l) => l.id);

function progres(isi: Partial<UserProgress> = {}): UserProgress {
  return { completedLessons: [], passedChecks: [], moduleStatus: {}, quizScores: {}, xp: 0, streak: 0, lastActiveDate: '', ...isi };
}

describe('formatDurasi', () => {
  it('di bawah 90 menit ditulis menit, selebihnya jam dibulatkan', () => {
    expect(formatDurasi(9)).toBe('± 9 menit');
    expect(formatDurasi(82)).toBe('± 82 menit');
    expect(formatDurasi(90)).toBe('± 2 jam');
    expect(formatDurasi(240)).toBe('± 4 jam');
  });
});

describe('ringkasanKelas', () => {
  it('kelas yang tidak ada atau belum siap menghasilkan null', () => {
    expect(ringkasanKelas('tidak-ada', progres())).toBeNull();
    expect(ringkasanKelas('spring-boot', progres())).toBeNull();
  });

  it('pengguna baru: modul 1 sedang, materi pertama sekarang, sisanya terkunci', () => {
    const r = ringkasanKelas('java', progres())!;
    expect(r.modul.map((m) => m.mod.id)).toEqual(modulJava.map((m) => m.id));
    expect(r.modul[0].status).toBe('sedang');
    expect(r.modul.slice(1).every((m) => m.status === 'terkunci')).toBe(true);
    expect(r.modul[1].syaratJudul).toBe(modulJava[0].title);
    const m1 = r.modul[0].materi;
    expect(m1[0]).toMatchObject({ nomor: '1.1', status: 'sekarang', bisaDibuka: true });
    expect(m1[1]).toMatchObject({ nomor: '1.2', status: 'belum', bisaDibuka: false });
    expect(r.persen).toBe(0);
    expect(r.totalSelesai).toBe(0);
    expect(r.lanjut).toEqual({ keterangan: `1.1 · ${m1[0].lesson.title}`, url: `/lesson/${m1[0].lesson.id}` });
    expect(r.modul[1].materi.every((x) => !x.bisaDibuka && x.status === 'belum')).toBe(true);
  });

  it('modul 1 selesai (materi + quiz): modul 2 jadi sedang', () => {
    const id = modulJava[0].id;
    const r = ringkasanKelas('java', progres({ completedLessons: materi(id), quizScores: { [id]: { score: 90, passed: true } } }))!;
    expect(r.modul[0]).toMatchObject({ status: 'selesai', quiz: 'lulus', skorQuiz: 90 });
    expect(r.modul[1].status).toBe('sedang');
    expect(r.modul[1].materi[0].status).toBe('sekarang');
    expect(r.totalSelesai).toBe(materi(id).length);
    expect(r.persen).toBe(Math.round((materi(id).length / r.totalMateri) * 100));
  });

  it('semua materi selesai tapi quiz belum: quiz siap, tombol lanjut ke quiz', () => {
    const id = modulJava[0].id;
    expect(getQuizQuestions(id)?.length).toBeGreaterThan(0);
    const r = ringkasanKelas('java', progres({ completedLessons: materi(id) }))!;
    expect(r.modul[0]).toMatchObject({ status: 'sedang', quiz: 'siap' });
    expect(r.lanjut).toEqual({ keterangan: `Quiz ${modulJava[0].title}`, url: `/quiz/${id}` });
    const gagal = ringkasanKelas('java', progres({ completedLessons: materi(id), quizScores: { [id]: { score: 40, passed: false } } }))!;
    expect(gagal.modul[0].quiz).toBe('gagal');
  });

  it('unlockAll: semua modul dan materi bisa dibuka, hanya satu modul sedang', () => {
    const r = ringkasanKelas('java', progres({ unlockAll: true }))!;
    expect(r.modul.filter((m) => m.status === 'sedang')).toHaveLength(1);
    expect(r.modul.slice(1).every((m) => m.status === 'terbuka')).toBe(true);
    expect(r.modul.every((m) => m.materi.every((x) => x.bisaDibuka))).toBe(true);
  });

  it('total materi dan menit sama dengan jumlah per modul', () => {
    const r = ringkasanKelas('mysql', progres())!;
    expect(r.totalMateri).toBe(r.modul.reduce((t, m) => t + m.jumlahMateri, 0));
    expect(r.totalMenit).toBe(r.modul.reduce((t, m) => t + m.menit, 0));
    expect(r.totalMenit).toBeGreaterThan(0);
  });
});

describe('jalurKelas', () => {
  it('kelas Java dipakai di jalur backend, English dipakai di semua jalur', () => {
    expect(jalurKelas('java').length).toBeGreaterThan(0);
    expect(jalurKelas('java')[0].keterangan).toMatch(/^tahap \d+$/);
    expect(jalurKelas('english-it')).toContainEqual({ judul: 'Semua jalur', keterangan: 'sambil jalan' });
    expect(jalurKelas('kelas-yang-tidak-ada')).toEqual([]);
  });
});