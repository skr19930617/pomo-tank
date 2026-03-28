// ── Game Constants ──
// Centralised gameplay and business-rule constants.
// UI spacing, animation timings, and array indices are NOT included here.

// ── Fish Health Thresholds (in ticks, where 1 tick ≈ 60 seconds) ──
export const HEALTH_WARNING_THRESHOLD = 120; // ~2 hours
export const HEALTH_SICK_THRESHOLD = 300; // ~5 hours
export const HEALTH_DEAD_THRESHOLD = 540; // ~9 hours
export const HEALTH_RECOVERY_RATE = 2; // sicknessTick decrease per tick when conditions good

// ── Fish Health Condition Thresholds ──
export const POOR_HUNGER_THRESHOLD = 70;
export const POOR_WATER_DIRTINESS_THRESHOLD = 70;
export const POOR_ALGAE_THRESHOLD = 80;

// ── Tank Health Action Thresholds ──
export const TANK_HEALTHY_THRESHOLD = 10;

// ── Maintenance Effects ──
export const FEED_REDUCTION = 60;
export const WATER_CHANGE_DIRTINESS_REDUCTION = 50;
export const WATER_CHANGE_ALGAE_REDUCTION = 10;

// ── Pomo Points ──
export const BASE_POINTS = 10;
export const MAX_STREAK_MULTIPLIER = 2.0;
export const STREAK_INCREMENT = 0.1;
export const MAX_DAILY_BONUS = 50;
export const DAILY_BONUS_PER_DAY = 5;
export const PERFECT_TIMING_BONUS = 1.5;
export const GOOD_TIMING_BONUS = 1.2;
export const PERFECT_WINDOW_LOW = 0.8;
export const PERFECT_WINDOW_HIGH = 1.2;
export const GOOD_WINDOW_LOW = 0.6;
export const GOOD_WINDOW_HIGH = 1.4;

// ── Offline Catch-Up ──
export const MAX_OFFLINE_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── Tick Multiplier Limits (debug) ──
export const TICK_MULTIPLIER_MIN = 1;
export const TICK_MULTIPLIER_MAX = 100;

// ── Fish Name Constraints ──
export const FISH_NAME_MAX_LENGTH = 20;

// ── Deterioration Balancing ──
export const BASE_ALGAE_RATE_FACTOR = 5; // Algae threshold reached in 5 pomo sessions
export const WATER_RATE_FACTOR = 3; // Water threshold reached in 3 pomo sessions
export const HUNGER_RATE_FACTOR = 1; // Hunger threshold reached in 1 pomo session
export const DIRTY_ALGAE_BONUS = 1.5; // Extra algae rate when water is dirty

// ── Break Window (session-relative) ──
export const BREAK_WINDOW_LOW = 0.8;
export const BREAK_WINDOW_HIGH = 1.2;
