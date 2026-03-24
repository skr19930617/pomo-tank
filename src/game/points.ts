// Pomo points calculation system
// No vscode imports — pure computation only.

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const BASE_POINTS = 10;

export const PERFECT_WINDOW_MIN_MS = 20 * 60 * 1000;
export const PERFECT_WINDOW_MAX_MS = 30 * 60 * 1000;

export const GOOD_WINDOW_MIN_MS = 15 * 60 * 1000;
export const GOOD_WINDOW_MAX_MS = 35 * 60 * 1000;

export const MAX_STREAK_MULTIPLIER = 2.0;
export const MAX_DAILY_BONUS = 50;

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Returns the timing-bonus multiplier based on how long since last maintenance.
 *
 *  - [20 min, 30 min] → 1.5  (perfect window)
 *  - [15 min, 35 min] → 1.2  (good window, excluding perfect)
 *  - otherwise         → 1.0
 */
export function calculateTimingBonus(timeSinceLastMaintenanceMs: number): number {
  if (
    timeSinceLastMaintenanceMs >= PERFECT_WINDOW_MIN_MS &&
    timeSinceLastMaintenanceMs <= PERFECT_WINDOW_MAX_MS
  ) {
    return 1.5;
  }

  if (
    timeSinceLastMaintenanceMs >= GOOD_WINDOW_MIN_MS &&
    timeSinceLastMaintenanceMs <= GOOD_WINDOW_MAX_MS
  ) {
    return 1.2;
  }

  return 1.0;
}

/**
 * Returns the streak multiplier: 1.0 + (currentStreak * 0.1), capped at 2.0.
 */
export function calculateStreakMultiplier(currentStreak: number): number {
  return Math.min(1.0 + currentStreak * 0.1, MAX_STREAK_MULTIPLIER);
}

/**
 * Returns the daily continuity bonus: 5 * days, capped at 50.
 */
export function calculateDailyContinuityBonus(dailyContinuityDays: number): number {
  return Math.min(5 * dailyContinuityDays, MAX_DAILY_BONUS);
}

/**
 * Computes all bonuses and returns the final point value with a full breakdown.
 *
 * finalPoints = basePoints * timingBonus * streakMultiplier
 *   (+ dailyContinuityBonus once per day on first maintenance)
 */
export function calculatePoints(
  timeSinceLastMaintenanceMs: number,
  currentStreak: number,
  isFirstMaintenanceToday: boolean,
  dailyContinuityDays: number,
): { points: number; timingBonus: number; streakMultiplier: number; dailyBonus: number } {
  const timingBonus = calculateTimingBonus(timeSinceLastMaintenanceMs);
  const streakMultiplier = calculateStreakMultiplier(currentStreak);
  const dailyBonus = isFirstMaintenanceToday
    ? calculateDailyContinuityBonus(dailyContinuityDays)
    : 0;

  const points = BASE_POINTS * timingBonus * streakMultiplier + dailyBonus;

  return { points, timingBonus, streakMultiplier, dailyBonus };
}

/**
 * Returns true if the timing falls within the 20–30 minute perfect window.
 */
export function isWellTimed(timeSinceLastMaintenanceMs: number): boolean {
  return (
    timeSinceLastMaintenanceMs >= PERFECT_WINDOW_MIN_MS &&
    timeSinceLastMaintenanceMs <= PERFECT_WINDOW_MAX_MS
  );
}

/**
 * Updates the streak: increments if the action was well-timed, resets to 0 otherwise.
 */
export function updateStreak(currentStreak: number, isWellTimedAction: boolean): number {
  return isWellTimedAction ? currentStreak + 1 : 0;
}
