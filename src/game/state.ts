// ── Re-export shared types ──
export {
  HealthState,
  StoreItemType,
  SwimLayer,
  Personality,
  DESK_HEIGHT,
  LIGHT_BAR_HEIGHT,
  LIGHT_GAP_RATIO,
  HUD_BOTTOM_PAD,
  DETERIORATION_THRESHOLD,
  DEFAULT_SESSION_MINUTES,
  SWIM_LAYER_RANGES,
} from '../shared/types';
export type {
  TankId,
  TankConfig,
  GenusId,
  FilterId,
  StoreItemId,
  ActionType,
  AnimState,
  GenusConfig,
  SpeciesConfig,
  SpriteSet,
  TimerMode,
  UserSettings,
  FilterConfig,
  FilterMountType,
  FilterVisual,
} from '../shared/types';

import {
  HealthState,
  StoreItemType,
  type TankId,
  type GenusId,
  type FilterId,
  type TimerMode,
} from '../shared/types';

import { buildFishStoreItems } from './species';
import { buildFilterStoreItems } from './filters';
import { buildTankStoreItems } from './tanks';

// ── Store Item Catalog ──

export interface StoreItemPrerequisite {
  requiredUnlocks?: string[];
}

export interface StoreItemData {
  id: string;
  name: string;
  type: StoreItemType;
  pomoCost: number;
  prerequisite: StoreItemPrerequisite;
  description: string;
}

// Fish, filter, and tank store items are all generated dynamically from configs
export const STORE_ITEMS: Record<string, StoreItemData> = {
  ...buildTankStoreItems(),
  ...buildFishStoreItems(),
  ...buildFilterStoreItems(),
};

// ── Game State Interfaces ──

export interface Fish {
  id: string;
  genusId: GenusId;
  speciesId: string;
  healthState: HealthState;
  sicknessTick: number;
  bodyLengthMm: number;
  ageWeeks: number;
  lifespanWeeks: number;
  maintenanceQuality: number;
  purchasedAt: number;
  customName?: string;
}

export interface Tank {
  tankId: TankId;
  hungerLevel: number;
  waterDirtiness: number;
  algaeLevel: number;
  filterId: FilterId | null;
}

export interface PlayerProfile {
  pomoBalance: number;
  totalPomoEarned: number;
  currentStreak: number;
  lastMaintenanceDate: string;
  dailyContinuityDays: number;
  unlockedItems: string[];
  lastTickTimestamp: number;
  sessionStartTime: number;
}

export interface GameState {
  player: PlayerProfile;
  tank: Tank;
  fish: Fish[];
  lightOn: boolean;
  lightOffTimestamp: number | null;
}

// ── Snapshot for webview communication (type-safe) ──

export interface GameStateSnapshot {
  tank: {
    tankId: TankId;
    hungerLevel: number;
    waterDirtiness: number;
    algaeLevel: number;
    filterId: FilterId | null;
  };
  fish: Array<{
    id: string;
    genusId: GenusId;
    speciesId: string;
    healthState: HealthState;
    bodyLengthMm: number;
    ageWeeks: number;
    lifespanWeeks: number;
    maintenanceQuality: number;
    customName?: string;
  }>;
  player: {
    pomoBalance: number;
    currentStreak: number;
    dailyContinuityDays: number;
    unlockedItems: string[];
  };
  session: {
    timeSinceLastMaintenance: number;
    isInBreakWindow: boolean;
    isActivelyCoding: boolean;
    sessionMinutes: number;
    timerMode: TimerMode;
    breakRemainingMs: number;
    breakMinutes: number;
  };
  capacity: {
    current: number;
    max: number;
  };
  store: {
    items: Array<{
      id: string;
      name: string;
      type: StoreItemType;
      pomoCost: number;
      affordable: boolean;
      meetsPrerequisites: boolean;
      capacityCost?: number;
    }>;
  };
  lightOn: boolean;
  debugMode: boolean;
  tickMultiplier: number;
  waterChangeAnimating: boolean;
  waterQualityFrozen: boolean;
}

// ── State Migration ──

const TIER_TO_TANK_ID: Record<string, TankId> = {
  Nano: 'nano_20',
  Small: 'small_30',
  Medium: 'medium_45',
  Large: 'large_60',
  XL: 'xl_90',
};

const ITEM_MIGRATION: Record<string, string> = {
  tank_small: 'small_30',
  tank_medium: 'medium_45',
  tank_large: 'large_60',
  tank_xl: 'xl_90',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function migrateState(raw: unknown): GameState {
  if (!isRecord(raw)) {
    return createInitialState();
  }

  const defaults = createInitialState();
  const state = raw as Record<string, unknown>;

  // Migrate old TankSizeTier → TankId
  if (isRecord(state.tank)) {
    const tank = state.tank as Record<string, unknown>;
    if ('sizeTier' in tank && !('tankId' in tank)) {
      const tier = String(tank.sizeTier);
      tank.tankId = TIER_TO_TANK_ID[tier] ?? 'nano_20';
      delete tank.sizeTier;
    }
  }

  // Migrate unlockedItems
  if (isRecord(state.player)) {
    const player = state.player as Record<string, unknown>;
    if (Array.isArray(player.unlockedItems)) {
      player.unlockedItems = (player.unlockedItems as string[]).map(
        (item) => ITEM_MIGRATION[item] ?? item,
      );
    }
  }

  // Deep-merge with defaults to ensure all required fields exist and types are correct
  const rawPlayer = isRecord(state.player) ? state.player as Record<string, unknown> : {};
  const rawTank = isRecord(state.tank) ? state.tank as Record<string, unknown> : {};

  const merged: GameState = {
    player: {
      pomoBalance: typeof rawPlayer.pomoBalance === 'number' ? rawPlayer.pomoBalance : defaults.player.pomoBalance,
      totalPomoEarned: typeof rawPlayer.totalPomoEarned === 'number' ? rawPlayer.totalPomoEarned : defaults.player.totalPomoEarned,
      currentStreak: typeof rawPlayer.currentStreak === 'number' ? rawPlayer.currentStreak : defaults.player.currentStreak,
      lastMaintenanceDate: typeof rawPlayer.lastMaintenanceDate === 'string' ? rawPlayer.lastMaintenanceDate : defaults.player.lastMaintenanceDate,
      dailyContinuityDays: typeof rawPlayer.dailyContinuityDays === 'number' ? rawPlayer.dailyContinuityDays : defaults.player.dailyContinuityDays,
      unlockedItems: Array.isArray(rawPlayer.unlockedItems) ? (rawPlayer.unlockedItems as string[]).filter((i) => typeof i === 'string') : defaults.player.unlockedItems,
      lastTickTimestamp: typeof rawPlayer.lastTickTimestamp === 'number' ? rawPlayer.lastTickTimestamp : defaults.player.lastTickTimestamp,
      sessionStartTime: typeof rawPlayer.sessionStartTime === 'number' ? rawPlayer.sessionStartTime : defaults.player.sessionStartTime,
    },
    tank: {
      tankId: typeof rawTank.tankId === 'string' ? rawTank.tankId as TankId : defaults.tank.tankId,
      hungerLevel: typeof rawTank.hungerLevel === 'number' ? rawTank.hungerLevel : defaults.tank.hungerLevel,
      waterDirtiness: typeof rawTank.waterDirtiness === 'number' ? rawTank.waterDirtiness : defaults.tank.waterDirtiness,
      algaeLevel: typeof rawTank.algaeLevel === 'number' ? rawTank.algaeLevel : defaults.tank.algaeLevel,
      filterId: typeof rawTank.filterId === 'string' || rawTank.filterId === null ? rawTank.filterId as FilterId | null : defaults.tank.filterId,
    },
    fish: Array.isArray(state.fish) ? (state.fish as Fish[]) : defaults.fish,
    lightOn: typeof state.lightOn === 'boolean' ? state.lightOn : defaults.lightOn,
    lightOffTimestamp: typeof state.lightOffTimestamp === 'number' ? state.lightOffTimestamp : defaults.lightOffTimestamp,
  };

  return merged;
}

// ── Initial State Factory ──

let fishIdCounter = 0;

export function generateFishId(): string {
  return `fish_${Date.now()}_${fishIdCounter++}`;
}

export function createInitialState(): GameState {
  const now = Date.now();
  return {
    player: {
      pomoBalance: 0,
      totalPomoEarned: 0,
      currentStreak: 0,
      lastMaintenanceDate: '',
      dailyContinuityDays: 0,
      unlockedItems: [],
      lastTickTimestamp: now,
      sessionStartTime: now,
    },
    tank: {
      tankId: 'nano_20',
      hungerLevel: 0,
      waterDirtiness: 0,
      algaeLevel: 0,
      filterId: 'basic_sponge',
    },
    fish: [
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
    lightOn: true,
    lightOffTimestamp: null,
  };
}
