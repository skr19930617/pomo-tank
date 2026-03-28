import { describe, it, expect } from 'vitest';
import { migrateState, createInitialState } from '../../src/game/state';

describe('migrateState', () => {
  it('returns initial state for non-object input', () => {
    const result = migrateState(null);
    expect(result.player).toBeDefined();
    expect(result.tank).toBeDefined();
  });

  it('returns initial state for undefined input', () => {
    const result = migrateState(undefined);
    expect(result.tank.tankId).toBe('nano_20');
  });

  it('migrates old sizeTier to tankId', () => {
    const raw = {
      ...createInitialState(),
      tank: {
        sizeTier: 'Medium',
        hungerLevel: 10,
        waterDirtiness: 20,
        algaeLevel: 5,
        filterId: 'basic_sponge',
      },
    };
    delete (raw.tank as Record<string, unknown>).tankId;
    const result = migrateState(raw);
    expect(result.tank.tankId).toBe('medium_45');
  });

  it('migrates old unlockedItems names', () => {
    const raw = {
      ...createInitialState(),
    };
    raw.player.unlockedItems = ['tank_small', 'tank_medium'];
    const result = migrateState(raw);
    expect(result.player.unlockedItems).toEqual(['small_30', 'medium_45']);
  });

  it('preserves valid state without modification', () => {
    const initial = createInitialState();
    const result = migrateState(JSON.parse(JSON.stringify(initial)));
    expect(result.tank.tankId).toBe(initial.tank.tankId);
    expect(result.player.pomoBalance).toBe(initial.player.pomoBalance);
  });

  it('fills missing fields from defaults for empty object', () => {
    const result = migrateState({});
    expect(result.player).toBeDefined();
    expect(result.player.pomoBalance).toBe(0);
    expect(result.tank).toBeDefined();
    expect(result.tank.tankId).toBe('nano_20');
    expect(result.fish).toBeDefined();
    expect(result.lightOn).toBe(true);
  });

  it('fills missing fields from defaults for partial player', () => {
    const result = migrateState({ player: { pomoBalance: 100 } });
    expect(result.player.pomoBalance).toBe(100);
    expect(result.player.currentStreak).toBe(0);
    expect(result.tank.tankId).toBe('nano_20');
  });

  it('fills missing fields from defaults for partial tank', () => {
    const result = migrateState({ tank: { tankId: 'large_60' } });
    expect(result.tank.tankId).toBe('large_60');
    expect(result.tank.hungerLevel).toBe(0);
    expect(result.player.pomoBalance).toBe(0);
  });

  it('handles array input by returning initial state', () => {
    const result = migrateState([1, 2, 3]);
    expect(result.tank.tankId).toBe('nano_20');
  });

  it('handles wrong-type nested fields gracefully', () => {
    const result = migrateState({
      player: { pomoBalance: 'not-a-number', unlockedItems: 'not-an-array' },
      tank: { hungerLevel: true },
      fish: 'not-an-array',
    });
    // Wrong types should fall back to defaults
    expect(result.player.pomoBalance).toBe(0);
    expect(result.player.unlockedItems).toEqual([]);
    expect(result.tank.hungerLevel).toBe(0);
    expect(Array.isArray(result.fish)).toBe(true);
  });
});
