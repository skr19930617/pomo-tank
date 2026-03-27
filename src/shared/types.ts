// ── Shared type definitions ──
// Single source of truth for all IDs, enums, and constants.
// Imported by both extension (Node) and webview (browser) bundles.

// ── Enums (re-exported from here as canonical source) ──

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

export type AnimState = 'swim' | 'weak' | 'feeding';

// ── Tank Config Types ──

export type TankId = 'nano_20' | 'small_30' | 'medium_45' | 'large_60' | 'xl_90';

export interface TankConfig {
  id: TankId;
  displayName: string;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  baseCapacity: number;
  pomoCost: number;
  prerequisite: { requiredUnlocks?: string[] };
  description: string;
  renderWidth: number;
  renderHeight: number;
}

// ── Genus/Species hierarchy ──

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
  species: SpeciesConfig[];
}

export type FilterId = 'basic_sponge' | 'hang_on_back' | 'canister' | 'premium_canister';

// ── Filter Config Types ──

export type FilterMountType = 'internal' | 'hang_on_back' | 'canister';

export interface FilterVisual {
  relativeSize: number;
  primaryColor: string;
  accentColor: string;
  width: number;
  height: number;
}

export interface FilterConfig {
  id: FilterId;
  displayName: string;
  capacityBonus: number;
  pomoCost: number;
  prerequisite: { minTankId?: TankId; requiredUnlocks?: string[] };
  description: string;
  mount: FilterMountType;
  visual: FilterVisual;
}

export type StoreItemId =
  | 'small_30'
  | 'medium_45'
  | 'large_60'
  | 'xl_90'
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

export const DETERIORATION_THRESHOLD = 70;

export const DESK_HEIGHT = 30;
export const LIGHT_BAR_HEIGHT = 20;

// ── HUD constants ──
export const HUD_HEIGHT = 16;
export const HUD_BOTTOM_PAD = 8;

// ── Light spacing constants ──
/** Light-to-tank gap as a fraction of raw tank height (e.g. 0.08 = 8%) */
export const LIGHT_GAP_RATIO = 0.08;
export const DEFAULT_SESSION_MINUTES = 25;

// ── Timer Mode ──
export type TimerMode = 'focus' | 'break';

// ── User Settings ──
export interface UserSettings {
  focusMinutes: number;
  breakMinutes: number;
}

export const FOCUS_MIN = 1;
export const FOCUS_MAX = 120;
export const BREAK_MIN = 0;
export const BREAK_MAX = 60;

export const DEFAULT_USER_SETTINGS: UserSettings = {
  focusMinutes: 25,
  breakMinutes: 5,
};

// ── Swim Layer Ranges ──
export const SWIM_LAYER_RANGES: Record<SwimLayer, { min: number; max: number }> = {
  [SwimLayer.upper]: { min: 0.05, max: 0.35 },
  [SwimLayer.middle]: { min: 0.25, max: 0.75 },
  [SwimLayer.lower]: { min: 0.6, max: 0.95 },
  [SwimLayer.all]: { min: 0.05, max: 0.95 },
};
