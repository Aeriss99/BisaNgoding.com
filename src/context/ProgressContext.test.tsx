import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ProgressProvider, useProgress } from './ProgressContext';
import { AuthProvider } from './AuthContext';
import React from 'react';

// Setup localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockModeLokal = vi.fn(() => false);
vi.mock('../lib/modeLokal', () => ({
  apakahModeLokal: () => mockModeLokal(),
}));

// Mock supabase rpc for testing
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

import { supabase } from '../lib/supabase';

describe('ProgressContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>
      <ProgressProvider>{children}</ProgressProvider>
    </AuthProvider>
  );

  it('saveCloudProgress is not called when fetchCloudProgress returns ok: false', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({ error: new Error('Network error'), data: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockUpsert = vi.fn();
    (supabase!.from as any).mockImplementation((table: string) => {
      if (table === 'progres') {
        return { select: mockSelect, upsert: mockUpsert };
      }
    });

    vi.mocked(supabase!.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: { id: 'user-id' } } },
    } as any);

    const { result } = renderHook(() => useProgress(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 150)); 
    });

    act(() => {
      result.current.markLessonCompleted('dasar-01');
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 1100)); // wait for debounce
    });

    expect(mockUpsert).not.toHaveBeenCalled();
  });

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
    const lokal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    localStorageMock.setItem(
      'bisangoding_progress',
      JSON.stringify({
        completedLessons: [],
        xp: 0,
        streak: 1,
        streakDate: lokal(yesterday),
        lastActiveDate: yesterday.toISOString().split('T')[0],
        version: 1,
      })
    );

    const { result } = renderHook(() => useProgress(), { wrapper });

    act(() => {
      result.current.markLessonCompleted('dasar-01'); // triggers activity
    });

    expect(result.current.progress.streak).toBe(2);
  });

  it('streak tetap naik walaupun touchActivity() sudah mengisi lastActiveDate hari ini (pindah kartu)', () => {
    const kemarin = new Date();
    kemarin.setDate(kemarin.getDate() - 1);
    const lokal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    localStorageMock.setItem(
      'bisangoding_progress',
      JSON.stringify({
        completedLessons: ['dasar-01'],
        xp: 10,
        streak: 3,
        streakDate: lokal(kemarin),
        lastActiveDate: new Date().toISOString().split('T')[0],
        version: 1,
      })
    );

    const { result } = renderHook(() => useProgress(), { wrapper });

    act(() => {
      result.current.touchActivity(); // klik Lanjut di kartu
      result.current.markLessonCompleted('dasar-02'); // kartu terakhir
    });
    expect(result.current.progress.streak).toBe(4);
    expect(result.current.streakHariIni).toBe(4);

    act(() => {
      result.current.markLessonCompleted('dasar-03'); // materi kedua di hari yang sama
    });
    expect(result.current.progress.streak).toBe(4);
  });

  it('handles streak logic: missing a day resets streak', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    localStorageMock.setItem(
      'bisangoding_progress',
      JSON.stringify({
        completedLessons: [],
        xp: 0,
        streak: 5,
        lastActiveDate: twoDaysAgo.toISOString().split('T')[0],
        version: 1,
      })
    );

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
      moduleStatus: { dasar: 'unlocked' },
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

  it('ignores unlockAll toggle for guests and non-admins', async () => {
    const { result } = renderHook(() => useProgress(), { wrapper });

    act(() => {
      result.current.toggleUnlockAll(true);
    });

    // User is null by default, so isAdmin is false, thus unlockAll must be false
    expect(result.current.progress.unlockAll).toBe(false);
  });

  it('allows unlockAll toggle for admins', async () => {
    // Mock user session and is_admin
    vi.mocked(supabase!.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: { id: 'admin-id' } } },
    } as any);
    vi.mocked(supabase!.rpc).mockResolvedValueOnce({
      data: true,
      error: null,
    } as any);

    const { result } = renderHook(() => useProgress(), { wrapper });

    // Wait for auth to resolve
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100)); // wait for getSession and checkAdmin to complete
    });

    act(() => {
      result.current.toggleUnlockAll(true);
    });

    expect(result.current.progress.unlockAll).toBe(true);
  });

  it('skenario bug 22 Okt: data lama lokal tidak menimpa cloud progres, streak tetap dan tidak ada resetAt baru', async () => {
    mockModeLokal.mockReturnValue(false);

    // 10 days ago
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const oldDateStr = tenDaysAgo.toISOString().split('T')[0];

    // Yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    localStorageMock.setItem(
      'bisangoding_progress:user-1',
      JSON.stringify({
        completedLessons: ['materi-1'],
        xp: 10,
        streak: 1,
        lastActiveDate: oldDateStr,
        maxSeenDate: oldDateStr,
      })
    );

    const thirtyLessons = Array.from({ length: 30 }, (_, i) => `materi-${i + 1}`);
    const cloudProgressData = {
      completedLessons: thirtyLessons,
      xp: 300,
      streak: 5,
      streakDate: yesterdayStr,
      lastActiveDate: yesterdayStr,
      maxSeenDate: yesterdayStr,
      moduleStatus: { dasar: 'unlocked' },
      quizScores: {},
    };

    const mockMaybeSingle = vi.fn().mockResolvedValue({
      error: null,
      data: { data: cloudProgressData },
    });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    (supabase!.from as any).mockImplementation((table: string) => {
      if (table === 'progres') {
        return { select: mockSelect, upsert: mockUpsert };
      }
      return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }) }) };
    });

    vi.mocked(supabase!.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: { id: 'user-1' } } },
    } as any);

    const { result } = renderHook(() => useProgress(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 150));
    });

    expect(result.current.progress.completedLessons.length).toBe(30);
    expect(result.current.progress.streak).toBe(5);
    expect(result.current.progress.resetAt).toBeFalsy();
  });

  it('cloud punya resetAt lebih baru dari data lokal (reset server) -> hasil kosong sesuai cloud', async () => {
    mockModeLokal.mockReturnValue(false);

    const oldDateStr = '2026-10-10';
    localStorageMock.setItem(
      'bisangoding_progress:user-2',
      JSON.stringify({
        completedLessons: ['materi-1', 'materi-2'],
        xp: 100,
        streak: 3,
        lastActiveDate: oldDateStr,
        maxSeenDate: oldDateStr,
      })
    );

    const serverResetProgress = {
      completedLessons: [],
      xp: 0,
      streak: 0,
      lastActiveDate: '2026-10-22',
      maxSeenDate: '2026-10-22',
      resetAt: '2026-10-22T01:00:00.000Z',
    };

    const mockMaybeSingle = vi.fn().mockResolvedValue({
      error: null,
      data: { data: serverResetProgress },
    });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    (supabase!.from as any).mockImplementation((table: string) => {
      if (table === 'progres') return { select: mockSelect, upsert: vi.fn() };
      return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }) }) };
    });

    vi.mocked(supabase!.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: { id: 'user-2' } } },
    } as any);

    const { result } = renderHook(() => useProgress(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 150));
    });

    expect(result.current.progress.completedLessons).toEqual([]);
    expect(result.current.progress.xp).toBe(0);
    expect(result.current.progress.resetAt).toBe('2026-10-22T01:00:00.000Z');
  });

  it('mode lokal: saveCloudProgress dan fetchCloudProgress tidak pernah dipanggil, streakHariIni = 0, kunci lokal', async () => {
    mockModeLokal.mockReturnValue(true);

    const mockSelect = vi.fn();
    const mockUpsert = vi.fn();
    (supabase!.from as any).mockImplementation((table: string) => {
      if (table === 'progres') return { select: mockSelect, upsert: mockUpsert };
      return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }) }) };
    });

    vi.mocked(supabase!.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: { id: 'user-lokal' } } },
    } as any);

    const { result } = renderHook(() => useProgress(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 150));
    });

    expect(mockSelect).not.toHaveBeenCalled();
    expect(result.current.syncStatus).toBe('Mode lokal: progres tidak disimpan ke akun');
    expect(result.current.streakHariIni).toBe(0);

    // Menyelesaikan materi tidak mengubah streak di mode lokal
    act(() => {
      result.current.markLessonCompleted('dasar-01');
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 1100)); // wait debounce
    });

    expect(mockUpsert).not.toHaveBeenCalled();
    expect(result.current.progress.streak).toBe(0);

    // Kunci localStorage memakai bisangoding_progress_lokal:user-lokal
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'bisangoding_progress_lokal:user-lokal',
      expect.any(String)
    );
  });

  it('4. Event storage dari tab lain digabung dengan mergeProgress, tidak menimpa data lokal', async () => {
    mockModeLokal.mockReturnValue(false);

    // Initial state tab ini
    localStorageMock.setItem(
      'bisangoding_progress:user-tab',
      JSON.stringify({
        completedLessons: ['materi-tab1'],
        xp: 10,
        streak: 1,
        streakDate: '2026-10-24',
        lastActiveDate: '2026-10-24',
      })
    );

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            diperbarui: '2026-10-24T00:00:00Z',
            data: { completedLessons: ['materi-tab1'], xp: 10, streak: 1 },
          },
          error: null,
        }),
      }),
    });
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: [{ user_id: 'user-tab' }], error: null }),
        }),
      }),
    });
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });

    (supabase!.from as any).mockImplementation((table: string) => {
      if (table === 'progres') return { select: mockSelect, update: mockUpdate };
      if (table === 'riwayat_streak') return { insert: mockInsert };
      return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }) }) };
    });

    vi.mocked(supabase!.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: { id: 'user-tab' } } },
    } as any);

    const { result } = renderHook(() => useProgress(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 150));
    });

    expect(result.current.progress.completedLessons).toEqual(['materi-tab1']);

    // Tab lain menyelesaikan materi-tab2 dan menaikkan streak
    const tabLainData = {
      completedLessons: ['materi-tab2'],
      xp: 20,
      streak: 2,
      streakDate: '2026-10-25',
      lastActiveDate: '2026-10-25',
    };

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'bisangoding_progress:user-tab',
          newValue: JSON.stringify(tabLainData),
        })
      );
    });

    // Hasil harus digabung: kedua materi ada, xp dan streak tertinggi
    expect(result.current.progress.completedLessons).toContain('materi-tab1');
    expect(result.current.progress.completedLessons).toContain('materi-tab2');
    expect(result.current.progress.streak).toBe(2);
    expect(result.current.progress.streakDate).toBe('2026-10-25');

    // Riwayat streak terkirim dengan sebab gabung-tab
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-tab',
        sebab: 'gabung-tab',
        streak_baru: 2,
        tanggal_baru: '2026-10-25',
      })
    );
  });
});
