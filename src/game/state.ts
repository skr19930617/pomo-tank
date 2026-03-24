// ── Enums ──

export enum TankSizeTier {
  Nano = "Nano",
  Small = "Small",
  Medium = "Medium",
  Large = "Large",
  XL = "XL",
}

export const TANK_CAPACITY: Record<TankSizeTier, number> = {
  [TankSizeTier.Nano]: 3,
  [TankSizeTier.Small]: 5,
  [TankSizeTier.Medium]: 8,
  [TankSizeTier.Large]: 12,
  [TankSizeTier.XL]: 18,
};

export const TANK_SIZE_ORDER: TankSizeTier[] = [
  TankSizeTier.Nano,
  TankSizeTier.Small,
  TankSizeTier.Medium,
  TankSizeTier.Large,
  TankSizeTier.XL,
];

export enum HealthState {
  Healthy = "Healthy",
  Warning = "Warning",
  Sick = "Sick",
  Dead = "Dead",
}

export enum StoreItemType {
  TankUpgrade = "TankUpgrade",
  Filter = "Filter",
  FishSpecies = "FishSpecies",
}

// ── Fish Species Catalog ──

export interface FishSpeciesData {
  id: string;
  name: string;
  hungerRate: number; // hunger increase per tick (base)
  dirtinessLoad: number; // contribution to water dirtiness per tick
  minTankSize: TankSizeTier;
  schoolingMin: number; // recommended group size
}

export const FISH_SPECIES: Record<string, FishSpeciesData> = {
  guppy: {
    id: "guppy",
    name: "Guppy",
    hungerRate: 2,
    dirtinessLoad: 1,
    minTankSize: TankSizeTier.Nano,
    schoolingMin: 1,
  },
  neon_tetra: {
    id: "neon_tetra",
    name: "Neon Tetra",
    hungerRate: 2,
    dirtinessLoad: 1,
    minTankSize: TankSizeTier.Nano,
    schoolingMin: 3,
  },
  corydoras: {
    id: "corydoras",
    name: "Corydoras",
    hungerRate: 3,
    dirtinessLoad: 2,
    minTankSize: TankSizeTier.Small,
    schoolingMin: 3,
  },
  betta: {
    id: "betta",
    name: "Betta",
    hungerRate: 3,
    dirtinessLoad: 1,
    minTankSize: TankSizeTier.Small,
    schoolingMin: 1,
  },
  angelfish: {
    id: "angelfish",
    name: "Angelfish",
    hungerRate: 5,
    dirtinessLoad: 3,
    minTankSize: TankSizeTier.Medium,
    schoolingMin: 1,
  },
};

// ── Filter Catalog ──

export interface FilterData {
  id: string;
  name: string;
  efficiency: number; // 0.0–1.0 multiplier reducing dirtiness per tick
}

export const FILTERS: Record<string, FilterData> = {
  basic_sponge: {
    id: "basic_sponge",
    name: "Basic Sponge",
    efficiency: 0.15,
  },
  hang_on_back: {
    id: "hang_on_back",
    name: "Hang-On-Back",
    efficiency: 0.3,
  },
  canister: {
    id: "canister",
    name: "Canister",
    efficiency: 0.5,
  },
  premium_canister: {
    id: "premium_canister",
    name: "Premium Canister",
    efficiency: 0.7,
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
  // Tank upgrades
  tank_small: {
    id: "tank_small",
    name: "Small Tank",
    type: StoreItemType.TankUpgrade,
    pomoCost: 30,
    prerequisite: {},
    description: "A cozy upgrade. Holds up to 5 fish.",
  },
  tank_medium: {
    id: "tank_medium",
    name: "Medium Tank",
    type: StoreItemType.TankUpgrade,
    pomoCost: 100,
    prerequisite: { requiredUnlocks: ["tank_small"] },
    description: "Room to grow. Holds up to 8 fish.",
  },
  tank_large: {
    id: "tank_large",
    name: "Large Tank",
    type: StoreItemType.TankUpgrade,
    pomoCost: 250,
    prerequisite: { requiredUnlocks: ["tank_medium"] },
    description: "A proper aquarium. Holds up to 12 fish.",
  },
  tank_xl: {
    id: "tank_xl",
    name: "XL Tank",
    type: StoreItemType.TankUpgrade,
    pomoCost: 500,
    prerequisite: { requiredUnlocks: ["tank_large"] },
    description: "The ultimate tank. Holds up to 18 fish.",
  },
  // Filters
  hang_on_back: {
    id: "hang_on_back",
    name: "Hang-On-Back Filter",
    type: StoreItemType.Filter,
    pomoCost: 50,
    prerequisite: {},
    description: "A solid upgrade. Reduces dirtiness by 30%.",
  },
  canister: {
    id: "canister",
    name: "Canister Filter",
    type: StoreItemType.Filter,
    pomoCost: 150,
    prerequisite: {},
    description: "Professional-grade filtration. Reduces dirtiness by 50%.",
  },
  premium_canister: {
    id: "premium_canister",
    name: "Premium Canister Filter",
    type: StoreItemType.Filter,
    pomoCost: 400,
    prerequisite: {},
    description: "The best money can buy. Reduces dirtiness by 70%.",
  },
  // Fish species
  neon_tetra: {
    id: "neon_tetra",
    name: "Neon Tetra",
    type: StoreItemType.FishSpecies,
    pomoCost: 15,
    prerequisite: {},
    description: "A tiny glowing schooling fish. Prefers groups of 3+.",
  },
  corydoras: {
    id: "corydoras",
    name: "Corydoras",
    type: StoreItemType.FishSpecies,
    pomoCost: 25,
    prerequisite: { minTankSize: TankSizeTier.Small },
    description: "A friendly bottom-dweller. Prefers groups of 3+.",
  },
  betta: {
    id: "betta",
    name: "Betta",
    type: StoreItemType.FishSpecies,
    pomoCost: 30,
    prerequisite: { minTankSize: TankSizeTier.Small },
    description: "A beautiful, independent fighter fish.",
  },
  angelfish: {
    id: "angelfish",
    name: "Angelfish",
    type: StoreItemType.FishSpecies,
    pomoCost: 60,
    prerequisite: { minTankSize: TankSizeTier.Medium },
    description: "An elegant, larger fish. Hungry and messy but stunning.",
  },
};

// ── Game State Interfaces ──

export interface Fish {
  id: string;
  speciesId: string;
  hungerLevel: number; // 0–100
  healthState: HealthState;
  sicknessTick: number; // ticks in current unhealthy state
}

export interface Tank {
  sizeTier: TankSizeTier;
  waterDirtiness: number; // 0–100
  algaeLevel: number; // 0–100
  filterId: string | null;
}

export interface PlayerProfile {
  pomoBalance: number;
  totalPomoEarned: number;
  currentStreak: number;
  lastMaintenanceDate: string; // ISO date string
  dailyContinuityDays: number;
  unlockedItems: string[];
  lastTickTimestamp: number; // Unix ms
  sessionStartTime: number; // Unix ms
}

export interface GameState {
  player: PlayerProfile;
  tank: Tank;
  fish: Fish[];
}

// ── Snapshot for webview communication ──

export interface GameStateSnapshot {
  tank: {
    sizeTier: string;
    waterDirtiness: number;
    algaeLevel: number;
    filterId: string | null;
  };
  fish: Array<{
    id: string;
    speciesId: string;
    hungerLevel: number;
    healthState: string;
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
  };
  store: {
    items: Array<{
      id: string;
      name: string;
      type: string;
      pomoCost: number;
      affordable: boolean;
      meetsPrerequisites: boolean;
    }>;
  };
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
      lastMaintenanceDate: "",
      dailyContinuityDays: 0,
      unlockedItems: [],
      lastTickTimestamp: now,
      sessionStartTime: now,
    },
    tank: {
      sizeTier: TankSizeTier.Nano,
      waterDirtiness: 0,
      algaeLevel: 0,
      filterId: "basic_sponge",
    },
    fish: [
      {
        id: generateFishId(),
        speciesId: "guppy",
        hungerLevel: 0,
        healthState: HealthState.Healthy,
        sicknessTick: 0,
      },
    ],
  };
}
