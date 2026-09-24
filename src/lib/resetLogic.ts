export function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function daysBetweenISO(laterISO: string, earlierISO: string): number {
  const later = new Date(laterISO + 'T00:00:00Z');
  const earlier = new Date(earlierISO + 'T00:00:00Z');
  const diffMs = later.getTime() - earlier.getTime();
  return Math.floor(diffMs / (1000 * 3600 * 24));
}

export function computeEffectiveToday(
  nowISO: string,
  maxSeenDate?: string
): string {
  if (!maxSeenDate) return nowISO;
  return nowISO > maxSeenDate ? nowISO : maxSeenDate;
}

export interface ResetCheckResult<T> {
  progress: T;
  wasReset: boolean;
  daysUntilReset: number | null;
  effectiveToday: string;
}

/**
 * Checks if the progress should be reset due to inactivity.
 * Uses `maxSeenDate` to defend against the device clock being turned
 * backwards to avoid a streak/inactivity reset.
 */
export function checkInactivityReset<
  T extends { lastActiveDate: string; maxSeenDate?: string },
>(
  progress: T,
  now: Date,
  inactiveDays: number,
  makeDefault: () => T
): ResetCheckResult<T> {
  const nowISO = toISODate(now);
  const effectiveToday = computeEffectiveToday(nowISO, progress.maxSeenDate);

  if (!inactiveDays || inactiveDays <= 0) {
    return {
      progress: { ...progress, maxSeenDate: effectiveToday },
      wasReset: false,
      daysUntilReset: null,
      effectiveToday,
    };
  }

  const daysSinceActive = daysBetweenISO(
    effectiveToday,
    progress.lastActiveDate
  );

  if (daysSinceActive >= inactiveDays) {
    const fresh = makeDefault();
    return {
      progress: {
        ...fresh,
        lastActiveDate: effectiveToday,
        maxSeenDate: effectiveToday,
      },
      wasReset: true,
      daysUntilReset: inactiveDays,
      effectiveToday,
    };
  }

  const daysUntilReset = inactiveDays - daysSinceActive;
  return {
    progress: { ...progress, maxSeenDate: effectiveToday },
    wasReset: false,
    daysUntilReset,
    effectiveToday,
  };
}

/**
 * Determines whether an imported progress file is already too old to be
 * accepted (its lastActiveDate is beyond the inactivity threshold, computed
 * against the current effective "today" so a rolled-back clock can't help).
 */
export function isImportTooOld(
  lastActiveDate: string,
  now: Date,
  maxSeenDate: string | undefined,
  inactiveDays: number
): boolean {
  if (!inactiveDays || inactiveDays <= 0) return false;
  const nowISO = toISODate(now);
  const effectiveToday = computeEffectiveToday(nowISO, maxSeenDate);
  const daysSinceActive = daysBetweenISO(effectiveToday, lastActiveDate);
  return daysSinceActive >= inactiveDays;
}
