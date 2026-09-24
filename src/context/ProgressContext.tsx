import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react';
import type { UserProgress } from '../types/schema';
import {
  checkInactivityReset,
  isImportTooOld,
  toISODate,
} from '../lib/resetLogic';
import { useAuth } from './AuthContext';
import {
  getLocalProgress,
  saveLocalProgress,
  mergeProgress,
  fetchCloudProgress,
  saveCloudProgress,
  getCurrentUserId,
  setCurrentUserId,
} from '../lib/cloudProgress';

interface ProgressContextType {
  progress: UserProgress;
  markLessonCompleted: (lessonId: string) => void;
  markCheckPassed: (lessonId: string) => void;
  importProgress: (data: any) => boolean;
  toggleUnlockAll: (enabled: boolean) => void;
  addXP: (amount: number) => void;
  saveQuizScore: (moduleId: string, score: number, passed: boolean) => void;
  touchActivity: () => void;
  inactiveDaysConfig: number;
  daysUntilReset: number | null;
  syncStatus:
    'Tersimpan' | 'Menyimpan...' | 'Offline, tersimpan di perangkat ini';
}

const ProgressContext = createContext<ProgressContextType | null>(null);

function getInactiveDaysConfig(): number {
  const raw = import.meta.env.VITE_INACTIVE_DAYS;
  const parsed = raw !== undefined ? parseInt(String(raw), 10) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

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
  const [daysUntilReset, setDaysUntilReset] = useState<number | null>(null);
  const inactiveDaysConfig = getInactiveDaysConfig();
  const [syncStatus, setSyncStatus] = useState<
    'Tersimpan' | 'Menyimpan...' | 'Offline, tersimpan di perangkat ini'
  >('Offline, tersimpan di perangkat ini');

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

        const result = checkInactivityReset(
          data,
          new Date(),
          inactiveDaysConfig,
          makeDefaultProgress
        );
        if (result.wasReset) {
          const resetProgress = { ...result.progress, justReset: true };
          saveLocalProgress(resetProgress, currentUserId);
          return resetProgress;
        }
        saveLocalProgress(result.progress, currentUserId);
        return result.progress;
      }
    } catch (e) {}
    return makeDefaultProgress();
  });

  const progressRef = useRef(progress);
  progressRef.current = progress;
  const timerRef = useRef<any>(null);
  const initializedRef = useRef(false);

  // Sync logic on mount or user login
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setSyncStatus('Offline, tersimpan di perangkat ini');
      return;
    }

    const initSync = async () => {
      setSyncStatus('Menyimpan...');

      const cloudProgress = await fetchCloudProgress(user.id);
      const localProgress = getLocalProgress(user.id) || makeDefaultProgress();
      
      let newProgress = localProgress;

      if (cloudProgress) {
        newProgress = mergeProgress(localProgress, cloudProgress);
      }

      setCurrentUserId(user.id);
      setProgress(newProgress);
      saveLocalProgress(newProgress, user.id);

      try {
        await saveCloudProgress(user.id, newProgress);
        setSyncStatus('Tersimpan');
      } catch (e) {
        setSyncStatus('Offline, tersimpan di perangkat ini');
      }
      initializedRef.current = true;
    };

    initSync();
  }, [user, authLoading]);

  // Debounce save (1s)
  useEffect(() => {
    if (!user || !initializedRef.current) return;
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
    if (!user || !initializedRef.current) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveCloudProgress(user.id, progressRef.current).catch(() => {});
      }
    };
    
    const handleFocus = async () => {
      try {
        const cloudProgress = await fetchCloudProgress(user.id);
        if (cloudProgress) {
          const merged = mergeProgress(progressRef.current, cloudProgress);
          setProgress(merged);
          saveLocalProgress(merged, user.id);
        }
      } catch (e) {}
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  useEffect(() => {
    if (!inactiveDaysConfig) {
      setDaysUntilReset(null);
      return;
    }
    const result = checkInactivityReset(
      progress,
      new Date(),
      inactiveDaysConfig,
      makeDefaultProgress
    );
    setDaysUntilReset(result.daysUntilReset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProgressState = (newProgress: UserProgress) => {
    try {
      setProgress(newProgress);
      saveLocalProgress(newProgress, user?.id);
    } catch (e) {}
  };

  const markLessonCompleted = (lessonId: string) => {
    setProgress((prev) => {
      if (prev.completedLessons.includes(lessonId)) return prev;

      let newStreak = prev.streak;
      const today = new Date().toISOString().split('T')[0];

      if (prev.lastActiveDate !== today) {
        const lastActive = new Date(prev.lastActiveDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor(
          (todayDate.getTime() - lastActive.getTime()) / (1000 * 3600 * 24)
        );

        if (diffDays === 1) {
          newStreak += 1; // Consecutive day
        } else if (diffDays > 1) {
          newStreak = 1; // Missed a day
        }
      } else if (prev.streak === 0) {
        newStreak = 1; // First day
      }

      const nextProgress = {
        ...prev,
        completedLessons: [...prev.completedLessons, lessonId],
        passedChecks: Array.from(
          new Set([...(prev.passedChecks || []), lessonId])
        ), // Auto pass if completed
        xp: prev.xp + 10,
        streak: newStreak,
        lastActiveDate: today,
        maxSeenDate:
          prev.maxSeenDate && prev.maxSeenDate > today
            ? prev.maxSeenDate
            : today,
        justReset: false,
      };

      saveProgressState(nextProgress);
      return nextProgress;
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
      if (
        isImportTooOld(
          data.lastActiveDate,
          new Date(),
          progress.maxSeenDate,
          inactiveDaysConfig
        )
      ) {
        return false;
      }

      const today = toISODate(new Date());
      saveProgressState({
        completedLessons: data.completedLessons,
        moduleStatus: data.moduleStatus,
        quizScores: data.quizScores || {},
        xp: data.xp,
        streak: data.streak,
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
        inactiveDaysConfig,
        daysUntilReset,
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
