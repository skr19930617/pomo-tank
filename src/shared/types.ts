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

export enum SwimLayer {
  upper = 'upper',
  middle = 'middle',
  lower = 'lower',
  all = 'all',
}

export enum Personality {
  calm = 'calm',
  active = 'active',
  timid = 'timid',
  social = 'social',
}

// ── ID union literal types ──

export type GenusId = 'neon_tetra' | 'corydoras' | 'gourami' | 'otocinclus' | 'shrimp';

/** @deprecated Use GenusId instead */
export type FishSpeciesId = GenusId;

export type AnimState = 'swim' | 'weak' | 'feeding';

// ── Genus/Species hierarchy (new) ──

export interface SpriteSet {
  swim: string;
  weak?: string;
  feeding?: string;
}

export interface SpeciesConfig {
  id: string;
  displayName: string;
  sprites: SpriteSet;
  minSizeMm: number;
  maxSizeMm: number;
  minLifespanYears: number;
  maxLifespanYears: number;
  pomoCost: number;
}

export interface GenusConfig {
  id: GenusId;
  displayName: string;
  swimLayer: SwimLayer;
  personality: Personality;
  schooling: boolean;
  baseSpeed: number;
  hasFeedingAnim: boolean;
  capacityCost: number;
  minTankSize: TankSizeTier;
  species: SpeciesConfig[];
}

// ── Legacy types (kept for backward compatibility during migration) ──

export interface VariantConfig {
  id: string;
  name: string;
  sprites: { swim: string; weak?: string; feeding?: string };
}

export interface FishSpeciesConfig {
  id: FishSpeciesId;
  name: string;
  capacityCost: number;
  minTankSize: TankSizeTier;
  schooling: boolean;
  swimZone: { min: number; max: number };
  baseSpeed: number;
  minSize: number;
  maxSize: number;
  variants: VariantConfig[];
  hasFeedingAnim: boolean;
}

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
  | 'gourami'
  | 'otocinclus'
  | 'shrimp';

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

// ── Swim Layer Ranges ──
export const SWIM_LAYER_RANGES: Record<SwimLayer, { min: number; max: number }> = {
  [SwimLayer.upper]: { min: 0.05, max: 0.35 },
  [SwimLayer.middle]: { min: 0.25, max: 0.75 },
  [SwimLayer.lower]: { min: 0.6, max: 0.95 },
  [SwimLayer.all]: { min: 0.05, max: 0.95 },
};

// ── Tank Dimensions (mm) ──
export const TANK_DIMENSIONS_MM: Record<TankSizeTier, { widthMm: number; heightMm: number }> = {
  [TankSizeTier.Nano]: { widthMm: 200, heightMm: 150 },
  [TankSizeTier.Small]: { widthMm: 300, heightMm: 225 },
  [TankSizeTier.Medium]: { widthMm: 450, heightMm: 300 },
  [TankSizeTier.Large]: { widthMm: 600, heightMm: 400 },
  [TankSizeTier.XL]: { widthMm: 900, heightMm: 600 },
};
