import { type Fish, HealthState, type GameState } from './state';

// Thresholds (in ticks, where 1 tick = 60 seconds)
const WARNING_THRESHOLD = 120; // ~2 hours
const SICK_THRESHOLD = 300; // ~5 hours
const DEAD_THRESHOLD = 540; // ~9 hours

const RECOVERY_RATE = 2; // sicknessTick decrease per tick when conditions are good

/**
 * Returns true if conditions are poor for the given fish.
 * Poor conditions: fish hunger > 70, water dirtiness > 70, or algae level > 80.
 */
export function isPoorConditions(_fish: Fish, state: GameState): boolean {
  return state.tank.hungerLevel > 70 || state.tank.waterDirtiness > 70 || state.tank.algaeLevel > 80;
}

function healthStateFromTick(sicknessTick: number, currentState: HealthState): HealthState {
  if (currentState === HealthState.Dead) {
    return HealthState.Dead;
  }

  if (sicknessTick >= DEAD_THRESHOLD) {
    return HealthState.Dead;
  }
  if (sicknessTick >= SICK_THRESHOLD) {
    return HealthState.Sick;
  }
  if (sicknessTick >= WARNING_THRESHOLD) {
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
    : Math.max(0, fish.sicknessTick - RECOVERY_RATE);

  const newHealthState = healthStateFromTick(newSicknessTick, fish.healthState);

  return {
    ...fish,
    sicknessTick: newSicknessTick,
    healthState: newHealthState,
  };
}
