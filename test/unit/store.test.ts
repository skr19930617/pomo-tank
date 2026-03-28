import { describe, it, expect } from 'vitest';
import { executePurchase, getStoreSnapshot, calculateMaxCapacity } from '../../src/game/store';
import { createInitialState } from '../../src/game/state';
import { HealthState } from '../../src/shared/types';

describe('store', () => {
  it('getStoreSnapshot returns items with affordability info', () => {
    const state = createInitialState();
    const snapshot = getStoreSnapshot(state);
    expect(snapshot.length).toBeGreaterThan(0);
    for (const item of snapshot) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('affordable');
      expect(item).toHaveProperty('meetsPrerequisites');
    }
  });

  it('executePurchase fails with insufficient funds', () => {
    const state = createInitialState();
    // Attempt to purchase something that costs pomo
    const snapshot = getStoreSnapshot(state);
    const expensiveItem = snapshot.find((item) => item.pomoCost > 0);
    if (expensiveItem) {
      const { result } = executePurchase(state, expensiveItem.id);
      expect(result.success).toBe(false);
    }
  });

  it('calculateMaxCapacity returns a positive number', () => {
    const state = createInitialState();
    const max = calculateMaxCapacity(state.tank);
    expect(max).toBeGreaterThan(0);
  });
});
