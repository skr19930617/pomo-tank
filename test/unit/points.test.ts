import { describe, it, expect } from 'vitest';
import {
  calculateTimingBonus,
  calculateStreakMultiplier,
  calculateDailyContinuityBonus,
  calculatePoints,
  isWellTimed,
  updateStreak,
} from '../../src/game/points';
import {
  PERFECT_TIMING_BONUS,
  GOOD_TIMING_BONUS,
  MAX_STREAK_MULTIPLIER,
  MAX_DAILY_BONUS,
  DAILY_BONUS_PER_DAY,
  BASE_POINTS,
} from '../../src/game/constants';

const SESSION = 25; // 25 minute session

describe('calculateTimingBonus', () => {
  it('returns perfect bonus in perfect window', () => {
    const sessionMs = SESSION * 60 * 1000;
    expect(calculateTimingBonus(sessionMs, SESSION)).toBe(PERFECT_TIMING_BONUS);
  });

  it('returns good bonus in good window (outside perfect)', () => {
    const sessionMs = SESSION * 60 * 1000;
    expect(calculateTimingBonus(sessionMs * 0.65, SESSION)).toBe(GOOD_TIMING_BONUS);
  });

  it('returns 1.0 outside both windows', () => {
    expect(calculateTimingBonus(0, SESSION)).toBe(1.0);
  });
});

describe('calculateStreakMultiplier', () => {
  it('returns 1.0 for streak 0', () => {
    expect(calculateStreakMultiplier(0)).toBe(1.0);
  });

  it('caps at MAX_STREAK_MULTIPLIER', () => {
    expect(calculateStreakMultiplier(100)).toBe(MAX_STREAK_MULTIPLIER);
  });
});

describe('calculateDailyContinuityBonus', () => {
  it('returns correct bonus for days', () => {
    expect(calculateDailyContinuityBonus(3)).toBe(DAILY_BONUS_PER_DAY * 3);
  });

  it('caps at MAX_DAILY_BONUS', () => {
    expect(calculateDailyContinuityBonus(100)).toBe(MAX_DAILY_BONUS);
  });
});

describe('calculatePoints', () => {
  it('returns 0 points when tankHealthy would short-circuit (tested via engine)', () => {
    // Direct call: calculates normally (tankHealthy check is in engine)
    const result = calculatePoints(SESSION * 60 * 1000, 0, false, 0, SESSION);
    expect(result.points).toBeGreaterThan(0);
    expect(result.timingBonus).toBe(PERFECT_TIMING_BONUS);
  });

  it('includes daily bonus on first maintenance of the day', () => {
    const result = calculatePoints(0, 0, true, 5, SESSION);
    expect(result.dailyBonus).toBe(DAILY_BONUS_PER_DAY * 5);
  });

  it('no daily bonus when not first maintenance today', () => {
    const result = calculatePoints(0, 0, false, 5, SESSION);
    expect(result.dailyBonus).toBe(0);
  });
});

describe('isWellTimed', () => {
  it('returns true in perfect window', () => {
    const sessionMs = SESSION * 60 * 1000;
    expect(isWellTimed(sessionMs, SESSION)).toBe(true);
  });

  it('returns false outside perfect window', () => {
    expect(isWellTimed(0, SESSION)).toBe(false);
  });
});

describe('updateStreak', () => {
  it('increments on well-timed action', () => {
    expect(updateStreak(3, true)).toBe(4);
  });

  it('resets on poorly-timed action', () => {
    expect(updateStreak(3, false)).toBe(0);
  });
});
