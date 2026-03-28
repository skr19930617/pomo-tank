import { describe, it, expect } from 'vitest';
import { evaluateHealthTick, isPoorConditions } from '../../src/game/health';
import { HealthState } from '../../src/shared/types';
import type { Fish, GameState } from '../../src/game/state';
import {
  HEALTH_WARNING_THRESHOLD,
  HEALTH_SICK_THRESHOLD,
  HEALTH_DEAD_THRESHOLD,
  POOR_HUNGER_THRESHOLD,
  POOR_WATER_DIRTINESS_THRESHOLD,
  POOR_ALGAE_THRESHOLD,
} from '../../src/game/constants';

function makeFish(overrides: Partial<Fish> = {}): Fish {
  return {
    id: 'fish_1',
    genusId: 'neon_tetra',
    speciesId: 'standard',
    healthState: HealthState.Healthy,
    sicknessTick: 0,
    bodyLengthMm: 22,
    ageWeeks: 0,
    lifespanWeeks: 156,
    maintenanceQuality: 1.0,
    purchasedAt: Date.now(),
    ...overrides,
  };
}

function makeState(overrides: Partial<GameState['tank']> = {}): GameState {
  return {
    player: {
      pomoBalance: 0,
      totalPomoEarned: 0,
      currentStreak: 0,
      lastMaintenanceDate: '',
      dailyContinuityDays: 0,
      unlockedItems: [],
      lastTickTimestamp: Date.now(),
      sessionStartTime: Date.now(),
    },
    tank: {
      tankId: 'nano_20',
      hungerLevel: 0,
      waterDirtiness: 0,
      algaeLevel: 0,
      filterId: 'basic_sponge',
      ...overrides,
    },
    fish: [],
    lightOn: true,
    lightOffTimestamp: null,
  };
}

describe('isPoorConditions', () => {
  it('returns false when all levels are low', () => {
    const fish = makeFish();
    const state = makeState({ hungerLevel: 10, waterDirtiness: 10, algaeLevel: 10 });
    expect(isPoorConditions(fish, state)).toBe(false);
  });

  it('returns true when hunger exceeds threshold', () => {
    const fish = makeFish();
    const state = makeState({ hungerLevel: POOR_HUNGER_THRESHOLD + 1 });
    expect(isPoorConditions(fish, state)).toBe(true);
  });

  it('returns true when water dirtiness exceeds threshold', () => {
    const fish = makeFish();
    const state = makeState({ waterDirtiness: POOR_WATER_DIRTINESS_THRESHOLD + 1 });
    expect(isPoorConditions(fish, state)).toBe(true);
  });

  it('returns true when algae exceeds threshold', () => {
    const fish = makeFish();
    const state = makeState({ algaeLevel: POOR_ALGAE_THRESHOLD + 1 });
    expect(isPoorConditions(fish, state)).toBe(true);
  });
});

describe('evaluateHealthTick', () => {
  it('increments sicknessTick under poor conditions', () => {
    const fish = makeFish({ sicknessTick: 0 });
    const state = makeState({ hungerLevel: 80 });
    const result = evaluateHealthTick(fish, state);
    expect(result.sicknessTick).toBe(1);
  });

  it('decrements sicknessTick under good conditions', () => {
    const fish = makeFish({ sicknessTick: 10 });
    const state = makeState();
    const result = evaluateHealthTick(fish, state);
    expect(result.sicknessTick).toBe(8);
  });

  it('does not go below 0', () => {
    const fish = makeFish({ sicknessTick: 1 });
    const state = makeState();
    const result = evaluateHealthTick(fish, state);
    expect(result.sicknessTick).toBe(0);
  });

  it('transitions to Warning at threshold', () => {
    const fish = makeFish({ sicknessTick: HEALTH_WARNING_THRESHOLD - 1 });
    const state = makeState({ hungerLevel: 80 });
    const result = evaluateHealthTick(fish, state);
    expect(result.healthState).toBe(HealthState.Warning);
  });

  it('transitions to Sick at threshold', () => {
    const fish = makeFish({ sicknessTick: HEALTH_SICK_THRESHOLD - 1 });
    const state = makeState({ hungerLevel: 80 });
    const result = evaluateHealthTick(fish, state);
    expect(result.healthState).toBe(HealthState.Sick);
  });

  it('transitions to Dead at threshold', () => {
    const fish = makeFish({ sicknessTick: HEALTH_DEAD_THRESHOLD - 1 });
    const state = makeState({ hungerLevel: 80 });
    const result = evaluateHealthTick(fish, state);
    expect(result.healthState).toBe(HealthState.Dead);
  });

  it('dead fish do not change', () => {
    const fish = makeFish({ healthState: HealthState.Dead, sicknessTick: 999 });
    const state = makeState();
    const result = evaluateHealthTick(fish, state);
    expect(result.healthState).toBe(HealthState.Dead);
    expect(result.sicknessTick).toBe(999);
  });
});
