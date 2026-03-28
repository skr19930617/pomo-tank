// Pomo points calculation system
// No vscode imports — pure computation only.

import { DEFAULT_SESSION_MINUTES } from './state';
import {
  BASE_POINTS,
  MAX_STREAK_MULTIPLIER,
  MAX_DAILY_BONUS,
  DAILY_BONUS_PER_DAY,
  STREAK_INCREMENT,
  PERFECT_TIMING_BONUS,
  GOOD_TIMING_BONUS,
  PERFECT_WINDOW_LOW,
  PERFECT_WINDOW_HIGH,
  GOOD_WINDOW_LOW,
  GOOD_WINDOW_HIGH,
} from './constants';

export { BASE_POINTS, MAX_STREAK_MULTIPLIER, MAX_DAILY_BONUS };

// ---------------------------------------------------------------------------
// Session-relative timing windows
// ---------------------------------------------------------------------------

function getPerfectWindowMs(sessionMinutes: number): { min: number; max: number } {
  const sessionMs = sessionMinutes * 60 * 1000;
  return { min: sessionMs * PERFECT_WINDOW_LOW, max: sessionMs * PERFECT_WINDOW_HIGH };
}

function getGoodWindowMs(sessionMinutes: number): { min: number; max: number } {
  const sessionMs = sessionMinutes * 60 * 1000;
  return { min: sessionMs * GOOD_WINDOW_LOW, max: sessionMs * GOOD_WINDOW_HIGH };
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
    return PERFECT_TIMING_BONUS;
  }

  const good = getGoodWindowMs(sessionMinutes);
  if (timeSinceLastMaintenanceMs >= good.min && timeSinceLastMaintenanceMs <= good.max) {
    return GOOD_TIMING_BONUS;
  }

  return 1.0;
}

/**
 * Returns the streak multiplier: 1.0 + (currentStreak * 0.1), capped at 2.0.
 */
export function calculateStreakMultiplier(currentStreak: number): number {
  return Math.min(1.0 + currentStreak * STREAK_INCREMENT, MAX_STREAK_MULTIPLIER);
}

/**
 * Returns the daily continuity bonus: 5 * days, capped at 50.
 */
export function calculateDailyContinuityBonus(dailyContinuityDays: number): number {
  return Math.min(DAILY_BONUS_PER_DAY * dailyContinuityDays, MAX_DAILY_BONUS);
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
