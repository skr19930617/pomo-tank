// ── Deterioration Logic ──
// Pure functions that compute per-tick decay of hunger, water dirtiness, and algae.
// All rates are tank-wide and fixed, derived from the configured session duration.
// No vscode imports.

import type { GameState } from './state';
import { DETERIORATION_THRESHOLD, DEFAULT_SESSION_MINUTES } from './state';

// ── Balancing Constants ──

export const BASE_ALGAE_RATE_FACTOR = 5; // Algae threshold reached in 5 pomo sessions
export const WATER_RATE_FACTOR = 3; // Water threshold reached in 3 pomo sessions
export const HUNGER_RATE_FACTOR = 1; // Hunger threshold reached in 1 pomo session
export const DIRTY_ALGAE_BONUS = 1.5; // Extra algae rate when water is dirty

// ── Helpers ──

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ── Exported Tick Functions ──

/**
 * Computes the per-tick hunger rate based on session duration.
 * Hunger reaches DETERIORATION_THRESHOLD in 1 pomo session.
 */
export function getHungerRate(sessionMinutes: number): number {
  return DETERIORATION_THRESHOLD / (HUNGER_RATE_FACTOR * sessionMinutes);
}

/**
 * Computes the per-tick water dirtiness rate based on session duration.
 * Water reaches DETERIORATION_THRESHOLD in 3 pomo sessions.
 */
export function getWaterRate(sessionMinutes: number): number {
  return DETERIORATION_THRESHOLD / (WATER_RATE_FACTOR * sessionMinutes);
}

/**
 * Computes the base per-tick algae rate based on session duration.
 * Algae reaches DETERIORATION_THRESHOLD in 5 pomo sessions (before water bonus).
 */
export function getAlgaeRate(sessionMinutes: number): number {
  return DETERIORATION_THRESHOLD / (BASE_ALGAE_RATE_FACTOR * sessionMinutes);
}

/**
 * Applies all deterioration (hunger, dirtiness, algae) for one tick.
 * All rates are tank-wide and fixed — they do not depend on fish count or species.
 * Returns a new GameState with all values clamped to 0–100.
 */
export function applyTick(
  state: GameState,
  _isActiveCoding: boolean,
  sessionMinutes: number = DEFAULT_SESSION_MINUTES,
): GameState {
  const hungerDelta = getHungerRate(sessionMinutes);
  const waterDelta = getWaterRate(sessionMinutes);
  const baseAlgaeDelta = getAlgaeRate(sessionMinutes);
  const algaeDelta = baseAlgaeDelta + (state.tank.waterDirtiness / 100) * DIRTY_ALGAE_BONUS;

  return {
    ...state,
    tank: {
      ...state.tank,
      hungerLevel: clamp(state.tank.hungerLevel + hungerDelta, 0, 100),
      waterDirtiness: clamp(state.tank.waterDirtiness + waterDelta, 0, 100),
      algaeLevel: clamp(state.tank.algaeLevel + algaeDelta, 0, 100),
    },
  };
}
