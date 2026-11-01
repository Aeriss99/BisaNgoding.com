import { describe, expect, it } from 'vitest';
import { modulesData, getVisibleLessons, getQuizQuestions, checkModuleUnlocked, getModule } from '../lib/content';
import { ringkasanKelas, lulusProyekAkhir } from '../lib/kelas';
import { ambilElemenLayar } from '../lib/praktikGithub';
import type { UserProgress } from '../types/schema';

const akhir = getModule('git-akhir')!;
const lain = modulesData.filter((m) => m.courseId === 'git' && m.id !== 'git-akhir');

function progres(skor: number, kecuali?: string): UserProgress {
  const completedLessons = lain.filter((m) => m.id !== kecuali).flatMap((m) => getVisibleLessons(m.id).map((l) => l.id));
  const quizScores: UserProgress['quizScores'] = {};
  for (const m of lain) if (getQuizQuestions(m.id)?.length) quizScores[m.id] = { score: skor, passed: skor >= 70 };
  return { completedLessons, passedChecks: [], moduleStatus: {}, quizScores, xp: 0, streak: 0, lastActiveDate: '' };
}

describe('Proyek Akhir Git & GitHub', () => {
  it('modul ke-14, 8 materi praktik tanpa soal dan tanpa quiz', () => {
    expect(akhir).toMatchObject({ courseId: 'git', lessonCount: 8, syaratAkhir: { rataQuizMinimal: 80 } });
    const lessons = getVisibleLessons('git-akhir');
    expect(lessons).toHaveLength(8);
    for (const l of lessons) {
      const jenis = l.cards.map((c) => c.type);
      expect(jenis[0]).toBe('theory');
      expect(jenis[jenis.length - 1]).toBe('summary');
      expect(jenis.slice(1, -1).every((j) => j === 'praktik_terminal' || j === 'praktik_github')).toBe(true);
      expect(jenis.slice(1, -1).length).toBeGreaterThan(0);
    }
    expect(getQuizQuestions('git-akhir') ?? []).toHaveLength(0);
  });

  it('terkunci sampai semua modul Git selesai dan rata-rata quiz minimal 80', () => {
    expect(checkModuleUnlocked(akhir, progres(90))).toBe(true);
    expect(checkModuleUnlocked(akhir, progres(75))).toBe(false);
    expect(checkModuleUnlocked(akhir, progres(95, 'git-tag'))).toBe(false);
    expect(checkModuleUnlocked(akhir, { ...progres(10), unlockAll: true })).toBe(true);
  });

  it('kartu terkunci menjelaskan syaratnya, dan lulus tampil setelah 8 tahap selesai', () => {
    const kurang = ringkasanKelas('git', progres(75))!;
    expect(kurang.modul.find((m) => m.mod.id === 'git-akhir')?.syaratJudul).toBe('rata-rata quiz minimal 80 (sekarang 75)');
    const belum = ringkasanKelas('git', progres(90, 'git-tag'))!;
    expect(belum.modul.find((m) => m.mod.id === 'git-akhir')?.syaratJudul).toBe('1 modul lain');
    expect(lulusProyekAkhir(ringkasanKelas('git', progres(90))!)).toBeNull();
    const p = progres(90);
    p.completedLessons.push(...getVisibleLessons('git-akhir').map((l) => l.id));
    expect(lulusProyekAkhir(ringkasanKelas('git', p)!)).toBe('Lulus Proyek Git & GitHub');
  });

  it('layar halaman_umum: setiap tombol bisa jadi target', () => {
    const el = ambilElemenLayar({ templat: 'halaman_umum', tombol: [{ id: 'btn-use-template', teks: 'Use this template', utama: true }] });
    expect(el['btn-use-template']).toBe('Use this template');
    expect(el['tab-issues']).toBe('Issues');
  });
});
