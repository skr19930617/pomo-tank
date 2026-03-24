// ── Deterioration Logic ──
// Pure functions that compute per-tick decay of hunger, water dirtiness, and algae.
// No vscode imports.

import type { GameState, Fish } from "./state";
import { FISH_SPECIES, FILTERS } from "./state";

// ── Balancing Constants ──

export const ACTIVITY_MULTIPLIER = 1.15;
export const BASE_ALGAE_RATE = 0.5;
export const DIRTY_ALGAE_BONUS = 1.5;

// ── Helpers ──

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ── Exported Tick Functions ──

/**
 * Returns a new Fish with hunger advanced by one tick.
 * hungerDelta = species.hungerRate × activityMultiplier
 */
export function applyHungerTick(fish: Fish, isActiveCoding: boolean): Fish {
  const species = FISH_SPECIES[fish.speciesId];
  if (!species) {
    return fish;
  }
  const multiplier = isActiveCoding ? ACTIVITY_MULTIPLIER : 1.0;
  const hungerDelta = species.hungerRate * multiplier;
  const newHunger = clamp(fish.hungerLevel + hungerDelta, 0, 100);
  return { ...fish, hungerLevel: newHunger };
}

/**
 * Returns the new waterDirtiness value after one tick.
 * dirtinessDelta = sum(fish.species.dirtinessLoad) × (1 - filter.efficiency)
 */
export function applyDirtinessTick(
  state: GameState,
  _isActiveCoding: boolean,
): number {
  const totalDirtinessLoad = state.fish.reduce((sum, f) => {
    const species = FISH_SPECIES[f.speciesId];
    return sum + (species ? species.dirtinessLoad : 0);
  }, 0);

  const filterId = state.tank.filterId;
  const filter = filterId ? FILTERS[filterId] : null;
  const filterEfficiency = filter ? filter.efficiency : 0;

  const dirtinessDelta = totalDirtinessLoad * (1 - filterEfficiency);
  return clamp(state.tank.waterDirtiness + dirtinessDelta, 0, 100);
}

/**
 * Returns the new algaeLevel value after one tick.
 * algaeDelta = baseAlgaeRate + (waterDirtiness / 100) × dirtyAlgaeBonus
 */
export function applyAlgaeTick(state: GameState): number {
  const algaeDelta =
    BASE_ALGAE_RATE +
    (state.tank.waterDirtiness / 100) * DIRTY_ALGAE_BONUS;
  return clamp(state.tank.algaeLevel + algaeDelta, 0, 100);
}

/**
 * Applies all deterioration (hunger, dirtiness, algae) for one tick.
 * Returns a new GameState with all values clamped to 0–100.
 */
export function applyTick(
  state: GameState,
  isActiveCoding: boolean,
): GameState {
  const newFish = state.fish.map((f) => applyHungerTick(f, isActiveCoding));
  const newWaterDirtiness = applyDirtinessTick(state, isActiveCoding);
  const newAlgaeLevel = applyAlgaeTick(state);

  return {
    ...state,
    fish: newFish,
    tank: {
      ...state.tank,
      waterDirtiness: newWaterDirtiness,
      algaeLevel: newAlgaeLevel,
    },
  };
}
