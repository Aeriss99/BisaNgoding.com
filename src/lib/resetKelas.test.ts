import { describe, it, expect } from 'vitest';
import type { UserProgress } from '../types/schema';
import { isiKelas, resetSatuKelas, sesuaikanResetKelas } from './resetKelas';
import { mergeProgress } from './cloudProgress';

const php = isiKelas('php');
const git = isiKelas('git');
const phpMateri = [...php.materi].slice(0, 3);
const gitMateri = [...git.materi].slice(0, 2);
const phpModul = [...php.modul][0];
const gitModul = [...git.modul][0];

function progres(isi: Partial<UserProgress> = {}): UserProgress {
  return {
    completedLessons: [...phpMateri, ...gitMateri],
    passedChecks: [phpMateri[0], gitMateri[0]],
    moduleStatus: { [phpModul]: 'completed', [gitModul]: 'unlocked' },
    quizScores: { [phpModul]: { score: 90, passed: true }, [gitModul]: { score: 80, passed: true } },
    xp: 500,
    streak: 4,
    streakDate: '2026-11-19',
    lastActiveDate: '2026-11-19',
    latihanUlang: {},
    ...isi,
  };
}

describe('reset per kelas', () => {
  it('isiKelas memuat modul dan materi kelas yang benar', () => {
    expect(php.modul.size).toBeGreaterThan(0);
    expect(php.materi.size).toBeGreaterThan(0);
    for (const id of git.materi) expect(php.materi.has(id)).toBe(false);
  });

  it('hanya menghapus materi, quiz, cek pemahaman, dan status modul kelas itu', () => {
    const hasil = resetSatuKelas(progres(), 'php', '2026-11-19T10:00:00.000Z');
    expect(hasil.completedLessons).toEqual(gitMateri);
    expect(hasil.passedChecks).toEqual([gitMateri[0]]);
    expect(hasil.quizScores).toEqual({ [gitModul]: { score: 80, passed: true } });
    expect(hasil.moduleStatus).toEqual({ [gitModul]: 'unlocked' });
    expect(hasil.xp).toBe(500);
    expect(hasil.streak).toBe(4);
    expect(hasil.resetKelas).toEqual({ php: '2026-11-19T10:00:00.000Z' });
  });

  it('penggabungan dengan cloud lama tidak memunculkan lagi materi kelas yang di-reset', () => {
    const lokal = resetSatuKelas(progres(), 'php', '2026-11-19T10:00:00.000Z');
    const cloud = progres();
    const gabung = mergeProgress(lokal, cloud);
    for (const id of phpMateri) expect(gabung.completedLessons).not.toContain(id);
    expect(gabung.quizScores[phpModul]).toBeUndefined();
    for (const id of gitMateri) expect(gabung.completedLessons).toContain(id);
    expect(gabung.resetKelas).toEqual({ php: '2026-11-19T10:00:00.000Z' });
    // Arah sebaliknya: perangkat lama (lokal) bertemu cloud yang sudah di-reset.
    const gabung2 = mergeProgress(cloud, lokal);
    for (const id of phpMateri) expect(gabung2.completedLessons).not.toContain(id);
  });

  it('materi yang diselesaikan setelah reset tetap tersimpan', () => {
    const lokal = resetSatuKelas(progres(), 'php', '2026-11-19T10:00:00.000Z');
    const lanjut = { ...lokal, completedLessons: [...lokal.completedLessons, phpMateri[0]] };
    const cloud = { ...lokal };
    const gabung = mergeProgress(lanjut, cloud);
    expect(gabung.completedLessons).toContain(phpMateri[0]);
  });

  it('reset yang lebih baru menang saat dua perangkat sama-sama pernah reset', () => {
    const a = resetSatuKelas(progres(), 'php', '2026-11-18T10:00:00.000Z');
    const aLanjut = { ...a, completedLessons: [...a.completedLessons, phpMateri[1]] };
    const b = resetSatuKelas(progres(), 'php', '2026-11-19T10:00:00.000Z');
    const { local, resetKelas } = sesuaikanResetKelas(aLanjut, b);
    expect(local.completedLessons).not.toContain(phpMateri[1]);
    expect(resetKelas.php).toBe('2026-11-19T10:00:00.000Z');
  });
});
