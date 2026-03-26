// ── Re-export shared types ──
export {
  TankSizeTier,
  HealthState,
  StoreItemType,
  SwimLayer,
  Personality,
  TANK_BASE_CAPACITY,
  TANK_SIZE_ORDER,
  TANK_RENDER_SIZES,
  DESK_HEIGHT,
  LIGHT_BAR_HEIGHT,
  DETERIORATION_THRESHOLD,
  DEFAULT_SESSION_MINUTES,
  SWIM_LAYER_RANGES,
  TANK_DIMENSIONS_MM,
} from '../shared/types';
export type {
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
  TankSizeTier,
  HealthState,
  StoreItemType,
  type GenusId,
  type FilterId,
  type TimerMode,
} from '../shared/types';

import { buildFishStoreItems } from './species';
import { buildFilterStoreItems } from './filters';

// ── Store Item Catalog ──

export interface StoreItemPrerequisite {
  minTankSize?: TankSizeTier;
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

const BASE_STORE_ITEMS: Record<string, StoreItemData> = {
  tank_small: {
    id: 'tank_small',
    name: 'Small Tank',
    type: StoreItemType.TankUpgrade,
    pomoCost: 30,
    prerequisite: {},
    description: 'A cozy upgrade. Base capacity: 8.',
  },
  tank_medium: {
    id: 'tank_medium',
    name: 'Medium Tank',
    type: StoreItemType.TankUpgrade,
    pomoCost: 100,
    prerequisite: { requiredUnlocks: ['tank_small'] },
    description: 'Room to grow. Base capacity: 14.',
  },
  tank_large: {
    id: 'tank_large',
    name: 'Large Tank',
    type: StoreItemType.TankUpgrade,
    pomoCost: 250,
    prerequisite: { requiredUnlocks: ['tank_medium'] },
    description: 'A proper aquarium. Base capacity: 22.',
  },
  tank_xl: {
    id: 'tank_xl',
    name: 'XL Tank',
    type: StoreItemType.TankUpgrade,
    pomoCost: 500,
    prerequisite: { requiredUnlocks: ['tank_large'] },
    description: 'The ultimate tank. Base capacity: 32.',
  },
};

// Fish and filter store items are generated dynamically from configs
export const STORE_ITEMS: Record<string, StoreItemData> = {
  ...BASE_STORE_ITEMS,
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
}

export interface Tank {
  sizeTier: TankSizeTier;
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
    sizeTier: TankSizeTier;
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
  }>;
  player: {
    pomoBalance: number;
    currentStreak: number;
    dailyContinuityDays: number;
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
      sizeTier: TankSizeTier.Nano,
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
