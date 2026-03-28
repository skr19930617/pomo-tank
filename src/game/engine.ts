import {
  type GameState,
  type GameStateSnapshot,
  type ActionType,
  type TimerMode,
  HealthState,
  generateFishId,
  createInitialState,
  DEFAULT_SESSION_MINUTES,
} from './state';
import type { FilterId, TankId } from '../shared/types';
import {
  MAX_OFFLINE_MS,
  TICK_MULTIPLIER_MIN,
  TICK_MULTIPLIER_MAX,
  FEED_REDUCTION,
  WATER_CHANGE_DIRTINESS_REDUCTION,
  WATER_CHANGE_ALGAE_REDUCTION,
  TANK_HEALTHY_THRESHOLD,
  FISH_NAME_MAX_LENGTH,
  BREAK_WINDOW_LOW,
  BREAK_WINDOW_HIGH,
} from './constants';
import { getFilter } from './filters';
import { getTank } from './tanks';
import { applyTick } from './deterioration';
import { evaluateHealthTick } from './health';
import { calculatePoints, isWellTimed, updateStreak } from './points';
import {
  executePurchase,
  getStoreSnapshot,
  calculateCurrentCost,
  calculateMaxCapacity,
} from './store';
import { computeQualitySnapshot, updateQuality } from './maintenance-quality';
import { growFish } from './growth';
import { getSpeciesWithGenus } from './species';

export interface IActivityTracker {
  isActivelyCoding(): boolean;
}

export class GameEngine {
  private state: GameState;
  private activityTracker: IActivityTracker;
  private sessionMinutes: number;
  private breakMinutes: number;
  private timerMode: TimerMode = 'focus';
  private breakStartTimestamp: number | null = null;
  private breakPausedRemainingMs: number | null = null;
  private intervalId: ReturnType<typeof setTimeout> | null = null;
  private subscribers: Array<(state: GameState) => void> = [];
  private tickMultiplier: number = 1;
  private waterFreezers = new Set<string>();

  constructor(
    state: GameState,
    activityTracker: IActivityTracker,
    sessionMinutes: number = DEFAULT_SESSION_MINUTES,
    breakMinutes: number = 5,
  ) {
    this.state = state;
    this.activityTracker = activityTracker;
    this.sessionMinutes = sessionMinutes;
    this.breakMinutes = breakMinutes;
  }

  start(): void {
    if (this.intervalId !== null) return;
    const intervalMs = 60_000 / this.tickMultiplier;
    this.intervalId = setInterval(() => this.tick(), intervalMs) as unknown as ReturnType<
      typeof setTimeout
    >;
  }

  setTickMultiplier(n: number): void {
    const clamped = Math.max(TICK_MULTIPLIER_MIN, Math.min(TICK_MULTIPLIER_MAX, Math.round(n)));
    this.tickMultiplier = clamped;
    // Restart interval with new speed
    if (this.intervalId !== null) {
      this.stop();
      this.start();
    }
    this.notifySubscribers();
  }

  getTickMultiplier(): number {
    return this.tickMultiplier;
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId as unknown as number);
      this.intervalId = null;
    }
  }

  getState(): GameState {
    return this.state;
  }

  setState(state: GameState): void {
    this.state = state;
    this.notifySubscribers();
  }

  tick(): void {
    // Skip deterioration and health when light is off
    if (!this.state.lightOn) {
      this.notifySubscribers();
      return;
    }

    const isActive = this.activityTracker.isActivelyCoding();

    // Apply deterioration (returns new state)
    // When water change animation is active, freeze water quality fields
    const frozenWater = this.isWaterQualityFrozen ? this.state.tank.waterDirtiness : null;
    const frozenAlgae = this.isWaterQualityFrozen ? this.state.tank.algaeLevel : null;
    this.state = applyTick(this.state, isActive, this.sessionMinutes);
    if (frozenWater !== null && frozenAlgae !== null) {
      this.state = {
        ...this.state,
        tank: { ...this.state.tank, waterDirtiness: frozenWater, algaeLevel: frozenAlgae },
      };
    }

    // Evaluate health for each living fish
    this.state = {
      ...this.state,
      fish: this.state.fish.map((fish) =>
        fish.healthState !== HealthState.Dead ? evaluateHealthTick(fish, this.state) : fish,
      ),
    };

    // Handle dead fish
    this.handleDeadFish();

    // Update timestamp
    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        lastTickTimestamp: Date.now(),
      },
    };

    this.notifySubscribers();
  }

  applyOfflineCatchUp(): void {
    const now = Date.now();
    const elapsed = now - this.state.player.lastTickTimestamp;
    const maxOfflineMs = MAX_OFFLINE_MS;
    const cappedElapsed = Math.min(elapsed, maxOfflineMs);
    const ticksToApply = Math.floor(cappedElapsed / 60_000);

    for (let i = 0; i < ticksToApply; i++) {
      this.state = applyTick(this.state, false, this.sessionMinutes);

      this.state = {
        ...this.state,
        fish: this.state.fish.map((fish) =>
          fish.healthState !== HealthState.Dead ? evaluateHealthTick(fish, this.state) : fish,
        ),
      };

      this.handleDeadFish();
    }

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        lastTickTimestamp: now,
        sessionStartTime: now,
      },
    };
  }

  performAction(action: ActionType, bypassFreeze = false): void {
    // Block all maintenance actions during water change animation
    if (!bypassFreeze && this.isWaterQualityFrozen) return;
    const now = Date.now();
    const timeSinceLastMaintenance = now - this.state.player.sessionStartTime;

    // Edge case: check if tank actually needs this action
    const tankHealthy = this.isTankHealthy(action);

    // Apply maintenance effect
    switch (action) {
      case 'feedFish':
        this.state = {
          ...this.state,
          tank: {
            ...this.state.tank,
            hungerLevel: Math.max(0, this.state.tank.hungerLevel - FEED_REDUCTION),
          },
        };
        break;
      case 'changeWater':
        this.state = {
          ...this.state,
          tank: {
            ...this.state.tank,
            waterDirtiness: Math.max(0, this.state.tank.waterDirtiness - WATER_CHANGE_DIRTINESS_REDUCTION),
            algaeLevel: Math.max(0, this.state.tank.algaeLevel - WATER_CHANGE_ALGAE_REDUCTION),
          },
        };
        break;
      case 'cleanAlgae':
        this.state = {
          ...this.state,
          tank: { ...this.state.tank, algaeLevel: 0 },
        };
        break;
    }

    // Calculate pomo points (0 if tank was already healthy for this action)
    const todayIso = new Date(now).toISOString().slice(0, 10);
    const isFirstToday = this.state.player.lastMaintenanceDate !== todayIso;

    const result = tankHealthy
      ? { points: 0, timingBonus: 1.0, streakMultiplier: 1.0, dailyBonus: 0 }
      : calculatePoints(
          timeSinceLastMaintenance,
          this.state.player.currentStreak,
          isFirstToday,
          this.state.player.dailyContinuityDays,
          this.sessionMinutes,
        );

    // Update streak
    const wellTimed = isWellTimed(timeSinceLastMaintenance, this.sessionMinutes);
    const newStreak = updateStreak(this.state.player.currentStreak, wellTimed);

    // Update daily continuity
    let newDailyContinuityDays = this.state.player.dailyContinuityDays;
    if (isFirstToday) {
      newDailyContinuityDays += 1;
    }

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        pomoBalance: this.state.player.pomoBalance + result.points,
        totalPomoEarned: this.state.player.totalPomoEarned + result.points,
        currentStreak: newStreak,
        lastMaintenanceDate: todayIso,
        dailyContinuityDays: newDailyContinuityDays,
        sessionStartTime: now,
      },
    };

    // Enter break mode if breakMinutes > 0
    if (this.breakMinutes > 0) {
      this.timerMode = 'break';
      this.breakStartTimestamp = now;
      this.breakPausedRemainingMs = null;
    }

    // ── Per-pomo fish progression: quality update + growth + aging ──
    const qualitySnapshot = computeQualitySnapshot(
      this.state.tank.hungerLevel,
      this.state.tank.waterDirtiness,
      this.state.tank.algaeLevel,
    );

    this.state = {
      ...this.state,
      fish: this.state.fish.map((fish) => {
        if (fish.healthState === HealthState.Dead) return fish;

        // Update maintenance quality (EMA)
        const newQuality = updateQuality(fish.maintenanceQuality, qualitySnapshot);

        // Apply growth and aging
        const pair = getSpeciesWithGenus(fish.genusId, fish.speciesId);
        if (!pair) return { ...fish, maintenanceQuality: newQuality };

        const growthUpdates = growFish(
          { ...fish, maintenanceQuality: newQuality },
          pair.genus,
          pair.species,
        );

        return { ...fish, maintenanceQuality: newQuality, ...growthUpdates };
      }),
    };

    this.notifySubscribers();
  }

  purchaseItem(itemId: string): { success: boolean; message?: string } {
    if (this.isWaterQualityFrozen) return { success: false, message: 'Water change in progress' };
    const { state: newState, result } = executePurchase(this.state, itemId);
    if (result.success) {
      this.state = newState;
      this.notifySubscribers();
    }
    return { success: result.success, message: result.message };
  }

  onStateChange(callback: (state: GameState) => void): void {
    this.subscribers.push(callback);
  }

  resetState(): void {
    if (this.isWaterQualityFrozen) return;
    const fresh = createInitialState();
    this.state = fresh;
    this.notifySubscribers();
  }

  setPomo(amount: number): void {
    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        pomoBalance: Math.max(0, Math.floor(amount)),
      },
    };
    this.notifySubscribers();
  }

  switchTank(tankId: TankId): { success: boolean; message?: string } {
    if (this.isWaterQualityFrozen) return { success: false, message: 'Water change in progress' };
    const tankConfig = getTank(tankId);
    if (!tankConfig) {
      return { success: false, message: 'Unknown tank' };
    }
    // Validate unlocked (starter tank is always available)
    if (tankConfig.pomoCost > 0) {
      if (!this.state.player.unlockedItems.includes(tankId)) {
        return { success: false, message: 'Tank not unlocked' };
      }
    }
    // Validate capacity
    const filterBonus = getFilter(this.state.tank.filterId)?.capacityBonus ?? 0;
    const newMaxCapacity = tankConfig.baseCapacity + filterBonus;
    const currentCost = calculateCurrentCost(this.state.fish);
    if (currentCost > newMaxCapacity) {
      return { success: false, message: `Capacity would be exceeded (${currentCost}/${newMaxCapacity})` };
    }
    this.state = {
      ...this.state,
      tank: { ...this.state.tank, tankId },
    };
    this.notifySubscribers();
    return { success: true };
  }

  switchFilter(filterId: FilterId): { success: boolean; message?: string } {
    if (this.isWaterQualityFrozen) return { success: false, message: 'Water change in progress' };
    // Validate unlocked (basic_sponge is always available)
    if (filterId !== 'basic_sponge') {
      if (!this.state.player.unlockedItems.includes(filterId)) {
        return { success: false, message: 'Filter not unlocked' };
      }
    }
    // Validate capacity
    const newFilterBonus = getFilter(filterId)?.capacityBonus ?? 0;
    const currentTank = getTank(this.state.tank.tankId);
    const newMaxCapacity = (currentTank?.baseCapacity ?? 0) + newFilterBonus;
    const currentCost = calculateCurrentCost(this.state.fish);
    if (currentCost > newMaxCapacity) {
      return { success: false, message: `Capacity would be exceeded (${currentCost}/${newMaxCapacity})` };
    }
    this.state = {
      ...this.state,
      tank: { ...this.state.tank, filterId },
    };
    this.notifySubscribers();
    return { success: true };
  }

  renameFish(fishId: string, customName: string): { success: boolean; message?: string } {
    const fishIndex = this.state.fish.findIndex((f) => f.id === fishId);
    if (fishIndex < 0) {
      return { success: false, message: 'Fish not found' };
    }
    const trimmed = customName.trim().slice(0, FISH_NAME_MAX_LENGTH);
    const newFish = [...this.state.fish];
    newFish[fishIndex] = {
      ...newFish[fishIndex],
      customName: trimmed || undefined,
    };
    this.state = { ...this.state, fish: newFish };
    this.notifySubscribers();
    return { success: true };
  }

  removeFish(fishId: string): { success: boolean; message?: string } {
    const fishIndex = this.state.fish.findIndex((f) => f.id === fishId);
    if (fishIndex < 0) {
      return { success: false, message: 'Fish not found' };
    }
    const newFish = [...this.state.fish];
    newFish.splice(fishIndex, 1);
    this.state = { ...this.state, fish: newFish };
    this.notifySubscribers();
    return { success: true };
  }

  setSessionMinutes(minutes: number): void {
    this.sessionMinutes = minutes;
  }

  setBreakMinutes(minutes: number): void {
    this.breakMinutes = minutes;
  }

  setWaterQualityFrozen(frozen: boolean, ownerId: string): void {
    if (frozen) {
      this.waterFreezers.add(ownerId);
    } else {
      this.waterFreezers.delete(ownerId);
    }
    this.notifySubscribers();
  }

  private get isWaterQualityFrozen(): boolean {
    return this.waterFreezers.size > 0;
  }

  reduceAlgae(amount: number): void {
    const newLevel = Math.max(0, this.state.tank.algaeLevel - amount);
    this.state = {
      ...this.state,
      tank: { ...this.state.tank, algaeLevel: newLevel },
    };
    this.notifySubscribers();
  }

  private getBreakRemainingMs(): number {
    if (this.timerMode !== 'break' || this.breakStartTimestamp === null) return 0;
    if (this.breakPausedRemainingMs !== null) return this.breakPausedRemainingMs;
    const elapsed = Date.now() - this.breakStartTimestamp;
    const remaining = this.breakMinutes * 60 * 1000 - elapsed;
    return Math.max(0, remaining);
  }

  private checkBreakExpiry(): void {
    if (this.timerMode !== 'break') return;
    if (this.getBreakRemainingMs() <= 0) {
      this.timerMode = 'focus';
      this.breakStartTimestamp = null;
      this.breakPausedRemainingMs = null;
      // Reset sessionStartTime so focus timer starts from 0
      this.state = {
        ...this.state,
        player: {
          ...this.state.player,
          sessionStartTime: Date.now(),
        },
      };
    }
  }

  createSnapshot(isActiveCoding: boolean, debugMode: boolean = false): GameStateSnapshot {
    this.checkBreakExpiry();
    const timeSinceLastMaintenance = Date.now() - this.state.player.sessionStartTime;

    return {
      tank: {
        tankId: this.state.tank.tankId,
        hungerLevel: this.state.tank.hungerLevel,
        waterDirtiness: this.state.tank.waterDirtiness,
        algaeLevel: this.state.tank.algaeLevel,
        filterId: this.state.tank.filterId,
      },
      fish: this.state.fish.map((f) => ({
        id: f.id,
        genusId: f.genusId,
        speciesId: f.speciesId,
        healthState: f.healthState,
        bodyLengthMm: f.bodyLengthMm,
        ageWeeks: f.ageWeeks,
        lifespanWeeks: f.lifespanWeeks,
        maintenanceQuality: f.maintenanceQuality,
        customName: f.customName,
      })),
      player: {
        pomoBalance: this.state.player.pomoBalance,
        currentStreak: this.state.player.currentStreak,
        dailyContinuityDays: this.state.player.dailyContinuityDays,
        unlockedItems: this.state.player.unlockedItems,
      },
      session: {
        timeSinceLastMaintenance,
        isInBreakWindow: this.isInBreakWindow(),
        isActivelyCoding: isActiveCoding,
        sessionMinutes: this.sessionMinutes,
        timerMode: this.timerMode,
        breakRemainingMs: this.getBreakRemainingMs(),
        breakMinutes: this.breakMinutes,
      },
      capacity: {
        current: calculateCurrentCost(this.state.fish),
        max: calculateMaxCapacity(this.state.tank),
      },
      store: {
        items: getStoreSnapshot(this.state),
      },
      lightOn: this.state.lightOn,
      debugMode,
      tickMultiplier: this.tickMultiplier,
      waterChangeAnimating: this.waterFreezers.has('tank-panel') || this.waterFreezers.has('companion'),
      waterQualityFrozen: this.isWaterQualityFrozen,
    };
  }

  toggleLight(): boolean {
    // Block during water change animation
    if (this.isWaterQualityFrozen) return this.state.lightOn;
    const now = Date.now();
    if (this.state.lightOn) {
      // Turning off — pause break timer if active
      if (this.timerMode === 'break' && this.breakStartTimestamp !== null) {
        this.breakPausedRemainingMs = this.getBreakRemainingMs();
      }
      this.state = {
        ...this.state,
        lightOn: false,
        lightOffTimestamp: now,
      };
    } else {
      // Turning on — add paused duration to timestamps so timers skip the off period
      const lightOffDuration = this.state.lightOffTimestamp
        ? now - this.state.lightOffTimestamp
        : 0;
      // Resume break timer if it was paused
      if (this.timerMode === 'break' && this.breakPausedRemainingMs !== null) {
        this.breakStartTimestamp = now - (this.breakMinutes * 60 * 1000 - this.breakPausedRemainingMs);
        this.breakPausedRemainingMs = null;
      }
      this.state = {
        ...this.state,
        lightOn: true,
        lightOffTimestamp: null,
        player: {
          ...this.state.player,
          lastTickTimestamp: this.state.player.lastTickTimestamp + lightOffDuration,
          sessionStartTime: this.state.player.sessionStartTime + lightOffDuration,
        },
      };
    }
    this.notifySubscribers();
    return this.state.lightOn;
  }

  getTimeSinceLastMaintenance(): number {
    return Date.now() - this.state.player.sessionStartTime;
  }

  isInBreakWindow(): boolean {
    const elapsed = this.getTimeSinceLastMaintenance();
    const sessionMs = this.sessionMinutes * 60 * 1000;
    return elapsed >= sessionMs * BREAK_WINDOW_LOW && elapsed <= sessionMs * BREAK_WINDOW_HIGH;
  }

  private isTankHealthy(action: ActionType): boolean {
    switch (action) {
      case 'feedFish':
        return this.state.tank.hungerLevel < TANK_HEALTHY_THRESHOLD;
      case 'changeWater':
        return this.state.tank.waterDirtiness < TANK_HEALTHY_THRESHOLD;
      case 'cleanAlgae':
        return this.state.tank.algaeLevel < TANK_HEALTHY_THRESHOLD;
    }
  }

  private handleDeadFish(): void {
    const hasNewDeaths = this.state.fish.some((f) => f.healthState === HealthState.Dead);
    if (!hasNewDeaths) return;

    // Dead fish remain in tank (frozen sprite, low opacity) — no auto-removal.
    // Reset streak on any death event.
    const livingFish = this.state.fish.filter((f) => f.healthState !== HealthState.Dead);

    // If all fish dead, auto-grant a new neon tetra
    if (livingFish.length === 0) {
      const now = Date.now();
      this.state = {
        ...this.state,
        fish: [
          ...this.state.fish,
          {
            id: generateFishId(),
            genusId: 'neon_tetra',
            speciesId: 'standard',
            healthState: HealthState.Healthy,
            sicknessTick: 0,
            bodyLengthMm: 20 + Math.random() * 4,
            ageWeeks: 0,
            lifespanWeeks: Math.round((3 + Math.random() * 2) * 52),
            maintenanceQuality: 1.0,
            purchasedAt: now,
          },
        ],
        player: {
          ...this.state.player,
          currentStreak: 0,
        },
      };
    } else {
      this.state = {
        ...this.state,
        player: {
          ...this.state.player,
          currentStreak: 0,
        },
      };
    }
  }

  private notifySubscribers(): void {
    for (const callback of this.subscribers) {
      callback(this.state);
    }
  }
}
