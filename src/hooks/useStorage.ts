import { useState, useEffect } from 'react';
import type { UserProgress } from '../types/schema';

const STORAGE_KEY = 'bisangoding_progress';

const defaultProgress: UserProgress = {
  completedLessons: [],
  moduleStatus: { 'java-dasar': 'unlocked' },
  xp: 0,
  streak: 0,
  lastActiveDate: new Date().toISOString().split('T')[0]
};

export function useStorage() {
  const [progress, setProgress] = useState<UserProgress>(defaultProgress);

  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setProgress(JSON.parse(data));
      }
    } catch (e) {
      console.error('Failed to parse progress', e);
    }
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
    if (!progress.completedLessons.includes(lessonId)) {
      const newProgress = {
        ...progress,
        completedLessons: [...progress.completedLessons, lessonId],
        xp: progress.xp + 10 // Mock XP
      };
      saveProgress(newProgress);
    }
  };

  return { progress, saveProgress, markLessonCompleted };
}
