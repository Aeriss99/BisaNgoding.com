import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProgress } from '../types/schema';
import { checkInactivityReset, isImportTooOld, toISODate } from '../lib/resetLogic';

interface ProgressContextType {
  progress: UserProgress;
  markLessonCompleted: (lessonId: string) => void;
  importProgress: (data: any) => boolean;
  toggleUnlockAll: (enabled: boolean) => void;
  addXP: (amount: number) => void;
  saveQuizScore: (moduleId: string, score: number, passed: boolean) => void;
  touchActivity: () => void;
  inactiveDaysConfig: number;
  daysUntilReset: number | null;
}

const ProgressContext = createContext<ProgressContextType | null>(null);

const STORAGE_KEY = 'bisangoding_progress';

function getInactiveDaysConfig(): number {
  const raw = import.meta.env.VITE_INACTIVE_DAYS;
  const parsed = raw !== undefined ? parseInt(String(raw), 10) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function makeDefaultProgress(): UserProgress {
  const today = new Date().toISOString().split('T')[0];
  return {
    completedLessons: [],
    moduleStatus: { 'dasar': 'unlocked' },
    quizScores: {},
    xp: 0,
    streak: 0,
    lastActiveDate: today,
    maxSeenDate: today,
    version: 1,
    unlockAll: import.meta.env.VITE_UNLOCK_ALL === 'true'
  };
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [daysUntilReset, setDaysUntilReset] = useState<number | null>(null);
  const inactiveDaysConfig = getInactiveDaysConfig();

  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (import.meta.env.VITE_UNLOCK_ALL === 'true') {
          parsed.unlockAll = true;
        }
        if (!parsed.quizScores) parsed.quizScores = {};
        if (!parsed.lastActiveDate) parsed.lastActiveDate = toISODate(new Date());
        if (!parsed.maxSeenDate) parsed.maxSeenDate = parsed.lastActiveDate;

        // Bagian 5 — Reset otomatis karena tidak aktif (anti-akal jam)
        const result = checkInactivityReset(parsed, new Date(), inactiveDaysConfig, makeDefaultProgress);
        if (result.wasReset) {
          const resetProgress = { ...result.progress, justReset: true };
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(resetProgress)); } catch (e) {}
          return resetProgress;
        }
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(result.progress)); } catch (e) {}
        return result.progress;
      }
    } catch (e) {
      console.error('Failed to parse progress', e);
    }
    return makeDefaultProgress();
  });

  useEffect(() => {
    if (!inactiveDaysConfig) {
      setDaysUntilReset(null);
      return;
    }
    const result = checkInactivityReset(progress, new Date(), inactiveDaysConfig, makeDefaultProgress);
    setDaysUntilReset(result.daysUntilReset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProgress = (newProgress: UserProgress) => {
    try {
      setProgress(newProgress);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
    } catch (e) {
      console.error('Failed to save progress', e);
    }
  };

  const markLessonCompleted = (lessonId: string) => {
    setProgress((prev) => {
      if (prev.completedLessons.includes(lessonId)) return prev;

      let newStreak = prev.streak;
      const today = new Date().toISOString().split('T')[0];
      
      if (prev.lastActiveDate !== today) {
        const lastActive = new Date(prev.lastActiveDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastActive.getTime()) / (1000 * 3600 * 24));
        
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
        xp: prev.xp + 10,
        streak: newStreak,
        lastActiveDate: today,
        maxSeenDate: prev.maxSeenDate && prev.maxSeenDate > today ? prev.maxSeenDate : today,
        justReset: false
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgress));
      } catch (e) {}

      return nextProgress;
    });
  };

  /**
   * Menyentuh lastActiveDate/maxSeenDate tanpa menyelesaikan pelajaran.
   * Dipanggil setiap kali user menyelesaikan sebuah kartu.
   */
  const touchActivity = () => {
    setProgress((prev) => {
      const today = new Date().toISOString().split('T')[0];
      if (prev.lastActiveDate === today && prev.maxSeenDate && prev.maxSeenDate >= today) return prev;
      const nextProgress = {
        ...prev,
        lastActiveDate: today,
        maxSeenDate: prev.maxSeenDate && prev.maxSeenDate > today ? prev.maxSeenDate : today,
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgress)); } catch (e) {}
      return nextProgress;
    });
  };

  const importProgress = (data: any) => {
    // Strict validation
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
      // Bagian 5 — Tolak import jika lastActiveDate sudah lewat batas hari tidak aktif
      if (isImportTooOld(data.lastActiveDate, new Date(), progress.maxSeenDate, inactiveDaysConfig)) {
        return false;
      }

      const today = toISODate(new Date());
      saveProgress({
        completedLessons: data.completedLessons,
        moduleStatus: data.moduleStatus,
        quizScores: data.quizScores || {},
        xp: data.xp,
        streak: data.streak,
        lastActiveDate: data.lastActiveDate,
        maxSeenDate: data.maxSeenDate && data.maxSeenDate > today ? data.maxSeenDate : today,
        version: data.version || 1,
        unlockAll: !!data.unlockAll || import.meta.env.VITE_UNLOCK_ALL === 'true',
        justReset: false
      });
      return true;
    }
    
    // If no saved progress, check VITE_UNLOCK_ALL
    if (import.meta.env.VITE_UNLOCK_ALL === 'true') {
      setProgress(prev => ({ ...prev, unlockAll: true }));
    }
    
    return false;
  };

  const toggleUnlockAll = (enabled: boolean) => {
    setProgress((prev) => {
      const nextProgress = { ...prev, unlockAll: enabled };
      saveProgress(nextProgress);
      return nextProgress;
    });
  };

  const addXP = (amount: number) => {
    setProgress((prev) => {
      const nextProgress = { ...prev, xp: prev.xp + amount };
      saveProgress(nextProgress);
      return nextProgress;
    });
  };

  const saveQuizScore = (moduleId: string, score: number, passed: boolean) => {
    setProgress((prev) => {
      const existing = prev.quizScores[moduleId];
      // Keep highest score, or override if previously failed and now passed
      if (!existing || score > existing.score || (!existing.passed && passed)) {
        const nextProgress = {
          ...prev,
          quizScores: {
            ...prev.quizScores,
            [moduleId]: { score, passed }
          }
        };
        saveProgress(nextProgress);
        return nextProgress;
      }
      return prev;
    });
  };

  return (
    <ProgressContext.Provider value={{ progress, markLessonCompleted, importProgress, toggleUnlockAll, addXP, saveQuizScore, touchActivity, inactiveDaysConfig, daysUntilReset }}>
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
