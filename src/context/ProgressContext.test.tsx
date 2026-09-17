import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ProgressProvider, useProgress } from './ProgressContext';
import React from 'react';

// Setup localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ProgressContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ProgressProvider>{children}</ProgressProvider>
  );

  it('initializes with default progress if localStorage is empty', () => {
    const { result } = renderHook(() => useProgress(), { wrapper });
    expect(result.current.progress.xp).toBe(0);
    expect(result.current.progress.streak).toBe(0);
  });

  it('marks lesson as completed and adds XP exactly once', () => {
    const { result } = renderHook(() => useProgress(), { wrapper });
    
    act(() => {
      result.current.markLessonCompleted('dasar-01');
    });
    
    expect(result.current.progress.completedLessons).toContain('dasar-01');
    expect(result.current.progress.xp).toBe(10); // Assume 10 XP
    
    // Marking again should not add XP
    act(() => {
      result.current.markLessonCompleted('dasar-01');
    });
    expect(result.current.progress.xp).toBe(10);
  });

  it('handles streak logic: consecutive days', () => {
    // Set last active to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    localStorageMock.setItem('bisangoding_progress', JSON.stringify({
      completedLessons: [],
      xp: 0,
      streak: 1,
      lastActiveDate: yesterday.toISOString().split('T')[0],
      version: 1
    }));

    const { result } = renderHook(() => useProgress(), { wrapper });
    
    act(() => {
      result.current.markLessonCompleted('dasar-01'); // triggers activity
    });
    
    expect(result.current.progress.streak).toBe(2);
  });

  it('handles streak logic: missing a day resets streak', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    localStorageMock.setItem('bisangoding_progress', JSON.stringify({
      completedLessons: [],
      xp: 0,
      streak: 5,
      lastActiveDate: twoDaysAgo.toISOString().split('T')[0],
      version: 1
    }));

    const { result } = renderHook(() => useProgress(), { wrapper });
    
    act(() => {
      result.current.markLessonCompleted('dasar-01');
    });
    
    expect(result.current.progress.streak).toBe(1);
  });

  it('validates import data correctly', () => {
    // Nonaktifkan fitur reset-otomatis untuk tes ini agar lastActiveDate lama tidak ditolak
    vi.stubEnv('VITE_INACTIVE_DAYS', '0');
    const { result } = renderHook(() => useProgress(), { wrapper });
    
    const validData = {
      completedLessons: ['dasar-01'],
      xp: 100,
      streak: 2,
      lastActiveDate: '2023-01-01',
      version: 1,
      moduleStatus: { 'dasar': 'unlocked' }
    };
    
    let success = false;
    act(() => {
      success = result.current.importProgress(validData);
    });
    
    expect(success).toBe(true);
    expect(result.current.progress.xp).toBe(100);

    const invalidData = { xp: 100 }; // Missing fields
    act(() => {
      success = result.current.importProgress(invalidData);
    });
    
    expect(success).toBe(false);
    expect(result.current.progress.xp).toBe(100); // Should not change
    vi.unstubAllEnvs();
  });

  it('handles toggleUnlockAll correctly', () => {
    // If it's already true from .env, let's toggle it to false, then back to true
    const { result } = renderHook(() => useProgress(), { wrapper });
    
    act(() => {
      result.current.toggleUnlockAll(false);
    });
    expect(result.current.progress.unlockAll).toBe(false);
    
    act(() => {
      result.current.toggleUnlockAll(true);
    });
    
    expect(result.current.progress.unlockAll).toBe(true);
  });
  
  it('reads VITE_UNLOCK_ALL from environment variables if true', () => {
    vi.stubEnv('VITE_UNLOCK_ALL', 'true');
    const { result } = renderHook(() => useProgress(), { wrapper });
    expect(result.current.progress.unlockAll).toBe(true);
    vi.unstubAllEnvs();
  });

  it('resets progress automatically on app open if inactive >= VITE_INACTIVE_DAYS', () => {
    vi.stubEnv('VITE_INACTIVE_DAYS', '7');
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    const oldDateStr = eightDaysAgo.toISOString().split('T')[0];

    localStorageMock.setItem('bisangoding_progress', JSON.stringify({
      completedLessons: ['dasar-01', 'dasar-02'],
      xp: 500,
      streak: 10,
      lastActiveDate: oldDateStr,
      maxSeenDate: oldDateStr,
      version: 1,
      moduleStatus: { dasar: 'unlocked' },
      quizScores: {}
    }));

    const { result } = renderHook(() => useProgress(), { wrapper });

    expect(result.current.progress.xp).toBe(0);
    expect(result.current.progress.completedLessons).toEqual([]);
    expect(result.current.progress.streak).toBe(0);
    expect(result.current.progress.justReset).toBe(true);
    vi.unstubAllEnvs();
  });

  it('does not reset progress if inactive < VITE_INACTIVE_DAYS', () => {
    vi.stubEnv('VITE_INACTIVE_DAYS', '7');
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const recentDateStr = threeDaysAgo.toISOString().split('T')[0];

    localStorageMock.setItem('bisangoding_progress', JSON.stringify({
      completedLessons: ['dasar-01'],
      xp: 200,
      streak: 3,
      lastActiveDate: recentDateStr,
      maxSeenDate: recentDateStr,
      version: 1,
      moduleStatus: { dasar: 'unlocked' },
      quizScores: {}
    }));

    const { result } = renderHook(() => useProgress(), { wrapper });

    expect(result.current.progress.xp).toBe(200);
    expect(result.current.progress.completedLessons).toEqual(['dasar-01']);
    vi.unstubAllEnvs();
  });

  it('reset feature is off when VITE_INACTIVE_DAYS is 0', () => {
    vi.stubEnv('VITE_INACTIVE_DAYS', '0');
    const veryOld = '2000-01-01';

    localStorageMock.setItem('bisangoding_progress', JSON.stringify({
      completedLessons: ['dasar-01'],
      xp: 999,
      streak: 5,
      lastActiveDate: veryOld,
      maxSeenDate: veryOld,
      version: 1,
      moduleStatus: { dasar: 'unlocked' },
      quizScores: {}
    }));

    const { result } = renderHook(() => useProgress(), { wrapper });

    expect(result.current.progress.xp).toBe(999);
    vi.unstubAllEnvs();
  });

  it('rejects import if lastActiveDate in the file is too old (past inactivity threshold)', () => {
    vi.stubEnv('VITE_INACTIVE_DAYS', '7');
    const { result } = renderHook(() => useProgress(), { wrapper });

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const oldDateStr = tenDaysAgo.toISOString().split('T')[0];

    let success = true;
    act(() => {
      success = result.current.importProgress({
        completedLessons: ['dasar-01'],
        xp: 999,
        streak: 5,
        lastActiveDate: oldDateStr,
        moduleStatus: { dasar: 'unlocked' }
      });
    });

    expect(success).toBe(false);
    vi.unstubAllEnvs();
  });
});
