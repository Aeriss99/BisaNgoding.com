import { describe, it, expect } from 'vitest';
import { checkInactivityReset, isImportTooOld, toISODate, daysBetweenISO } from './resetLogic';

function makeDefault() {
  return {
    completedLessons: [],
    xp: 0,
    streak: 0,
    lastActiveDate: '2000-01-01',
    maxSeenDate: '2000-01-01',
  };
}

describe('resetLogic', () => {
  it('daysBetweenISO computes correct day difference', () => {
    expect(daysBetweenISO('2026-01-10', '2026-01-01')).toBe(9);
    expect(daysBetweenISO('2026-01-01', '2026-01-01')).toBe(0);
  });

  it('6 hari tidak aktif: aman, tidak reset', () => {
    const progress = { lastActiveDate: '2026-01-01', maxSeenDate: '2026-01-01', xp: 100 };
    const now = new Date('2026-01-07T00:00:00Z'); // 6 hari kemudian
    const result = checkInactivityReset(progress, now, 7, makeDefault);
    expect(result.wasReset).toBe(false);
    expect(result.progress.xp).toBe(100);
    expect(result.daysUntilReset).toBe(1);
  });

  it('7 hari tidak aktif: harus reset', () => {
    const progress = { lastActiveDate: '2026-01-01', maxSeenDate: '2026-01-01', xp: 100 };
    const now = new Date('2026-01-08T00:00:00Z'); // 7 hari kemudian
    const result = checkInactivityReset(progress, now, 7, makeDefault);
    expect(result.wasReset).toBe(true);
    expect(result.progress.xp).toBe(0);
  });

  it('anti-akal jam: jam dimundurkan tidak menyelamatkan dari reset', () => {
    // maxSeenDate sudah tercatat jauh di depan (misal user pernah buka app di tanggal itu)
    const progress = { lastActiveDate: '2026-01-01', maxSeenDate: '2026-01-10', xp: 100 };
    // Device jam dimundurkan ke 2026-01-02 (hanya 1 hari dari lastActiveDate jika dihitung naive)
    const now = new Date('2026-01-02T00:00:00Z');
    const result = checkInactivityReset(progress, now, 7, makeDefault);
    // effectiveToday harus tetap 2026-01-10 (maxSeenDate), sehingga selisih = 9 hari >= 7 -> reset
    expect(result.effectiveToday).toBe('2026-01-10');
    expect(result.wasReset).toBe(true);
  });

  it('fitur mati jika inactiveDays = 0', () => {
    const progress = { lastActiveDate: '2000-01-01', maxSeenDate: '2000-01-01', xp: 100 };
    const now = new Date('2026-01-08T00:00:00Z');
    const result = checkInactivityReset(progress, now, 0, makeDefault);
    expect(result.wasReset).toBe(false);
    expect(result.progress.xp).toBe(100);
  });

  it('import file lama ditolak jika lastActiveDate melewati batas hari', () => {
    const now = new Date('2026-01-10T00:00:00Z');
    // File lastActiveDate 8 hari sebelum sekarang, batas 7 hari -> ditolak
    const tooOld = isImportTooOld('2026-01-01', now, undefined, 7);
    expect(tooOld).toBe(true);

    // File lastActiveDate 5 hari sebelum sekarang -> diterima
    const stillFresh = isImportTooOld('2026-01-05', now, undefined, 7);
    expect(stillFresh).toBe(false);
  });

  it('toISODate formats date correctly', () => {
    const d = new Date('2026-03-15T12:34:56Z');
    expect(toISODate(d)).toBe('2026-03-15');
  });
});
