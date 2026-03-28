import { describe, it, expect } from 'vitest';
import { applyTick, getHungerRate, getWaterRate, getAlgaeRate } from '../../src/game/deterioration';
import type { GameState } from '../../src/game/state';

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

describe('rate functions', () => {
  it('getHungerRate returns positive value', () => {
    expect(getHungerRate(25)).toBeGreaterThan(0);
  });

  it('getWaterRate returns positive value', () => {
    expect(getWaterRate(25)).toBeGreaterThan(0);
  });

  it('getAlgaeRate returns positive value', () => {
    expect(getAlgaeRate(25)).toBeGreaterThan(0);
  });

  it('hunger rate > water rate > algae rate (for same session)', () => {
    const hunger = getHungerRate(25);
    const water = getWaterRate(25);
    const algae = getAlgaeRate(25);
    expect(hunger).toBeGreaterThan(water);
    expect(water).toBeGreaterThan(algae);
  });
});

describe('applyTick', () => {
  it('increases all levels from 0', () => {
    const state = makeState();
    const result = applyTick(state, true, 25);
    expect(result.tank.hungerLevel).toBeGreaterThan(0);
    expect(result.tank.waterDirtiness).toBeGreaterThan(0);
    expect(result.tank.algaeLevel).toBeGreaterThan(0);
  });

  it('clamps values to 100 max', () => {
    const state = makeState({ hungerLevel: 99.9, waterDirtiness: 99.9, algaeLevel: 99.9 });
    const result = applyTick(state, true, 25);
    expect(result.tank.hungerLevel).toBeLessThanOrEqual(100);
    expect(result.tank.waterDirtiness).toBeLessThanOrEqual(100);
    expect(result.tank.algaeLevel).toBeLessThanOrEqual(100);
  });

  it('dirty water increases algae rate', () => {
    const cleanState = makeState({ algaeLevel: 0, waterDirtiness: 0 });
    const dirtyState = makeState({ algaeLevel: 0, waterDirtiness: 80 });
    const cleanResult = applyTick(cleanState, true, 25);
    const dirtyResult = applyTick(dirtyState, true, 25);
    expect(dirtyResult.tank.algaeLevel).toBeGreaterThan(cleanResult.tank.algaeLevel);
  });
});
