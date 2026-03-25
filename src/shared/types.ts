// ── Shared type definitions ──
// Single source of truth for all IDs, enums, and constants.
// Imported by both extension (Node) and webview (browser) bundles.

// ── Enums (re-exported from here as canonical source) ──

export enum TankSizeTier {
  Nano = 'Nano',
  Small = 'Small',
  Medium = 'Medium',
  Large = 'Large',
  XL = 'XL',
}

export enum HealthState {
  Healthy = 'Healthy',
  Warning = 'Warning',
  Sick = 'Sick',
  Dead = 'Dead',
}

export enum StoreItemType {
  TankUpgrade = 'TankUpgrade',
  Filter = 'Filter',
  FishSpecies = 'FishSpecies',
}

// ── ID union literal types ──

export type FishSpeciesId = 'guppy' | 'neon_tetra' | 'corydoras' | 'betta' | 'angelfish';

export type FilterId = 'basic_sponge' | 'hang_on_back' | 'canister' | 'premium_canister';

export type StoreItemId =
  | 'tank_small'
  | 'tank_medium'
  | 'tank_large'
  | 'tank_xl'
  | 'hang_on_back'
  | 'canister'
  | 'premium_canister'
  | 'neon_tetra'
  | 'corydoras'
  | 'betta'
  | 'angelfish';

// ── Action type ──

export type ActionType = 'feedFish' | 'changeWater' | 'cleanAlgae';

// ── Constants ──

export const TANK_BASE_CAPACITY: Record<TankSizeTier, number> = {
  [TankSizeTier.Nano]: 4,
  [TankSizeTier.Small]: 8,
  [TankSizeTier.Medium]: 14,
  [TankSizeTier.Large]: 22,
  [TankSizeTier.XL]: 32,
};

export const DETERIORATION_THRESHOLD = 70;

export const TANK_SIZE_ORDER: TankSizeTier[] = [
  TankSizeTier.Nano,
  TankSizeTier.Small,
  TankSizeTier.Medium,
  TankSizeTier.Large,
  TankSizeTier.XL,
];

export const TANK_RENDER_SIZES: Record<TankSizeTier, { width: number; height: number }> = {
  [TankSizeTier.Nano]: { width: 200, height: 150 },
  [TankSizeTier.Small]: { width: 260, height: 195 },
  [TankSizeTier.Medium]: { width: 320, height: 240 },
  [TankSizeTier.Large]: { width: 370, height: 278 },
  [TankSizeTier.XL]: { width: 400, height: 300 },
};

export const DESK_HEIGHT = 30;
export const LIGHT_BAR_HEIGHT = 20;

// ── HUD constants ──
export const HUD_HEIGHT = 16;
export const DEFAULT_SESSION_MINUTES = 25;
export const ACTION_BAR_HEIGHT = 20;
