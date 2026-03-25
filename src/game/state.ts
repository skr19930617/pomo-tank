// ── Re-export shared types for backward compatibility ──
export {
  TankSizeTier,
  HealthState,
  StoreItemType,
  TANK_BASE_CAPACITY,
  TANK_SIZE_ORDER,
  TANK_RENDER_SIZES,
  DESK_HEIGHT,
  LIGHT_BAR_HEIGHT,
  DETERIORATION_THRESHOLD,
  DEFAULT_SESSION_MINUTES,
} from '../shared/types';
export type {
  FishSpeciesId,
  FilterId,
  StoreItemId,
  ActionType,
  AnimState,
  VariantConfig,
  FishSpeciesConfig,
} from '../shared/types';

import {
  TankSizeTier,
  HealthState,
  StoreItemType,
  type FishSpeciesId,
  type FilterId,
  type FishSpeciesConfig,
} from '../shared/types';

// ── Fish Species Catalog ──

export const FISH_SPECIES: Record<FishSpeciesId, FishSpeciesConfig> = {
  neon_tetra: {
    id: 'neon_tetra',
    name: 'Neon Tetra',
    capacityCost: 1,
    minTankSize: TankSizeTier.Nano,
    schoolingMin: 3,
    swimZone: { min: 0.2, max: 0.7 },
    baseSpeed: 1.2,
    minSize: 16,
    maxSize: 22,
    hasFeedingAnim: false,
    variants: [
      {
        id: 'standard',
        name: 'Standard',
        sprites: { swim: 'swim_64x64_6x2_12f.png', weak: 'weak_64x64_6x2_12f.png' },
      },
      {
        id: 'albino',
        name: 'Albino',
        sprites: { swim: 'swim_64x64_6x2_12f.png', weak: 'weak_64x64_6x2_12f.png' },
      },
      {
        id: 'green',
        name: 'Green',
        sprites: { swim: 'swim_64x64_6x2_12f.png', weak: 'weak_64x64_6x2_12f.png' },
      },
    ],
  },
  corydoras: {
    id: 'corydoras',
    name: 'Corydoras',
    capacityCost: 2,
    minTankSize: TankSizeTier.Small,
    schoolingMin: 3,
    swimZone: { min: 0.65, max: 0.95 },
    baseSpeed: 0.8,
    minSize: 18,
    maxSize: 24,
    hasFeedingAnim: false,
    variants: [
      {
        id: 'albino',
        name: 'Albino',
        sprites: { swim: 'swim_64x64_6x2_12f.png', weak: 'weak_64x64_6x2_12f.png' },
      },
      {
        id: 'panda',
        name: 'Panda',
        sprites: { swim: 'swim_64x64_6x2_12f.png', weak: 'weak_64x64_6x2_12f.png' },
      },
      {
        id: 'sterbai',
        name: 'Sterbai',
        sprites: { swim: 'swim_64x64_6x2_12f.png', weak: 'weak_64x64_6x2_12f.png' },
      },
    ],
  },
  gourami: {
    id: 'gourami',
    name: 'Gourami',
    capacityCost: 3,
    minTankSize: TankSizeTier.Small,
    schoolingMin: 1,
    swimZone: { min: 0.15, max: 0.55 },
    baseSpeed: 0.7,
    minSize: 22,
    maxSize: 30,
    hasFeedingAnim: false,
    variants: [
      {
        id: 'dwarf',
        name: 'Dwarf',
        sprites: { swim: 'swim_64x64_6x2_12f.png', weak: 'weak_64x64_6x2_12f.png' },
      },
      {
        id: 'cobalt_blue_dwarf',
        name: 'Cobalt Blue Dwarf',
        sprites: { swim: 'swim_64x64_6x2_12f.png', weak: 'weak_64x64_6x2_12f.png' },
      },
    ],
  },
  otocinclus: {
    id: 'otocinclus',
    name: 'Otocinclus',
    capacityCost: 2,
    minTankSize: TankSizeTier.Small,
    schoolingMin: 3,
    swimZone: { min: 0.6, max: 0.9 },
    baseSpeed: 0.9,
    minSize: 14,
    maxSize: 18,
    hasFeedingAnim: true,
    variants: [
      {
        id: 'standard',
        name: 'Standard',
        sprites: {
          swim: 'swim_64x64_6x2_12f.png',
          weak: 'weak_64x64_6x2_12f.png',
          feeding: 'feeding_64x64_6x2_12f.png',
        },
      },
    ],
  },
  shrimp: {
    id: 'shrimp',
    name: 'Amano Shrimp',
    capacityCost: 1,
    minTankSize: TankSizeTier.Nano,
    schoolingMin: 3,
    swimZone: { min: 0.7, max: 0.95 },
    baseSpeed: 0.6,
    minSize: 12,
    maxSize: 16,
    hasFeedingAnim: true,
    variants: [
      {
        id: 'amano',
        name: 'Amano',
        sprites: {
          swim: 'swim_64x64_6x2_12f.png',
          weak: 'weak_64x64_6x2_12f.png',
          feeding: 'feeding_64x64_6x2_12f.png',
        },
      },
    ],
  },
};

// ── Filter Catalog ──

export interface FilterData {
  id: FilterId;
  name: string;
  capacityBonus: number;
}

export const FILTERS: Record<FilterId, FilterData> = {
  basic_sponge: {
    id: 'basic_sponge',
    name: 'Basic Sponge',
    capacityBonus: 0,
  },
  hang_on_back: {
    id: 'hang_on_back',
    name: 'Hang-On-Back',
    capacityBonus: 3,
  },
  canister: {
    id: 'canister',
    name: 'Canister',
    capacityBonus: 6,
  },
  premium_canister: {
    id: 'premium_canister',
    name: 'Premium Canister',
    capacityBonus: 10,
  },
};

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

export const STORE_ITEMS: Record<string, StoreItemData> = {
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
  hang_on_back: {
    id: 'hang_on_back',
    name: 'Hang-On-Back Filter',
    type: StoreItemType.Filter,
    pomoCost: 50,
    prerequisite: {},
    description: 'A solid upgrade. Capacity bonus: +3.',
  },
  canister: {
    id: 'canister',
    name: 'Canister Filter',
    type: StoreItemType.Filter,
    pomoCost: 150,
    prerequisite: {},
    description: 'Professional-grade filtration. Capacity bonus: +6.',
  },
  premium_canister: {
    id: 'premium_canister',
    name: 'Premium Canister Filter',
    type: StoreItemType.Filter,
    pomoCost: 400,
    prerequisite: {},
    description: 'The best money can buy. Capacity bonus: +10.',
  },
  neon_tetra: {
    id: 'neon_tetra',
    name: 'Neon Tetra',
    type: StoreItemType.FishSpecies,
    pomoCost: 15,
    prerequisite: {},
    description: 'A tiny glowing schooling fish. Prefers groups of 3+.',
  },
  corydoras: {
    id: 'corydoras',
    name: 'Corydoras',
    type: StoreItemType.FishSpecies,
    pomoCost: 25,
    prerequisite: { minTankSize: TankSizeTier.Small },
    description: 'A friendly bottom-dweller. Prefers groups of 3+.',
  },
  gourami: {
    id: 'gourami',
    name: 'Gourami',
    type: StoreItemType.FishSpecies,
    pomoCost: 40,
    prerequisite: { minTankSize: TankSizeTier.Small },
    description: 'A graceful upper-water swimmer with vivid colors.',
  },
  otocinclus: {
    id: 'otocinclus',
    name: 'Otocinclus',
    type: StoreItemType.FishSpecies,
    pomoCost: 30,
    prerequisite: { minTankSize: TankSizeTier.Small },
    description: 'A tiny algae eater. Prefers groups of 3+.',
  },
  shrimp: {
    id: 'shrimp',
    name: 'Amano Shrimp',
    type: StoreItemType.FishSpecies,
    pomoCost: 10,
    prerequisite: {},
    description: 'A hardworking cleaner shrimp. Prefers groups of 3+.',
  },
};

// ── Game State Interfaces ──

export interface Fish {
  id: string;
  speciesId: FishSpeciesId;
  variantId: string;
  healthState: HealthState;
  sicknessTick: number;
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
    speciesId: FishSpeciesId;
    variantId: string;
    healthState: HealthState;
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

// ── State Migration ──

const LEGACY_SPECIES_MAP: Record<string, { speciesId: FishSpeciesId; variantId: string }> = {
  guppy: { speciesId: 'neon_tetra', variantId: 'standard' },
  betta: { speciesId: 'gourami', variantId: 'dwarf' },
  angelfish: { speciesId: 'gourami', variantId: 'cobalt_blue_dwarf' },
};

export function migrateState(state: GameState): GameState {
  const migratedFish = state.fish.map((f) => {
    const legacy = LEGACY_SPECIES_MAP[f.speciesId];
    const speciesId = legacy ? legacy.speciesId : f.speciesId;
    const species = FISH_SPECIES[speciesId];
    let variantId = (f as Fish).variantId;
    if (!variantId) {
      variantId = legacy ? legacy.variantId : (species?.variants[0]?.id ?? 'standard');
    }
    return { ...f, speciesId, variantId };
  });
  return { ...state, fish: migratedFish };
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
        speciesId: 'neon_tetra',
        variantId: 'standard',
        healthState: HealthState.Healthy,
        sicknessTick: 0,
      },
    ],
    lightOn: true,
    lightOffTimestamp: null,
  };
}
