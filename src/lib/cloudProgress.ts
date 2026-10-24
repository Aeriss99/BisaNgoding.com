import { supabase } from './supabase';
import type { UserProgress } from '../types/schema';
import { gabungStreak, lengkapiStreak } from './streak';
import { apakahModeLokal } from './modeLokal';

const BASE_STORAGE_KEY = 'bisangoding_progress';
const CURRENT_USER_KEY = 'bisangoding_current_user';

export function getStorageKey(userId?: string | null): string {
  const base = apakahModeLokal() ? 'bisangoding_progress_lokal' : BASE_STORAGE_KEY;
  return userId ? `${base}:${userId}` : base;
}

export function getCurrentUserId(): string | null {
  try {
    const key = apakahModeLokal() ? 'bisangoding_current_user_lokal' : CURRENT_USER_KEY;
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

export function setCurrentUserId(userId: string | null) {
  try {
    const key = apakahModeLokal() ? 'bisangoding_current_user_lokal' : CURRENT_USER_KEY;
    if (userId) {
      localStorage.setItem(key, userId);
    } else {
      localStorage.removeItem(key);
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

export function samaIsi(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
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
  if (apakahModeLokal() || !supabase) return { ok: false };
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
): Promise<UserProgress> {
  if (apakahModeLokal() || !supabase) return data;
  const client = supabase;

  const doSave = async (): Promise<UserProgress> => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      // 1. Ambil data cloud sekarang beserta kolom diperbarui
      const fetchRes = (await client
        .from('progres')
        .select('data, diperbarui')
        .eq('user_id', userId)
        .maybeSingle()) as any;

      if (fetchRes?.error) {
        console.error('Save cloud progress - fetch error', fetchRes.error);
        throw fetchRes.error;
      }

      const row = fetchRes?.data;
      const cloudData = (row?.data as UserProgress) || null;
      const diperbaruiLama = row?.diperbarui;

      // 2. Gabungkan dengan mergeProgress(data, cloud) yang sudah ada
      const finalData = cloudData ? mergeProgress(data, cloudData) : data;

      // 3. Simpan hanya kalau diperbarui di cloud belum berubah
      if (row && diperbaruiLama) {
        const updateRes = (await client
          .from('progres')
          .update({ data: finalData })
          .eq('user_id', userId)
          .eq('diperbarui', diperbaruiLama)
          .select('user_id')) as any;

        if (updateRes?.error) {
          console.error('Save cloud progress - update error', updateRes.error);
          throw updateRes.error;
        }

        // Kalau ada yang menyimpan duluan (0 baris ter-update), ulangi dari langkah 1
        if (!updateRes?.data || updateRes.data.length === 0) {
          continue;
        }

        return finalData;
      } else {
        const insertRes = (await client
          .from('progres')
          .insert({ user_id: userId, data: finalData })) as any;

        if (insertRes?.error) {
          console.warn('Save cloud progress - insert conflict, retrying', insertRes.error);
          continue;
        }

        return finalData;
      }
    }

    throw new Error('Gagal menyimpan ke cloud setelah 3 percobaan bentrok');
  };

  try {
    const result = (await Promise.race([doSave(), timeoutPromise(8000)])) as UserProgress;
    return result;
  } catch (e) {
    console.error('Save cloud progress error', e);
    throw e;
  }
}

export function catatRiwayatStreak(
  userId: string | undefined | null,
  streakLama: number | undefined,
  tanggalLama: string | undefined,
  streakBaru: number | undefined,
  tanggalBaru: string | undefined,
  sebab: string
): void {
  if (apakahModeLokal() || !supabase || !userId) return;
  const client = supabase;
  const versiApp = typeof __VERSI_APP__ !== 'undefined' ? __VERSI_APP__ : 'lokal';
  try {
    const res = client.from('riwayat_streak');
    if (res && typeof (res as any).insert === 'function') {
      const p = (res as any).insert({
        user_id: userId,
        streak_lama: streakLama ?? null,
        tanggal_lama: tanggalLama ?? null,
        streak_baru: streakBaru ?? null,
        tanggal_baru: tanggalBaru ?? null,
        sebab,
        versi_app: versiApp,
      });
      if (p) {
        Promise.resolve(p).catch(() => {});
      }
    }
  } catch {}
}
