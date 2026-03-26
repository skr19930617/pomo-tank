# Data Model: Tank Config Refactor

## New Types

### TankId (union literal type)

```
'nano_20' | 'small_30' | 'medium_45' | 'large_60' | 'xl_90'
```

Replaces `TankSizeTier` enum.

### TankConfig (interface)

| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | TankId | Required, unique | Tank identifier |
| displayName | string | Required | Display name (e.g. "20cm Cube") |
| widthMm | number | > 0 | Real-world width in mm |
| heightMm | number | > 0 | Real-world height in mm |
| depthMm | number | > 0 | Real-world depth in mm |
| baseCapacity | number | >= 1 | Fish capacity units (before filter bonus) |
| pomoCost | number | >= 0 | Purchase cost (0 = starter tank) |
| prerequisite | { requiredUnlocks?: string[] } | Optional | Purchase prerequisites |
| description | string | Required | Store display text |
| renderWidth | number | > 0 | Render size in logical pixels |
| renderHeight | number | > 0 | Render size in logical pixels |

### Tank config values

| id | displayName | widthMm | heightMm | depthMm | baseCapacity | pomoCost | prerequisite |
|----|-------------|---------|----------|---------|-------------|----------|-------------|
| nano_20 | 20cm Cube | 200 | 200 | 200 | 4 | 0 | (starter) |
| small_30 | 30cm Tank | 300 | 250 | 200 | 8 | 30 | — |
| medium_45 | 45cm Tank | 450 | 300 | 240 | 14 | 100 | small_30 |
| large_60 | 60cm Tank | 600 | 360 | 300 | 22 | 250 | medium_45 |
| xl_90 | 90cm Tank | 900 | 450 | 350 | 32 | 500 | large_60 |

## Modified Types

### Tank (state interface)

| Field | Before | After | Notes |
|-------|--------|-------|-------|
| sizeTier | TankSizeTier | TankId | Renamed conceptually; stores tank ID |

The field name should change from `sizeTier` to `tankId` for clarity.

### GenusConfig

| Field | Change |
|-------|--------|
| minTankSize | **REMOVED** |

No replacement field. Fish-to-tank compatibility is calculated dynamically.

### Fish size restriction function

```
canFishFitInTank(genus: GenusConfig, tankConfig: TankConfig): boolean
  maxFishSize = max(genus.species[].maxSizeMm)
  return tankConfig.widthMm >= maxFishSize * 4
```

### StoreItemPrerequisite

| Field | Change |
|-------|--------|
| minTankSize | **REMOVED** — fish restriction is now size-based, not prerequisite-based |

### WebviewToExtensionMessage (switchTank)

| Field | Before | After |
|-------|--------|-------|
| sizeTier: TankSizeTier | — | tankId: TankId |

### GameStateSnapshot

| Field | Before | After |
|-------|--------|-------|
| tank.sizeTier | TankSizeTier | tank.tankId: TankId |

### FilterConfig.prerequisite

| Field | Before | After |
|-------|--------|-------|
| minTankSize?: TankSizeTier | — | minTankId?: TankId |

Filter prerequisites should reference tank IDs instead of tier enum.

## State Migration

### Detection

Old format: `state.tank.sizeTier` is a `TankSizeTier` enum string value (`'Nano'`, `'Small'`, etc.)
New format: `state.tank.tankId` is a `TankId` string (`'nano_20'`, `'small_30'`, etc.)

Detection: if `state.tank.sizeTier` exists and `state.tank.tankId` does not exist → migrate.

### Migration map

| Old `sizeTier` | New `tankId` |
|---------------|-------------|
| 'Nano' | 'nano_20' |
| 'Small' | 'small_30' |
| 'Medium' | 'medium_45' |
| 'Large' | 'large_60' |
| 'XL' | 'xl_90' |

| Old `unlockedItems` entry | New entry |
|--------------------------|-----------|
| 'tank_small' | 'small_30' |
| 'tank_medium' | 'medium_45' |
| 'tank_large' | 'large_60' |
| 'tank_xl' | 'xl_90' |

## Visual Constants Changes

### New constants

| Constant | Value | Description |
|----------|-------|-------------|
| LIGHT_GAP | 6 | Pixel gap between light bottom and tank top |
| LIGHT_DIFFUSION_OVERHANG | 12 | Extra width (per side) of light cone at tank level |
| HUD_BOTTOM_PAD | 8 | Additional padding below HUD |

### Modified constants

| Constant | Before | After | Reason |
|----------|--------|-------|--------|
| TANK_BASE_CAPACITY | Record<TankSizeTier, number> | **REMOVED** | Merged into TankConfig.baseCapacity |
| TANK_RENDER_SIZES | Record<TankSizeTier, ...> | **REMOVED** | Merged into TankConfig.renderWidth/renderHeight |
| TANK_DIMENSIONS_MM | Record<TankSizeTier, ...> | **REMOVED** | Merged into TankConfig.widthMm/heightMm |
| TANK_SIZE_ORDER | TankSizeTier[] | **REMOVED** | Replace with getAllTanks() ordered array |
| TankSizeTier | enum | **REMOVED** | Replaced by TankId type |

## Removed Types

| Type | Replacement |
|------|-------------|
| TankSizeTier (enum) | TankId (union literal type) |
| TANK_BASE_CAPACITY | TankConfig.baseCapacity |
| TANK_SIZE_ORDER | getAllTanks() returns ordered array |
| TANK_RENDER_SIZES | TankConfig.renderWidth / renderHeight |
| TANK_DIMENSIONS_MM | TankConfig.widthMm / heightMm |
