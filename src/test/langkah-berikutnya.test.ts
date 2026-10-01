import { describe, it, expect, vi } from 'vitest';
import { langkahBerikutnya } from '../lib/materi';
import * as content from '../lib/content';

// Mock content data for linux-pengenalan
vi.mock('../lib/content', async (importOriginal) => {
  const actual: any = await importOriginal();
  const mockModule = { id: 'linux-pengenalan', courseId: 'linux', title: 'Distro Linux', status: 'ready', order: 1 };
  
  return {
    ...actual,
    modulesData: [mockModule, ...actual.modulesData],
    coursesData: [...actual.coursesData, { id: 'linux', language: 'bash', title: 'Linux' }],
    getModule: (id: string) => {
      if (id === 'linux-pengenalan') return mockModule;
      return actual.getModule(id);
    },
    getVisibleLessons: (id: string) => {
      if (id === 'linux-pengenalan') return [
        { id: 'linux-pengenalan-01', moduleId: 'linux-pengenalan', title: 'Apa itu Linux', cards: [] },
        { id: 'linux-pengenalan-02', moduleId: 'linux-pengenalan', title: 'Distro Linux', cards: [] }
      ];
      return actual.getVisibleLessons(id);
    },
    getQuizQuestions: (id: string) => {
      if (id === 'linux-pengenalan') return new Array(20).fill({});
      return actual.getQuizQuestions(id);
    },
    nomorModul: (id: string) => {
      if (id === 'linux-pengenalan') return { nomor: 1 };
      return actual.nomorModul(id);
    }
  };
});

describe('langkahBerikutnya', () => {
  it('materi pertama modul linux-pengenalan -> jenis materi, url /lesson/linux-pengenalan-02, keterangan diawali 1.2 ·', () => {
    const lesson: any = { id: 'linux-pengenalan-01', moduleId: 'linux-pengenalan', title: 'Apa itu Linux' };
    const hasil = langkahBerikutnya(lesson);
    expect(hasil.jenis).toBe('materi');
    expect(hasil.url).toBe('/lesson/linux-pengenalan-02');
    expect(hasil.keterangan.startsWith('1.2 · ')).toBe(true);
  });

  it('materi terakhir modul linux-pengenalan -> jenis quiz, url /quiz/linux-pengenalan, keterangan diawali 20 soal', () => {
    const lesson: any = { id: 'linux-pengenalan-02', moduleId: 'linux-pengenalan', title: 'Distro Linux' };
    const hasil = langkahBerikutnya(lesson);
    expect(hasil.jenis).toBe('quiz');
    expect(hasil.url).toBe('/quiz/linux-pengenalan');
    expect(hasil.keterangan.startsWith('20 soal')).toBe(true);
  });

  it('materi pertama modul Java dasar (moduleId alias java-dasar) -> jenis materi', () => {
    const lesson = content.getLesson('java-dasar-01');
    expect(lesson).toBeDefined();
    if (lesson) {
      const hasil = langkahBerikutnya(lesson);
      expect(hasil.jenis).toBe('materi');
      // pastikan url materi kedua dari getVisibleLessons
      const lessons = content.getVisibleLessons('dasar');
      expect(hasil.url).toBe(`/lesson/${lessons[1].id}`);
    }
  });

  it('materi dari modul yang tidak dikenal -> jenis kelas dan tidak error', () => {
    const lesson: any = { id: 'anon-01', moduleId: 'tidak-dikenal', title: 'Anon' };
    const hasil = langkahBerikutnya(lesson);
    expect(hasil.jenis).toBe('kelas');
    expect(hasil.judul).toBe('Kembali ke kelas');
  });
});
