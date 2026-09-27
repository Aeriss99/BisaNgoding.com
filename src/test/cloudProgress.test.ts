import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mergeProgress, saveLocalProgress, getLocalProgress, bersihkanProgresLokal, fetchCloudProgress, saveCloudProgress } from '../lib/cloudProgress';
import type { UserProgress } from '../types/schema';
import * as supabaseModule from '../lib/supabase';

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

  it('saveCloudProgress throws error when Supabase returns an error', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: new Error('Save error') });
    (supabaseModule.supabase!.from as any).mockReturnValue({ upsert: mockUpsert });

    await expect(saveCloudProgress('user4', {} as UserProgress)).rejects.toThrow('Save error');
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
