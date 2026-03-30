import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameEngine } from '../../src/game/engine';
import { createInitialState } from '../../src/game/state';
import { formatTimer } from '../../src/shared/format-timer';

const mockTracker = { isActivelyCoding: () => true };

describe('GameEngine game-time tracking', () => {
  let engine: GameEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    engine = new GameEngine(createInitialState(), mockTracker, 25, 5);
  });

  afterEach(() => {
    engine.stop();
    vi.useRealTimers();
  });

  describe('focus timer (count-up)', () => {
    it('(a) at 1x, tick adds ~60000ms of game time', () => {
      engine.tick();
      const snap = engine.createSnapshot(true, true);
      expect(snap.session.timeSinceLastMaintenance).toBeGreaterThanOrEqual(60_000);
      expect(snap.session.timeSinceLastMaintenance).toBeLessThan(62_000);
    });

    it('(b) at 50x, tick still adds ~60000ms of game time (no rollback)', () => {
      engine.setTickMultiplier(50);
      engine.tick();
      const snap = engine.createSnapshot(true, true);
      expect(snap.session.timeSinceLastMaintenance).toBeGreaterThanOrEqual(60_000);
      expect(snap.session.timeSinceLastMaintenance).toBeLessThan(62_000);
    });

    it('(c) performAction resets timeSinceLastMaintenance to ~0', () => {
      engine.tick();
      engine.performAction('feedFish');
      const snap = engine.createSnapshot(true, true);
      expect(snap.session.timeSinceLastMaintenance).toBeLessThan(1000);
    });

    it('(d) setTickMultiplier preserves time (diff < 1s) — FR-004', () => {
      engine.tick();
      vi.advanceTimersByTime(500);
      const beforeSnap = engine.createSnapshot(true, true);
      engine.setTickMultiplier(50);
      const afterSnap = engine.createSnapshot(true, true);
      const diff = Math.abs(
        afterSnap.session.timeSinceLastMaintenance - beforeSnap.session.timeSinceLastMaintenance,
      );
      expect(diff).toBeLessThan(1000);
    });

    it('(e) after break expiry, focus timer restarts from 0', () => {
      // Trigger break mode
      engine.performAction('feedFish');
      expect(engine.createSnapshot(true, true).session.timerMode).toBe('break');

      // Expire the break by advancing enough ticks (5 min break = 5 ticks)
      for (let i = 0; i < 6; i++) {
        engine.tick();
      }

      const snap = engine.createSnapshot(true, true);
      expect(snap.session.timerMode).toBe('focus');
      // After break expiry, focus game time should restart near 0
      // (may have accumulated 1 tick if tick ran after expiry check)
      expect(snap.session.timeSinceLastMaintenance).toBeLessThan(62_000);
    });

    it('(f) light OFF freezes time, ON resumes from same value', () => {
      engine.tick();
      const beforeOff = engine.createSnapshot(true, true).session.timeSinceLastMaintenance;

      engine.toggleLight(); // OFF
      vi.advanceTimersByTime(10_000); // 10 seconds pass while OFF

      const duringOff = engine.createSnapshot(true, true).session.timeSinceLastMaintenance;
      expect(duringOff).toBe(beforeOff); // should not increase

      engine.toggleLight(); // ON
      vi.advanceTimersByTime(100);

      const afterOn = engine.createSnapshot(true, true).session.timeSinceLastMaintenance;
      // Should be close to beforeOff + small interpolation
      expect(afterOn).toBeGreaterThanOrEqual(beforeOff);
      expect(afterOn).toBeLessThan(beforeOff + 10_000); // definitely not 10s of paused time
    });
  });

  describe('formatTimer rollover', () => {
    it('(g) 3599s → 59:59, 3600s → 1:00:00', () => {
      expect(formatTimer(3599)).toBe('59:59');
      expect(formatTimer(3600)).toBe('1:00:00');
      expect(formatTimer(3661)).toBe('1:01:01');
      expect(formatTimer(0)).toBe('00:00');
      expect(formatTimer(59)).toBe('00:59');
      expect(formatTimer(60)).toBe('01:00');
    });
  });

  describe('break timer (countdown)', () => {
    it('(a) at 50x, tick reduces breakRemainingMs correctly', () => {
      engine.setTickMultiplier(50);
      engine.performAction('feedFish'); // enters break mode
      const initial = engine.createSnapshot(true, true).session.breakRemainingMs;
      expect(initial).toBeGreaterThan(0);

      engine.tick();
      const afterTick = engine.createSnapshot(true, true).session.breakRemainingMs;
      // 1 tick = 60_000ms of game time subtracted
      expect(afterTick).toBeLessThan(initial);
      expect(initial - afterTick).toBeGreaterThanOrEqual(59_000);
      expect(initial - afterTick).toBeLessThan(62_000);
    });

    it('(b) breakRemainingMs clamps to 0 and never goes negative', () => {
      engine.performAction('feedFish'); // 5 min break
      // 6 ticks = 6 minutes > 5 minute break
      for (let i = 0; i < 6; i++) {
        engine.tick();
      }
      const snap = engine.createSnapshot(true, true);
      // Break should have expired, timer mode back to focus
      expect(snap.session.breakRemainingMs).toBe(0);
    });

    it('(c) light OFF/ON preserves break remaining time', () => {
      engine.performAction('feedFish'); // enter break
      engine.tick(); // 1 min of break elapsed

      const beforeOff = engine.createSnapshot(true, true).session.breakRemainingMs;
      engine.toggleLight(); // OFF
      vi.advanceTimersByTime(10_000);

      const duringOff = engine.createSnapshot(true, true).session.breakRemainingMs;
      expect(duringOff).toBe(beforeOff); // should not decrease

      engine.toggleLight(); // ON
      vi.advanceTimersByTime(100);
      const afterOn = engine.createSnapshot(true, true).session.breakRemainingMs;
      expect(afterOn).toBeLessThanOrEqual(beforeOff);
      expect(afterOn).toBeGreaterThan(beforeOff - 10_000); // not 10s of paused decrement
    });

    it('(d) setTickMultiplier preserves break time (diff < 1s)', () => {
      engine.performAction('feedFish'); // enter break
      engine.tick();
      vi.advanceTimersByTime(500);

      const before = engine.createSnapshot(true, true).session.breakRemainingMs;
      engine.setTickMultiplier(50);
      const after = engine.createSnapshot(true, true).session.breakRemainingMs;
      const diff = Math.abs(before - after);
      expect(diff).toBeLessThan(1000);
    });
  });
});
