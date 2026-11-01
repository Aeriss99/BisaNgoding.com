import { describe, expect, it } from 'vitest';
import { modulesData, getVisibleLessons, getQuizQuestions, checkModuleUnlocked, getModule } from '../lib/content';
import { ringkasanKelas, lulusProyekAkhir } from '../lib/kelas';
import { ambilElemenLayar } from '../lib/praktikGithub';
import type { CekGitHubCard, UserProgress } from '../types/schema';

const asli = getModule('git-proyek-akhir')!;
const lain = modulesData.filter((m) => m.courseId === 'git' && m.id !== 'git-proyek-akhir');

function progres(skor: number, kecuali?: string): UserProgress {
  const completedLessons = lain.filter((m) => m.id !== kecuali).flatMap((m) => getVisibleLessons(m.id).map((l) => l.id));
  const quizScores: UserProgress['quizScores'] = {};
  for (const m of lain) if (getQuizQuestions(m.id)?.length) quizScores[m.id] = { score: skor, passed: skor >= 70 };
  return { completedLessons, passedChecks: [], moduleStatus: {}, quizScores, xp: 0, streak: 0, lastActiveDate: '' };
}

describe('Latihan Proyek Akhir (simulasi)', () => {
  it('8 materi praktik tanpa soal, tanpa quiz, dan tidak menentukan kelulusan', () => {
    expect(getModule('git-akhir')).toMatchObject({ requires: 'git-tim' });
    expect(getModule('git-akhir')?.syaratAkhir).toBeUndefined();
    const lessons = getVisibleLessons('git-akhir');
    expect(lessons).toHaveLength(8);
    for (const l of lessons) {
      const jenis = l.cards.map((c) => c.type);
      expect(jenis[0]).toBe('theory');
      expect(jenis[jenis.length - 1]).toBe('summary');
      expect(jenis.slice(1, -1).every((j) => j === 'praktik_terminal' || j === 'praktik_github')).toBe(true);
    }
    expect(JSON.stringify(lessons)).not.toContain('Kamu **Lulus Proyek');
    expect(getQuizQuestions('git-akhir') ?? []).toHaveLength(0);
  });
});

describe('Proyek Akhir Git & GitHub (sungguhan)', () => {
  it('modul terakhir: 8 tahap, setiap tahap diperiksa di GitHub pengguna', () => {
    expect(asli).toMatchObject({ courseId: 'git', lessonCount: 8, requires: 'git-akhir', syaratAkhir: { rataQuizMinimal: 80 } });
    const lessons = getVisibleLessons('git-proyek-akhir');
    expect(lessons).toHaveLength(8);
    lessons.forEach((l, i) => {
      expect(l.cards.map((c) => c.type)).toEqual(['theory', 'cek_github', 'summary']);
      expect((l.cards[1] as CekGitHubCard).tahap).toBe(i + 1);
      expect((l.cards[0] as { content: string }).content).toContain('### Yang diperiksa');
    });
    expect(lessons.filter((l) => (l.cards[1] as CekGitHubCard).bukti).map((l) => l.order)).toEqual([3, 6]);
    expect(getQuizQuestions('git-proyek-akhir') ?? []).toHaveLength(0);
  });

  it('terkunci sampai semua modul Git lain (termasuk latihan) selesai dan rata-rata quiz minimal 80', () => {
    expect(checkModuleUnlocked(asli, progres(90))).toBe(true);
    expect(checkModuleUnlocked(asli, progres(75))).toBe(false);
    expect(checkModuleUnlocked(asli, progres(95, 'git-tag'))).toBe(false);
    expect(checkModuleUnlocked(asli, progres(95, 'git-akhir'))).toBe(false);
    expect(checkModuleUnlocked(asli, { ...progres(10), unlockAll: true })).toBe(true);
  });

  it('kartu terkunci menjelaskan syaratnya, dan lulus hanya dari proyek sungguhan', () => {
    const kurang = ringkasanKelas('git', progres(75))!;
    expect(kurang.modul.find((m) => m.mod.id === 'git-proyek-akhir')?.syaratJudul).toBe('rata-rata quiz minimal 80 (sekarang 75)');
    const belum = ringkasanKelas('git', progres(90, 'git-tag'))!;
    expect(belum.modul.find((m) => m.mod.id === 'git-proyek-akhir')?.syaratJudul).toBe('1 modul lain');
    expect(lulusProyekAkhir(ringkasanKelas('git', progres(90))!)).toBeNull();
    const p = progres(90);
    p.completedLessons.push(...getVisibleLessons('git-proyek-akhir').map((l) => l.id));
    expect(lulusProyekAkhir(ringkasanKelas('git', p)!)).toBe('Lulus Proyek Git & GitHub');
  });

  it('layar halaman_umum di latihan: setiap tombol bisa jadi target', () => {
    const el = ambilElemenLayar({ templat: 'halaman_umum', tombol: [{ id: 'btn-use-template', teks: 'Use this template', utama: true }] });
    expect(el['btn-use-template']).toBe('Use this template');
    expect(el['tab-issues']).toBe('Issues');
  });
});
