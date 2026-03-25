// ── Re-export shared types for backward compatibility ──
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
  FishSpeciesId,
  FilterId,
  StoreItemId,
  ActionType,
  AnimState,
  VariantConfig,
  FishSpeciesConfig,
  GenusConfig,
  SpeciesConfig,
  SpriteSet,
} from '../shared/types';

import {
  TankSizeTier,
  HealthState,
  StoreItemType,
  type GenusId,
  type FilterId,
} from '../shared/types';

import { getGenus, buildFishStoreItems } from './species';

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
};

// Fish store items are generated dynamically from species configs
export const STORE_ITEMS: Record<string, StoreItemData> = {
  ...BASE_STORE_ITEMS,
  ...buildFishStoreItems(),
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

/** Maps legacy species names to new genus/species IDs. */
const LEGACY_SPECIES_MAP: Record<string, { genusId: GenusId; speciesId: string }> = {
  guppy: { genusId: 'neon_tetra', speciesId: 'standard' },
  betta: { genusId: 'gourami', speciesId: 'dwarf' },
  angelfish: { genusId: 'gourami', speciesId: 'cobalt_blue_dwarf' },
};

export function migrateState(state: GameState): GameState {
  const migratedFish = state.fish.map((f) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = f as any;

    // Already migrated (has genusId)
    if (raw.genusId && raw.bodyLengthMm !== undefined) {
      return f;
    }

    // Detect old format: had speciesId (as genus) and variantId (as species)
    const oldSpeciesId: string = raw.speciesId ?? raw.genusId ?? 'neon_tetra';
    const oldVariantId: string = raw.variantId ?? raw.speciesId ?? 'standard';

    // Check for legacy species names (guppy, betta, angelfish)
    const legacy = LEGACY_SPECIES_MAP[oldSpeciesId];
    const genusId: GenusId = legacy ? legacy.genusId : (oldSpeciesId as GenusId);
    const speciesId = legacy ? legacy.speciesId : oldVariantId;

    // Look up genus/species config for defaults
    const genus = getGenus(genusId);
    const speciesConfig = genus?.species.find((s) => s.id === speciesId) ?? genus?.species[0];

    const midpointMm = speciesConfig
      ? (speciesConfig.minSizeMm + speciesConfig.maxSizeMm) / 2
      : 25;
    const lifespanWeeks = speciesConfig
      ? Math.round(
          (speciesConfig.minLifespanYears +
            Math.random() * (speciesConfig.maxLifespanYears - speciesConfig.minLifespanYears)) *
            52,
        )
      : 208;

    const migrated: Fish = {
      id: raw.id ?? generateFishId(),
      genusId,
      speciesId: speciesConfig?.id ?? speciesId,
      healthState: raw.healthState ?? HealthState.Healthy,
      sicknessTick: raw.sicknessTick ?? 0,
      bodyLengthMm: midpointMm,
      ageWeeks: 0,
      lifespanWeeks,
      maintenanceQuality: 0.8,
      purchasedAt: Date.now(),
    };
    return migrated;
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
