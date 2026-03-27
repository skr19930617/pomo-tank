// Pomo points calculation system
// No vscode imports — pure computation only.

import { DEFAULT_SESSION_MINUTES } from './state';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const BASE_POINTS = 10;

export const MAX_STREAK_MULTIPLIER = 2.0;
export const MAX_DAILY_BONUS = 50;

// ---------------------------------------------------------------------------
// Session-relative timing windows
// ---------------------------------------------------------------------------

function getPerfectWindowMs(sessionMinutes: number): { min: number; max: number } {
  const sessionMs = sessionMinutes * 60 * 1000;
  return { min: sessionMs * 0.8, max: sessionMs * 1.2 };
}

function getGoodWindowMs(sessionMinutes: number): { min: number; max: number } {
  const sessionMs = sessionMinutes * 60 * 1000;
  return { min: sessionMs * 0.6, max: sessionMs * 1.4 };
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Returns the timing-bonus multiplier based on how long since last maintenance.
 * Windows are relative to configured session duration:
 *  - [0.8×session, 1.2×session] → 1.5  (perfect window)
 *  - [0.6×session, 1.4×session] → 1.2  (good window, excluding perfect)
 *  - otherwise                   → 1.0
 */
export function calculateTimingBonus(
  timeSinceLastMaintenanceMs: number,
  sessionMinutes: number = DEFAULT_SESSION_MINUTES,
): number {
  const perfect = getPerfectWindowMs(sessionMinutes);
  if (timeSinceLastMaintenanceMs >= perfect.min && timeSinceLastMaintenanceMs <= perfect.max) {
    return 1.5;
  }

  const good = getGoodWindowMs(sessionMinutes);
  if (timeSinceLastMaintenanceMs >= good.min && timeSinceLastMaintenanceMs <= good.max) {
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
  sessionMinutes: number = DEFAULT_SESSION_MINUTES,
): { points: number; timingBonus: number; streakMultiplier: number; dailyBonus: number } {
  const timingBonus = calculateTimingBonus(timeSinceLastMaintenanceMs, sessionMinutes);
  const streakMultiplier = calculateStreakMultiplier(currentStreak);
  const dailyBonus = isFirstMaintenanceToday
    ? calculateDailyContinuityBonus(dailyContinuityDays)
    : 0;

  const points = BASE_POINTS * timingBonus * streakMultiplier + dailyBonus;

  return { points, timingBonus, streakMultiplier, dailyBonus };
}

/**
 * Returns true if the timing falls within the perfect window (session-relative).
 */
export function isWellTimed(
  timeSinceLastMaintenanceMs: number,
  sessionMinutes: number = DEFAULT_SESSION_MINUTES,
): boolean {
  const perfect = getPerfectWindowMs(sessionMinutes);
  return timeSinceLastMaintenanceMs >= perfect.min && timeSinceLastMaintenanceMs <= perfect.max;
}

/**
 * Updates the streak: increments if the action was well-timed, resets to 0 otherwise.
 */
export function updateStreak(currentStreak: number, isWellTimedAction: boolean): number {
  return isWellTimedAction ? currentStreak + 1 : 0;
}
