import { supabase } from './supabase';
import type { UserProgress } from '../types/schema';
import { gabungStreak, lengkapiStreak } from './streak';

const BASE_STORAGE_KEY = 'bisangoding_progress';
const CURRENT_USER_KEY = 'bisangoding_current_user';

function getStorageKey(userId?: string | null): string {
  return userId ? `${BASE_STORAGE_KEY}:${userId}` : BASE_STORAGE_KEY;
}

export function getCurrentUserId(): string | null {
  try {
    return localStorage.getItem(CURRENT_USER_KEY);
  } catch (e) {
    return null;
  }
}

export function setCurrentUserId(userId: string | null) {
  try {
    if (userId) {
      localStorage.setItem(CURRENT_USER_KEY, userId);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (e) {}
}

export function getLocalProgress(userId?: string | null): UserProgress | null {
  try {
    const key = getStorageKey(userId);
    const data = localStorage.getItem(key);
    if (data) return lengkapiStreak(JSON.parse(data));
  } catch (e) {
    console.error('Failed to get local progress', e);
  }
  return null;
}

export function saveLocalProgress(progress: UserProgress, userId?: string | null) {
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save local progress', e);
  }
}

export function bersihkanProgresLokal(userId?: string | null) {
  try {
    const key = getStorageKey(userId);
    localStorage.removeItem(key);
    if (userId && getCurrentUserId() === userId) {
      localStorage.removeItem(CURRENT_USER_KEY);
    } else if (!userId) {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(BASE_STORAGE_KEY);
    }
  } catch (e) {}
}

export function mergeProgress(
  local: UserProgress,
  cloud: UserProgress
): UserProgress {
  local = lengkapiStreak(local);
  cloud = lengkapiStreak(cloud);
  // Respect resetAt: if cloud was reset and local data is older than the reset time, cloud wins.
  // We use lastActiveDate (or maxSeenDate) to determine age.
  const cloudResetAt = cloud.resetAt || '';
  const localLastActive = local.lastActiveDate || '';
  
  if (cloudResetAt && localLastActive < cloudResetAt) {
    return cloud;
  }
  
  const localResetAt = local.resetAt || '';
  const cloudLastActive = cloud.lastActiveDate || '';
  
  if (localResetAt && cloudLastActive < localResetAt) {
    return local;
  }

  const completedLessons = Array.from(
    new Set([
      ...(local.completedLessons || []),
      ...(cloud.completedLessons || []),
    ])
  );
  
  const passedChecks = Array.from(
    new Set([
      ...(local.passedChecks || []),
      ...(cloud.passedChecks || []),
    ])
  );

  const xp = Math.max(local.xp || 0, cloud.xp || 0);
  const { streak, streakDate } = gabungStreak(local, cloud);

  const quizScores = { ...(cloud.quizScores || {}) };
  for (const [modId, lScore] of Object.entries(local.quizScores || {})) {
    const cScore = quizScores[modId];
    if (!cScore) {
      quizScores[modId] = lScore;
    } else {
      quizScores[modId] = {
        score: Math.max(lScore.score, cScore.score),
        passed: lScore.passed || cScore.passed,
      };
    }
  }

  const lDate = local.lastActiveDate || '1970-01-01';
  const cDate = cloud.lastActiveDate || '1970-01-01';
  const lastActiveDate = lDate > cDate ? lDate : cDate;

  const lmDate = local.maxSeenDate || lDate;
  const cmDate = cloud.maxSeenDate || cDate;
  const maxSeenDate = lmDate > cmDate ? lmDate : cmDate;
  
  const resetAt = cloudResetAt > localResetAt ? cloudResetAt : localResetAt;

  // We should merge moduleStatus properly too
  const moduleStatus = { ...(cloud.moduleStatus || {}) };
  for (const [modId, lStatus] of Object.entries(local.moduleStatus || {})) {
    if (!moduleStatus[modId] || lStatus === 'completed' || (lStatus === 'unlocked' && moduleStatus[modId] === 'locked')) {
      moduleStatus[modId] = lStatus;
    }
  }

  return {
    ...cloud,
    ...local, // spread local first? NO. Spread cloud first, but then we explicitly overwrite the fields below
    moduleStatus,
    completedLessons,
    passedChecks,
    xp,
    streak,
    streakDate,
    quizScores,
    lastActiveDate,
    maxSeenDate,
    resetAt
  };
}

const timeoutPromise = (ms: number) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms)
  );

export type HasilAmbil =
  | { ok: true; data: UserProgress | null }
  | { ok: false };

export async function fetchCloudProgress(
  userId: string
): Promise<HasilAmbil> {
  if (!supabase) return { ok: false };
  try {
    const fetchPromise = supabase
      .from('progres')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle();
    const result = (await Promise.race([
      fetchPromise,
      timeoutPromise(8000),
    ])) as any;
    
    if (result?.error) {
      console.error('Fetch cloud progress error', result.error);
      return { ok: false };
    }
    
    return { ok: true, data: (result?.data?.data as UserProgress) ?? null };
  } catch (e) {
    console.error('Fetch cloud progress error', e);
    return { ok: false };
  }
}

export async function saveCloudProgress(
  userId: string,
  data: UserProgress
): Promise<void> {
  if (!supabase) return;
  try {
    const savePromise = supabase
      .from('progres')
      .upsert({ user_id: userId, data });
    const result = (await Promise.race([savePromise, timeoutPromise(8000)])) as any;
    if (result?.error) throw result.error;
  } catch (e) {
    console.error('Save cloud progress error', e);
    throw e;
  }
}
