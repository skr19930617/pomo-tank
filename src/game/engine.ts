import {
  type GameState,
  type GameStateSnapshot,
  type ActionType,
  STORE_ITEMS,
  HealthState,
  generateFishId,
  TANK_SIZE_ORDER,
} from "./state";
import { applyTick } from "./deterioration";
import { evaluateHealthTick } from "./health";
import {
  calculatePoints,
  isWellTimed,
  updateStreak,
} from "./points";
import {
  executePurchase,
  getStoreSnapshot,
} from "./store";

export interface IActivityTracker {
  isActivelyCoding(): boolean;
}

export class GameEngine {
  private state: GameState;
  private activityTracker: IActivityTracker;
  private intervalId: ReturnType<typeof setTimeout> | null = null;
  private subscribers: Array<(state: GameState) => void> = [];

  constructor(state: GameState, activityTracker: IActivityTracker) {
    this.state = state;
    this.activityTracker = activityTracker;
  }

  start(): void {
    if (this.intervalId !== null) return;
    this.intervalId = setInterval(() => this.tick(), 60_000) as unknown as ReturnType<typeof setTimeout>;
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
    this.state = applyTick(this.state, isActive);

    // Evaluate health for each living fish
    this.state = {
      ...this.state,
      fish: this.state.fish.map((fish) =>
        fish.healthState !== HealthState.Dead
          ? evaluateHealthTick(fish, this.state)
          : fish,
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
    const maxOfflineMs = 24 * 60 * 60 * 1000;
    const cappedElapsed = Math.min(elapsed, maxOfflineMs);
    const ticksToApply = Math.floor(cappedElapsed / 60_000);

    for (let i = 0; i < ticksToApply; i++) {
      this.state = applyTick(this.state, false);

      this.state = {
        ...this.state,
        fish: this.state.fish.map((fish) =>
          fish.healthState !== HealthState.Dead
            ? evaluateHealthTick(fish, this.state)
            : fish,
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

  performAction(action: ActionType): void {
    const now = Date.now();
    const timeSinceLastMaintenance =
      now - this.state.player.sessionStartTime;

    // Edge case: check if tank actually needs this action
    const tankHealthy = this.isTankHealthy(action);

    // Apply maintenance effect
    switch (action) {
      case "feedFish":
        this.state = {
          ...this.state,
          fish: this.state.fish.map((f) =>
            f.healthState !== HealthState.Dead
              ? { ...f, hungerLevel: Math.max(0, f.hungerLevel - 60) }
              : f,
          ),
        };
        break;
      case "changeWater":
        this.state = {
          ...this.state,
          tank: {
            ...this.state.tank,
            waterDirtiness: Math.max(
              0,
              this.state.tank.waterDirtiness - 50,
            ),
            algaeLevel: Math.max(0, this.state.tank.algaeLevel - 10),
          },
        };
        break;
      case "cleanAlgae":
        this.state = {
          ...this.state,
          tank: { ...this.state.tank, algaeLevel: 0 },
        };
        break;
    }

    // Calculate pomo points (0 if tank was already healthy for this action)
    const todayIso = new Date(now).toISOString().slice(0, 10);
    const isFirstToday =
      this.state.player.lastMaintenanceDate !== todayIso;

    const result = tankHealthy
      ? { points: 0, timingBonus: 1.0, streakMultiplier: 1.0, dailyBonus: 0 }
      : calculatePoints(
          timeSinceLastMaintenance,
          this.state.player.currentStreak,
          isFirstToday,
          this.state.player.dailyContinuityDays,
        );

    // Update streak
    const wellTimed = isWellTimed(timeSinceLastMaintenance);
    const newStreak = updateStreak(
      this.state.player.currentStreak,
      wellTimed,
    );

    // Update daily continuity
    let newDailyContinuityDays =
      this.state.player.dailyContinuityDays;
    if (isFirstToday) {
      newDailyContinuityDays += 1;
    }

    this.state = {
      ...this.state,
      player: {
        ...this.state.player,
        pomoBalance: this.state.player.pomoBalance + result.points,
        totalPomoEarned:
          this.state.player.totalPomoEarned + result.points,
        currentStreak: newStreak,
        lastMaintenanceDate: todayIso,
        dailyContinuityDays: newDailyContinuityDays,
        sessionStartTime: now,
      },
    };

    this.notifySubscribers();
  }

  purchaseItem(
    itemId: string,
  ): { success: boolean; message?: string } {
    const { state: newState, result } = executePurchase(
      this.state,
      itemId,
    );
    if (result.success) {
      this.state = newState;
      this.notifySubscribers();
    }
    return { success: result.success, message: result.message };
  }

  onStateChange(callback: (state: GameState) => void): void {
    this.subscribers.push(callback);
  }

  createSnapshot(isActiveCoding: boolean): GameStateSnapshot {
    const timeSinceLastMaintenance =
      Date.now() - this.state.player.sessionStartTime;

    return {
      tank: {
        sizeTier: this.state.tank.sizeTier,
        waterDirtiness: this.state.tank.waterDirtiness,
        algaeLevel: this.state.tank.algaeLevel,
        filterId: this.state.tank.filterId,
      },
      fish: this.state.fish.map((f) => ({
        id: f.id,
        speciesId: f.speciesId,
        hungerLevel: f.hungerLevel,
        healthState: f.healthState,
      })),
      player: {
        pomoBalance: this.state.player.pomoBalance,
        currentStreak: this.state.player.currentStreak,
        dailyContinuityDays: this.state.player.dailyContinuityDays,
      },
      session: {
        timeSinceLastMaintenance,
        isInBreakWindow: this.isInBreakWindow(),
        isActivelyCoding: isActiveCoding,
      },
      store: {
        items: getStoreSnapshot(this.state),
      },
      lightOn: this.state.lightOn,
    };
  }

  toggleLight(): boolean {
    const now = Date.now();
    if (this.state.lightOn) {
      // Turning off
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
    return elapsed >= 20 * 60 * 1000 && elapsed <= 30 * 60 * 1000;
  }

  private isTankHealthy(action: ActionType): boolean {
    switch (action) {
      case "feedFish": {
        const living = this.state.fish.filter(
          (f) => f.healthState !== HealthState.Dead,
        );
        return living.every((f) => f.hungerLevel < 10);
      }
      case "changeWater":
        return this.state.tank.waterDirtiness < 10;
      case "cleanAlgae":
        return this.state.tank.algaeLevel < 10;
    }
  }

  private handleDeadFish(): void {
    const hasDeadFish = this.state.fish.some(
      (f) => f.healthState === HealthState.Dead,
    );
    if (!hasDeadFish) return;

    // Reset streak on death
    const livingAfterRemoval = this.state.fish.filter(
      (f) => f.healthState !== HealthState.Dead,
    );

    let newFish = livingAfterRemoval;

    // If all fish dead, auto-grant a new Guppy
    if (newFish.length === 0) {
      newFish = [
        {
          id: generateFishId(),
          speciesId: "guppy",
          hungerLevel: 0,
          healthState: HealthState.Healthy,
          sicknessTick: 0,
        },
      ];
    }

    this.state = {
      ...this.state,
      fish: newFish,
      player: {
        ...this.state.player,
        currentStreak: 0,
      },
    };
  }

  private notifySubscribers(): void {
    for (const callback of this.subscribers) {
      callback(this.state);
    }
  }
}
