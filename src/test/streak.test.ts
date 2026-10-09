import { describe, it, expect } from 'vitest';
import { tanggalLokal, streakSetelahBelajar, streakTampil, progresSetelahMateri, lengkapiStreak, gabungStreak } from '../lib/streak';
import type { UserProgress } from '../types/schema';

const dasar = (isi: Partial<UserProgress> = {}): UserProgress => ({
  completedLessons: [], passedChecks: [], moduleStatus: {}, quizScores: {}, xp: 0, streak: 0, lastActiveDate: '2026-10-01', ...isi,
});
// Jam di perangkat pengguna: 8 Oktober 2026 pukul 06.43 (di WIB tanggal UTC-nya masih 7 Oktober)
const PAGI = new Date(2026, 9, 8, 6, 43);

describe('streak harian', () => {
  it('tanggal memakai kalender perangkat, bukan UTC', () => {
    expect(tanggalLokal(PAGI)).toBe('2026-10-08');
  });

  it('aturan dasar: pertama 1, hari sama tetap, besok naik, bolos mulai dari 1', () => {
    expect(streakSetelahBelajar(0, undefined, '2026-10-08')).toBe(1);
    expect(streakSetelahBelajar(3, '2026-10-08', '2026-10-08')).toBe(3);
    expect(streakSetelahBelajar(3, '2026-10-07', '2026-10-08')).toBe(4);
    expect(streakSetelahBelajar(3, '2026-10-05', '2026-10-08')).toBe(1);
    expect(streakSetelahBelajar(3, '2026-09-30', '2026-10-01')).toBe(4); // ganti bulan
  });

  it('BUG LAMA: sudah membuka materi (lastActiveDate = hari ini) tetap menaikkan streak saat materi selesai', () => {
    const prev = dasar({ streak: 1, streakDate: '2026-10-07', lastActiveDate: '2026-10-08', completedLessons: ['a'] });
    const next = progresSetelahMateri(prev, 'b', PAGI);
    expect(next.streak).toBe(2);
    expect(next.streakDate).toBe('2026-10-08');
    expect(next.completedLessons).toEqual(['a', 'b']);
    expect(next.xp).toBe(10);
  });

  it('materi kedua di hari yang sama tidak menaikkan streak lagi', () => {
    const satu = progresSetelahMateri(dasar({ streak: 1, streakDate: '2026-10-07' }), 'a', PAGI);
    const dua = progresSetelahMateri(satu, 'b', PAGI);
    expect(dua.streak).toBe(2);
    expect(dua.xp).toBe(20);
  });

  it('mengulang materi yang sudah selesai tetap dihitung untuk streak, tanpa XP tambahan', () => {
    const prev = dasar({ streak: 4, streakDate: '2026-10-07', completedLessons: ['a'], xp: 50 });
    const next = progresSetelahMateri(prev, 'a', PAGI);
    expect(next.streak).toBe(5);
    expect(next.xp).toBe(50);
    expect(next.completedLessons).toEqual(['a']);
    expect(progresSetelahMateri(next, 'a', PAGI)).toBe(next); // tidak ada perubahan lagi hari ini
  });

  it('streak yang ditampilkan jadi 0 kalau sudah bolos lebih dari sehari', () => {
    expect(streakTampil(5, '2026-10-08', '2026-10-08')).toBe(5);
    expect(streakTampil(5, '2026-10-07', '2026-10-08')).toBe(5); // masih bisa diselamatkan hari ini
    expect(streakTampil(5, '2026-10-06', '2026-10-08')).toBe(0);
    expect(streakTampil(0, undefined, '2026-10-08')).toBe(0);
    expect(streakTampil(2, undefined, '2026-10-08')).toBe(2);
  });

  it('data lama tanpa streakDate memakai lastActiveDate', () => {
    expect(lengkapiStreak(dasar({ streak: 3, lastActiveDate: '2026-10-07' })).streakDate).toBe('2026-10-07');
    expect(lengkapiStreak(dasar({ streak: 0 })).streakDate).toBeUndefined();
  });

  it('gabung dua perangkat: tanggal streak terbaru yang menang', () => {
    expect(gabungStreak({ streak: 1, streakDate: '2026-10-08' }, { streak: 9, streakDate: '2026-10-01' })).toEqual({ streak: 1, streakDate: '2026-10-08' });
    expect(gabungStreak({ streak: 2, streakDate: '2026-10-08' }, { streak: 3, streakDate: '2026-10-08' })).toEqual({ streak: 3, streakDate: '2026-10-08' });
    expect(gabungStreak({ streak: 2 }, { streak: 5 })).toEqual({ streak: 5, streakDate: undefined });
  });

  it('baru login: materi selesai sebelum data cloud dimuat tetap melanjutkan streak kemarin', () => {
    // perangkat baru: progres kosong, selesai materi jam 00.05 -> streak 1 tanggal hari ini
    const perangkat = progresSetelahMateri(dasar(), 'java-dasar-01', new Date(2026, 9, 10, 0, 5));
    expect(perangkat.streak).toBe(1);
    // cloud menyimpan streak 3 dari kemarin
    expect(gabungStreak(perangkat, { streak: 3, streakDate: '2026-10-09' })).toEqual({ streak: 4, streakDate: '2026-10-10' });
    expect(gabungStreak({ streak: 3, streakDate: '2026-10-09' }, perangkat)).toEqual({ streak: 4, streakDate: '2026-10-10' });
    // kalau perangkat sudah benar (4), tidak dihitung dua kali
    expect(gabungStreak({ streak: 4, streakDate: '2026-10-10' }, { streak: 3, streakDate: '2026-10-09' })).toEqual({ streak: 4, streakDate: '2026-10-10' });
    // ganti bulan juga dianggap berurutan
    expect(gabungStreak({ streak: 1, streakDate: '2026-11-01' }, { streak: 7, streakDate: '2026-10-31' })).toEqual({ streak: 8, streakDate: '2026-11-01' });
    // ada hari bolos: tetap mulai dari yang terbaru
    expect(gabungStreak({ streak: 1, streakDate: '2026-10-10' }, { streak: 3, streakDate: '2026-10-08' })).toEqual({ streak: 1, streakDate: '2026-10-10' });
  });
});
