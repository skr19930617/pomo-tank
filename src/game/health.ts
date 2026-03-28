import { type Fish, HealthState, type GameState } from './state';
import {
  HEALTH_WARNING_THRESHOLD,
  HEALTH_SICK_THRESHOLD,
  HEALTH_DEAD_THRESHOLD,
  HEALTH_RECOVERY_RATE,
  POOR_HUNGER_THRESHOLD,
  POOR_WATER_DIRTINESS_THRESHOLD,
  POOR_ALGAE_THRESHOLD,
} from './constants';

/**
 * Returns true if conditions are poor for the given fish.
 */
export function isPoorConditions(_fish: Fish, state: GameState): boolean {
  return (
    state.tank.hungerLevel > POOR_HUNGER_THRESHOLD ||
    state.tank.waterDirtiness > POOR_WATER_DIRTINESS_THRESHOLD ||
    state.tank.algaeLevel > POOR_ALGAE_THRESHOLD
  );
}

function healthStateFromTick(sicknessTick: number, currentState: HealthState): HealthState {
  if (currentState === HealthState.Dead) {
    return HealthState.Dead;
  }

  if (sicknessTick >= HEALTH_DEAD_THRESHOLD) {
    return HealthState.Dead;
  }
  if (sicknessTick >= HEALTH_SICK_THRESHOLD) {
    return HealthState.Sick;
  }
  if (sicknessTick >= HEALTH_WARNING_THRESHOLD) {
    return HealthState.Warning;
  }
  return HealthState.Healthy;
}

/**
 * Evaluates one health tick for a fish. Returns a new Fish object (immutable).
 *
 * - If conditions are poor, sicknessTick increments by 1.
 * - If conditions are good, sicknessTick decrements by 2 (min 0).
 * - healthState is updated based on sicknessTick thresholds.
 * - Dead fish cannot recover.
 */
export function evaluateHealthTick(fish: Fish, state: GameState): Fish {
  // Dead fish do not change
  if (fish.healthState === HealthState.Dead) {
    return { ...fish };
  }

  const poor = isPoorConditions(fish, state);

  const newSicknessTick = poor
    ? fish.sicknessTick + 1
    : Math.max(0, fish.sicknessTick - HEALTH_RECOVERY_RATE);

  const newHealthState = healthStateFromTick(newSicknessTick, fish.healthState);

  return {
    ...fish,
    sicknessTick: newSicknessTick,
    healthState: newHealthState,
  };
}
