import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react';
import type { UserProgress } from '../types/schema';
import { toISODate } from '../lib/resetLogic';
import { useAuth } from './AuthContext';
import { progresSetelahMateri, streakTampil, tanggalLokal } from '../lib/streak';
import {
  getLocalProgress,
  saveLocalProgress,
  mergeProgress,
  fetchCloudProgress,
  saveCloudProgress,
  getCurrentUserId,
  setCurrentUserId,
} from '../lib/cloudProgress';
import { apakahModeLokal } from '../lib/modeLokal';

export interface ProgressContextType {
  progress: UserProgress;
  markLessonCompleted: (lessonId: string) => void;
  markCheckPassed: (lessonId: string) => void;
  importProgress: (data: any) => boolean;
  toggleUnlockAll: (enabled: boolean) => void;
  addXP: (amount: number) => void;
  saveQuizScore: (moduleId: string, score: number, passed: boolean) => void;
  touchActivity: () => void;
  /** Streak untuk ditampilkan: 0 kalau sudah lebih dari sehari tidak menyelesaikan materi (atau di mode lokal). */
  streakHariIni: number;
  flushKeCloud: () => Promise<boolean>;
  syncStatus:
    | 'Tersimpan'
    | 'Menyimpan...'
    | 'Offline, tersimpan di perangkat ini'
    | 'Mode lokal: progres tidak disimpan ke akun';
}

const ProgressContext = createContext<ProgressContextType | null>(null);

export function makeDefaultProgress(): UserProgress {
  const today = new Date().toISOString().split('T')[0];
  return {
    completedLessons: [],
    passedChecks: [],
    moduleStatus: { dasar: 'unlocked' },
    quizScores: {},
    xp: 0,
    streak: 0,
    lastActiveDate: today,
    maxSeenDate: today,
    version: 1,
    unlockAll:
      import.meta.env.DEV && import.meta.env.VITE_UNLOCK_ALL === 'true',
  };
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [syncStatus, setSyncStatus] = useState<
    | 'Tersimpan'
    | 'Menyimpan...'
    | 'Offline, tersimpan di perangkat ini'
    | 'Mode lokal: progres tidak disimpan ke akun'
  >(
    apakahModeLokal()
      ? 'Mode lokal: progres tidak disimpan ke akun'
      : 'Offline, tersimpan di perangkat ini'
  );

  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const currentUserId = getCurrentUserId();
      const data = getLocalProgress(currentUserId);
      if (data) {
        if (import.meta.env.DEV && import.meta.env.VITE_UNLOCK_ALL === 'true') {
          data.unlockAll = true;
        }
        if (!data.quizScores) data.quizScores = {};
        if (!data.passedChecks) data.passedChecks = [];
        if (!data.lastActiveDate)
          data.lastActiveDate = toISODate(new Date());
        if (!data.maxSeenDate) data.maxSeenDate = data.lastActiveDate;

        saveLocalProgress(data, currentUserId);
        return data;
      }
    } catch (e) {}
    return makeDefaultProgress();
  });

  const progressRef = useRef(progress);
  progressRef.current = progress;
  const timerRef = useRef<any>(null);
  const retryIntervalRef = useRef<any>(null);
  const initializedRef = useRef(false);

  const initSync = async () => {
    if (apakahModeLokal()) {
      setSyncStatus('Mode lokal: progres tidak disimpan ke akun');
      return;
    }
    if (!user) return;
    setSyncStatus('Menyimpan...');

    const cloudFetch = await fetchCloudProgress(user.id);
    const localProgress = getLocalProgress(user.id) || makeDefaultProgress();

    if (!cloudFetch.ok) {
      setSyncStatus('Offline, tersimpan di perangkat ini');
      return;
    }

    let newProgress = localProgress;
    if (cloudFetch.data) {
      newProgress = mergeProgress(localProgress, cloudFetch.data);
    }

    setCurrentUserId(user.id);
    setProgress(newProgress);
    saveLocalProgress(newProgress, user.id);

    try {
      await saveCloudProgress(user.id, newProgress);
      setSyncStatus('Tersimpan');
      initializedRef.current = true;
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
        retryIntervalRef.current = null;
      }
    } catch (e) {
      setSyncStatus('Offline, tersimpan di perangkat ini');
    }
  };

  // Sync logic on mount or user login
  useEffect(() => {
    if (apakahModeLokal()) {
      setSyncStatus('Mode lokal: progres tidak disimpan ke akun');
      const currentUserId = user?.id || getCurrentUserId();
      const localProg = getLocalProgress(currentUserId) || makeDefaultProgress();
      setProgress(localProg);
      return;
    }

    if (authLoading) return;
    if (!user) {
      setSyncStatus('Offline, tersimpan di perangkat ini');
      setProgress(makeDefaultProgress());
      initializedRef.current = false;
      setCurrentUserId(null);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);
      return;
    }

    initSync();

    // Auto-retry fetch/sync if failed
    retryIntervalRef.current = setInterval(() => {
      if (!initializedRef.current && user) {
        initSync();
      }
    }, 30000);

    return () => {
      if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);
    };
  }, [user, authLoading]);

  // Debounce save (1s)
  useEffect(() => {
    if (apakahModeLokal() || !user || !initializedRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    setSyncStatus('Menyimpan...');
    timerRef.current = setTimeout(async () => {
      try {
        await saveCloudProgress(user.id, progressRef.current);
        setSyncStatus('Tersimpan');
      } catch (e) {
        setSyncStatus('Offline, tersimpan di perangkat ini');
      }
    }, 1000);

    return () => clearTimeout(timerRef.current);
  }, [progress, user]);

  // Handle visibility & focus
  useEffect(() => {
    if (apakahModeLokal() || !user || !initializedRef.current) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveCloudProgress(user.id, progressRef.current).catch(() => {});
      }
    };

    const handleFocus = async () => {
      if (!initializedRef.current) {
        initSync();
        return;
      }
      try {
        const cloudFetch = await fetchCloudProgress(user.id);
        if (cloudFetch.ok && cloudFetch.data) {
          const merged = mergeProgress(progressRef.current, cloudFetch.data);
          setProgress(merged);
          saveLocalProgress(merged, user.id);
        }
      } catch (e) {}
    };

    const handleOnline = () => {
      if (!initializedRef.current) initSync();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [user]);

  const saveProgressState = (newProgress: UserProgress) => {
    try {
      setProgress(newProgress);
      saveLocalProgress(newProgress, user?.id);
    } catch (e) {}
  };

  const markLessonCompleted = (lessonId: string) => {
    setProgress((prev) => {
      let next = progresSetelahMateri(prev, lessonId);
      if (apakahModeLokal()) {
        next = {
          ...next,
          streak: prev.streak,
          streakDate: prev.streakDate,
        };
      }
      if (next === prev) return prev;
      saveProgressState(next);
      return next;
    });
  };

  const markCheckPassed = (lessonId: string) => {
    setProgress((prev) => {
      if (prev.passedChecks?.includes(lessonId)) return prev;
      const nextProgress = {
        ...prev,
        passedChecks: [...(prev.passedChecks || []), lessonId],
      };
      saveProgressState(nextProgress);
      return nextProgress;
    });
  };

  const touchActivity = () => {
    setProgress((prev) => {
      const today = new Date().toISOString().split('T')[0];
      if (
        prev.lastActiveDate === today &&
        prev.maxSeenDate &&
        prev.maxSeenDate >= today
      )
        return prev;
      const nextProgress = {
        ...prev,
        lastActiveDate: today,
        maxSeenDate:
          prev.maxSeenDate && prev.maxSeenDate > today
            ? prev.maxSeenDate
            : today,
      };
      saveProgressState(nextProgress);
      return nextProgress;
    });
  };

  const importProgress = (data: any) => {
    if (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.completedLessons) &&
      typeof data.xp === 'number' &&
      typeof data.streak === 'number' &&
      typeof data.lastActiveDate === 'string' &&
      data.moduleStatus &&
      typeof data.moduleStatus === 'object'
    ) {
      const today = toISODate(new Date());
      saveProgressState({
        completedLessons: data.completedLessons,
        moduleStatus: data.moduleStatus,
        quizScores: data.quizScores || {},
        xp: data.xp,
        streak: data.streak,
        streakDate: data.streakDate,
        lastActiveDate: data.lastActiveDate,
        maxSeenDate:
          data.maxSeenDate && data.maxSeenDate > today
            ? data.maxSeenDate
            : today,
        version: data.version || 1,
        unlockAll:
          !!data.unlockAll ||
          (import.meta.env.DEV && import.meta.env.VITE_UNLOCK_ALL === 'true'),
        justReset: false,
      });
      return true;
    }

    if (import.meta.env.DEV && import.meta.env.VITE_UNLOCK_ALL === 'true') {
      setProgress((prev) => {
        const next = { ...prev, unlockAll: true };
        saveProgressState(next);
        return next;
      });
    }

    return false;
  };

  const toggleUnlockAll = (enabled: boolean) => {
    setProgress((prev) => {
      const nextProgress = { ...prev, unlockAll: enabled };
      saveProgressState(nextProgress);
      return nextProgress;
    });
  };

  const addXP = (amount: number) => {
    setProgress((prev) => {
      const nextProgress = { ...prev, xp: prev.xp + amount };
      saveProgressState(nextProgress);
      return nextProgress;
    });
  };

  const saveQuizScore = (moduleId: string, score: number, passed: boolean) => {
    setProgress((prev) => {
      const existing = prev.quizScores[moduleId];
      if (!existing || score > existing.score || (!existing.passed && passed)) {
        const nextProgress = {
          ...prev,
          quizScores: {
            ...prev.quizScores,
            [moduleId]: { score, passed },
          },
        };
        saveProgressState(nextProgress);
        return nextProgress;
      }
      return prev;
    });
  };

  const flushKeCloud = async (): Promise<boolean> => {
    if (apakahModeLokal()) return true;
    if (!user || !initializedRef.current) return false;
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      await saveCloudProgress(user.id, progressRef.current);
      setSyncStatus('Tersimpan');
      return true;
    } catch (e) {
      setSyncStatus('Offline, tersimpan di perangkat ini');
      return false;
    }
  };

  const activeUnlockAll = isAdmin ? progress.unlockAll : false;

  return (
    <ProgressContext.Provider
      value={{
        progress: { ...progress, unlockAll: activeUnlockAll },
        markLessonCompleted,
        markCheckPassed,
        importProgress,
        toggleUnlockAll,
        addXP,
        saveQuizScore,
        touchActivity,
        streakHariIni: apakahModeLokal()
          ? 0
          : streakTampil(progress.streak, progress.streakDate, tanggalLokal()),
        flushKeCloud,
        syncStatus,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
