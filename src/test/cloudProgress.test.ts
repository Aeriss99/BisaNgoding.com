import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mergeProgress,
  saveLocalProgress,
  getLocalProgress,
  bersihkanProgresLokal,
  fetchCloudProgress,
  saveCloudProgress,
  catatRiwayatStreak,
} from '../lib/cloudProgress';
import type { UserProgress } from '../types/schema';
import * as supabaseModule from '../lib/supabase';
import * as modeLokalModule from '../lib/modeLokal';

vi.mock('../lib/modeLokal', () => ({
  apakahModeLokal: vi.fn(() => false),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('fetchCloudProgress & saveCloudProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchCloudProgress returns {ok: false} when Supabase returns an error', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({ error: new Error('Database error'), data: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    (supabaseModule.supabase!.from as any).mockReturnValue({ select: mockSelect });

    const result = await fetchCloudProgress('user1');
    expect(result).toEqual({ ok: false });
  });

  it('fetchCloudProgress returns {ok: false} on timeout', async () => {
    // Simulate a slow request
    const mockMaybeSingle = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 9000)));
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    (supabaseModule.supabase!.from as any).mockReturnValue({ select: mockSelect });

    const result = await fetchCloudProgress('user2');
    expect(result).toEqual({ ok: false });
  }, 10000);

  it('fetchCloudProgress returns {ok: true, data: null} when row is not found', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({ error: null, data: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    (supabaseModule.supabase!.from as any).mockReturnValue({ select: mockSelect });

    const result = await fetchCloudProgress('user3');
    expect(result).toEqual({ ok: true, data: null });
  });

  it('saveCloudProgress throws error when Supabase returns an error on fetch', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({ error: new Error('Fetch error'), data: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    (supabaseModule.supabase!.from as any).mockReturnValue({ select: mockSelect });

    await expect(saveCloudProgress('user4', {} as UserProgress)).rejects.toThrow('Fetch error');
  });

  it('1. Dua tab: tab B menyimpan data lama (streak 3, kemarin) setelah tab A menyimpan streak 4 hari ini -> cloud tetap 4 hari ini', async () => {
    const cloudRow = {
      diperbarui: '2026-10-25T01:00:00Z',
      data: {
        completedLessons: ['m1', 'm2', 'm3', 'm4'],
        xp: 40,
        streak: 4,
        streakDate: '2026-10-25',
        lastActiveDate: '2026-10-25',
      },
    };

    let savedDataInCloud: any = null;

    (supabaseModule.supabase!.from as any).mockImplementation((table: string) => {
      if (table === 'progres') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ error: null, data: cloudRow }),
            }),
          }),
          update: vi.fn((payload) => {
            savedDataInCloud = payload.data;
            return {
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockResolvedValue({ data: [{ user_id: 'user1' }], error: null }),
                }),
              }),
            };
          }),
        };
      }
    });

    const tabBOldData = {
      completedLessons: ['m1', 'm2', 'm3'],
      xp: 30,
      streak: 3,
      streakDate: '2026-10-24',
      lastActiveDate: '2026-10-24',
    } as unknown as UserProgress;

    const result = await saveCloudProgress('user1', tabBOldData);

    expect(result.streak).toBe(4);
    expect(result.streakDate).toBe('2026-10-25');
    expect(result.completedLessons).toEqual(['m1', 'm2', 'm3', 'm4']);
    expect(savedDataInCloud.streak).toBe(4);
  });

  it('2. Bentrok: diperbarui berubah di antara ambil dan simpan -> diulang, hasil akhir gabungan keduanya', async () => {
    let attempt = 0;
    let finalPayload: any = null;

    (supabaseModule.supabase!.from as any).mockImplementation((table: string) => {
      if (table === 'progres') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockImplementation(() => {
                attempt++;
                if (attempt === 1) {
                  return Promise.resolve({
                    error: null,
                    data: {
                      diperbarui: '2026-10-25T10:00:00Z',
                      data: { completedLessons: ['m1'], xp: 10, streak: 1, streakDate: '2026-10-25', lastActiveDate: '2026-10-25' },
                    },
                  });
                }
                // Attempt 2: cloud was updated by other device
                return Promise.resolve({
                  error: null,
                  data: {
                    diperbarui: '2026-10-25T10:00:05Z',
                    data: { completedLessons: ['m1', 'm2'], xp: 20, streak: 2, streakDate: '2026-10-25', lastActiveDate: '2026-10-25' },
                  },
                });
              }),
            }),
          }),
          update: vi.fn((payload) => {
            return {
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockImplementation((col: string, val: string) => {
                  return {
                    select: vi.fn().mockImplementation(() => {
                      if (val === '2026-10-25T10:00:00Z') {
                        // Conflict: 0 rows updated
                        return Promise.resolve({ data: [], error: null });
                      }
                      // Success on second attempt
                      finalPayload = payload.data;
                      return Promise.resolve({ data: [{ user_id: 'user1' }], error: null });
                    }),
                  };
                }),
              }),
            };
          }),
        };
      }
    });

    const localData = {
      completedLessons: ['m1', 'm3'],
      xp: 20,
      streak: 1,
      streakDate: '2026-10-25',
      lastActiveDate: '2026-10-25',
    } as unknown as UserProgress;

    const result = await saveCloudProgress('user1', localData);

    expect(attempt).toBe(2);
    expect(result.completedLessons).toEqual(['m1', 'm3', 'm2']);
    expect(finalPayload.completedLessons).toEqual(['m1', 'm3', 'm2']);
  });

  it('3. Gagal 3 kali: muncul error setelah 3 percobaan bentrok', async () => {
    (supabaseModule.supabase!.from as any).mockImplementation((table: string) => {
      if (table === 'progres') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                error: null,
                data: { diperbarui: '2026-10-25T00:00:00Z', data: { xp: 10 } },
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({ data: [], error: null }), // always 0 rows
              }),
            }),
          }),
        };
      }
    });

    await expect(saveCloudProgress('user1', {} as UserProgress)).rejects.toThrow(
      'Gagal menyimpan ke cloud setelah 3 percobaan bentrok'
    );
  });

  it('5. Riwayat streak: baris terkirim dengan sebab yang benar, dan tidak terkirim di mode lokal', () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    (supabaseModule.supabase!.from as any).mockImplementation((table: string) => {
      if (table === 'riwayat_streak') {
        return { insert: mockInsert };
      }
    });

    // 1. Kirim normal
    catatRiwayatStreak('u1', 2, '2026-10-24', 3, '2026-10-25', 'materi:lesson-1');
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'u1',
      streak_lama: 2,
      tanggal_lama: '2026-10-24',
      streak_baru: 3,
      tanggal_baru: '2026-10-25',
      sebab: 'materi:lesson-1',
      versi_app: 'test',
    });

    mockInsert.mockClear();

    // 2. Mode lokal: tidak terkirim
    vi.mocked(modeLokalModule.apakahModeLokal).mockReturnValueOnce(true);
    catatRiwayatStreak('u1', 2, '2026-10-24', 3, '2026-10-25', 'materi:lesson-2');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('6. Skenario Lingga: streak 2 (Jumat) -> Sabtu 23:55 (3) -> Minggu 00:15 (4), tab lama simpan Sabtu, hasil cloud tetap 4', async () => {
    // Skenario:
    // Jumat: streak 2, streakDate: '2026-10-23'
    // Sabtu 23:55: materi selesai -> streak 3, streakDate: '2026-10-24'
    // Minggu 00:15: materi selesai -> streak 4, streakDate: '2026-10-25', sudah tersimpan di cloud
    const cloudState = {
      diperbarui: '2026-10-25T00:15:00Z',
      data: {
        completedLessons: ['m1', 'm2', 'm3', 'm4'],
        xp: 40,
        streak: 4,
        streakDate: '2026-10-25',
        lastActiveDate: '2026-10-25',
      },
    };

    let updatedCloud: any = null;

    (supabaseModule.supabase!.from as any).mockImplementation((table: string) => {
      if (table === 'progres') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ error: null, data: cloudState }),
            }),
          }),
          update: vi.fn((payload) => {
            updatedCloud = payload.data;
            return {
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockResolvedValue({ data: [{ user_id: 'lingga' }], error: null }),
                }),
              }),
            };
          }),
        };
      }
    });

    // Tab lama yang masih memegang data Sabtu (streak 3, tanggal 24) melakukan save
    const tabSabtuLama = {
      completedLessons: ['m1', 'm2', 'm3'],
      xp: 30,
      streak: 3,
      streakDate: '2026-10-24',
      lastActiveDate: '2026-10-24',
    } as unknown as UserProgress;

    const result = await saveCloudProgress('lingga', tabSabtuLama);

    expect(result.streak).toBe(4);
    expect(result.streakDate).toBe('2026-10-25');
    expect(updatedCloud.streak).toBe(4);
    expect(updatedCloud.streakDate).toBe('2026-10-25');
  });
});

describe('mergeProgress', () => {
  it('merges completed lessons without duplicates', () => {
    const local = { completedLessons: ['l1', 'l2'] } as unknown as UserProgress;
    const cloud = { completedLessons: ['l2', 'l3'] } as unknown as UserProgress;
    const merged = mergeProgress(local, cloud);
    expect(merged.completedLessons).toEqual(['l1', 'l2', 'l3']);
  });

  it('takes the highest xp and streak', () => {
    const local = { xp: 100, streak: 2 } as unknown as UserProgress;
    const cloud = { xp: 50, streak: 5 } as unknown as UserProgress;
    const merged = mergeProgress(local, cloud);
    expect(merged.xp).toBe(100);
    expect(merged.streak).toBe(5);
  });

  it('takes the highest quiz scores', () => {
    const local = {
      quizScores: {
        m1: { score: 80, passed: true },
        m2: { score: 50, passed: false },
      },
    } as unknown as UserProgress;
    const cloud = {
      quizScores: {
        m1: { score: 60, passed: false },
        m2: { score: 90, passed: true },
        m3: { score: 100, passed: true },
      },
    } as unknown as UserProgress;
    const merged = mergeProgress(local, cloud);

    expect(merged.quizScores['m1'].score).toBe(80);
    expect(merged.quizScores['m1'].passed).toBe(true);

    expect(merged.quizScores['m2'].score).toBe(90);
    expect(merged.quizScores['m2'].passed).toBe(true);

    expect(merged.quizScores['m3'].score).toBe(100);
    expect(merged.quizScores['m3'].passed).toBe(true);
  });

  it('takes the latest dates', () => {
    const local = {
      lastActiveDate: '2024-01-05',
      maxSeenDate: '2024-01-05',
    } as unknown as UserProgress;
    const cloud = {
      lastActiveDate: '2024-01-10',
      maxSeenDate: '2024-01-08',
    } as unknown as UserProgress;
    const merged = mergeProgress(local, cloud);

    expect(merged.lastActiveDate).toBe('2024-01-10');
    expect(merged.maxSeenDate).toBe('2024-01-08'); // wait, local maxSeenDate is 05, cloud is 08, so 08.
  });

  it('respects resetAt from cloud overriding older local data', () => {
    const local = {
      completedLessons: ['l1', 'l2'],
      xp: 100,
      lastActiveDate: '2024-01-05',
    } as unknown as UserProgress;
    const cloud = {
      completedLessons: [],
      xp: 0,
      lastActiveDate: '2024-01-10',
      resetAt: '2024-01-10T00:00:00.000Z',
    } as unknown as UserProgress;
    
    const merged = mergeProgress(local, cloud);
    expect(merged.completedLessons).toEqual([]);
    expect(merged.xp).toBe(0);
  });

  it('respects resetAt from local overriding older cloud data', () => {
    const cloud = {
      completedLessons: ['l1', 'l2'],
      xp: 100,
      lastActiveDate: '2024-01-05',
    } as unknown as UserProgress;
    const local = {
      completedLessons: [],
      xp: 0,
      lastActiveDate: '2024-01-10',
      resetAt: '2024-01-10T00:00:00.000Z',
    } as unknown as UserProgress;
    
    const merged = mergeProgress(local, cloud);
    expect(merged.completedLessons).toEqual([]);
    expect(merged.xp).toBe(0);
  });
});

describe('local storage isolation', () => {
  it('isolates progress per account', () => {
    bersihkanProgresLokal(); // clean up
    const progA = { xp: 100 } as unknown as UserProgress;
    const progB = { xp: 200 } as unknown as UserProgress;
    
    saveLocalProgress(progA, 'userA');
    saveLocalProgress(progB, 'userB');
    
    expect(getLocalProgress('userA')?.xp).toBe(100);
    expect(getLocalProgress('userB')?.xp).toBe(200);
    
    bersihkanProgresLokal('userA');
    expect(getLocalProgress('userA')).toBeNull();
    expect(getLocalProgress('userB')?.xp).toBe(200);
  });
});
