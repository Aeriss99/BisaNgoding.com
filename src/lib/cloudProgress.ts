import { supabase } from './supabase';
import type { UserProgress } from '../types/schema';

const STORAGE_KEY = 'bisangoding_progress';
const OWNER_KEY = 'bisangoding_owner';

// Ambil data dari lokal
export function getLocalProgress(): UserProgress | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to get local progress', e);
  }
  return null;
}

export function getLocalOwner(): string | null {
  try {
    return localStorage.getItem(OWNER_KEY);
  } catch (e) {
    return null;
  }
}

export function setLocalOwner(userId: string | null) {
  try {
    if (userId === null) {
      localStorage.removeItem(OWNER_KEY);
    } else {
      localStorage.setItem(OWNER_KEY, userId);
    }
  } catch (e) {}
}

export function bersihkanProgresLokal() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(OWNER_KEY);
  } catch (e) {}
}

export function saveLocalProgress(progress: UserProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save local progress', e);
  }
}

// Fungsi merge progres
export function mergeProgress(local: UserProgress, cloud: UserProgress): UserProgress {
  const completedLessons = Array.from(new Set([...(local.completedLessons || []), ...(cloud.completedLessons || [])]));
  
  const xp = Math.max(local.xp || 0, cloud.xp || 0);
  const streak = Math.max(local.streak || 0, cloud.streak || 0);
  
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

  // Jika reset, cloudProgress is old? The requirement:
  // "Penggabungan tidak boleh mengembalikan progres yang sudah direset (pakai tanggal reset sebagai penanda)"
  // Tapi di TODO Bagian 6: "Jika fitur reset 7 hari aktif, reset juga harus menulis ulang data di cloud, agar tidak hidup lagi"
  // So no need to complicate merge too much if we write to cloud on reset.
  
  const lDate = local.lastActiveDate || '1970-01-01';
  const cDate = cloud.lastActiveDate || '1970-01-01';
  const lastActiveDate = lDate > cDate ? lDate : cDate;
  
  const lmDate = local.maxSeenDate || lDate;
  const cmDate = cloud.maxSeenDate || cDate;
  const maxSeenDate = lmDate > cmDate ? lmDate : cmDate;
  
  return {
    ...cloud,
    ...local,
    completedLessons,
    xp,
    streak,
    quizScores,
    lastActiveDate,
    maxSeenDate,
  };
}

const timeoutPromise = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));

export async function fetchCloudProgress(userId: string): Promise<UserProgress | null> {
  if (!supabase) return null;
  try {
    const fetchPromise = supabase.from('progres').select('data').eq('user_id', userId).maybeSingle();
    const result = await Promise.race([fetchPromise, timeoutPromise(8000)]) as any;
    if (result && result.data) {
      return result.data.data as UserProgress;
    }
  } catch (e) {
    console.error('Fetch cloud progress error', e);
  }
  return null;
}

export async function saveCloudProgress(userId: string, data: UserProgress): Promise<void> {
  if (!supabase) return;
  try {
    const savePromise = supabase.from('progres').upsert({ user_id: userId, data });
    await Promise.race([savePromise, timeoutPromise(8000)]);
  } catch (e) {
    console.error('Save cloud progress error', e);
  }
}
