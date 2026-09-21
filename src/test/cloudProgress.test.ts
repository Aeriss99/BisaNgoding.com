import { describe, it, expect } from 'vitest';
import { mergeProgress } from '../lib/cloudProgress';
import type { UserProgress } from '../types/schema';

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
    const local = { quizScores: { m1: { score: 80, passed: true }, m2: { score: 50, passed: false } } } as unknown as UserProgress;
    const cloud = { quizScores: { m1: { score: 60, passed: false }, m2: { score: 90, passed: true }, m3: { score: 100, passed: true } } } as unknown as UserProgress;
    const merged = mergeProgress(local, cloud);
    
    expect(merged.quizScores['m1'].score).toBe(80);
    expect(merged.quizScores['m1'].passed).toBe(true);
    
    expect(merged.quizScores['m2'].score).toBe(90);
    expect(merged.quizScores['m2'].passed).toBe(true);

    expect(merged.quizScores['m3'].score).toBe(100);
    expect(merged.quizScores['m3'].passed).toBe(true);
  });

  it('takes the latest dates', () => {
    const local = { lastActiveDate: '2024-01-05', maxSeenDate: '2024-01-05' } as unknown as UserProgress;
    const cloud = { lastActiveDate: '2024-01-10', maxSeenDate: '2024-01-08' } as unknown as UserProgress;
    const merged = mergeProgress(local, cloud);
    
    expect(merged.lastActiveDate).toBe('2024-01-10');
    expect(merged.maxSeenDate).toBe('2024-01-08'); // wait, local maxSeenDate is 05, cloud is 08, so 08.
  });
});
