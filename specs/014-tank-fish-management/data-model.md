# Data Model: Tank & Fish Management Settings

**Feature**: 014-tank-fish-management
**Date**: 2026-03-26

## Modified Entities

### Fish (extended)

| Field | Type | Status | Description |
|-------|------|--------|-------------|
| id | string | Existing | Unique fish identifier |
| genusId | GenusId | Existing | Fish genus |
| speciesId | string | Existing | Fish species variant |
| healthState | HealthState | Existing | Current health |
| sicknessTick | number | Existing | Sickness counter (internal only) |
| bodyLengthMm | number | Existing | Body length |
| ageWeeks | number | Existing | Age in weeks |
| lifespanWeeks | number | Existing | Expected lifespan |
| maintenanceQuality | number | Existing | Care quality score |
| purchasedAt | number | Existing | Purchase timestamp (internal only) |
| **customName** | string \| undefined | **New** | User-given name, max 20 chars. Undefined = use species display name |

### GameStateSnapshot.player (extended)

| Field | Type | Status | Description |
|-------|------|--------|-------------|
| pomoBalance | number | Existing | Current pomo currency |
| currentStreak | number | Existing | Maintenance streak |
| dailyContinuityDays | number | Existing | Daily continuity |
| **unlockedItems** | string[] | **New** | List of unlocked item IDs (tank sizes, filters, etc.) |

### GameStateSnapshot.fish array (extended)

| Field | Type | Status | Description |
|-------|------|--------|-------------|
| id | string | Existing | Fish ID |
| genusId | GenusId | Existing | Genus |
| speciesId | string | Existing | Species |
| healthState | HealthState | Existing | Health |
| bodyLengthMm | number | Existing | Size |
| ageWeeks | number | Existing | Age |
| lifespanWeeks | number | Existing | Lifespan |
| maintenanceQuality | number | Existing | Care quality |
| **customName** | string \| undefined | **New** | Custom name if set |

## New Message Types

### Webview → Extension

| Message Type | Fields | Description |
|-------------|--------|-------------|
| `switchTank` | `sizeTier: TankSizeTier` | Request to change tank to an unlocked size |
| `switchFilter` | `filterId: FilterId` | Request to change to an unlocked filter |
| `renameFish` | `fishId: string, customName: string` | Set or clear a fish's custom name |
| `removeFish` | `fishId: string` | Remove a fish from the tank |

### Extension → Webview

| Message Type | Fields | Description |
|-------------|--------|-------------|
| `managementResult` | `action: string, success: boolean, message?: string` | Result of any management action |

## Validation Rules

### Tank Switch
- `sizeTier` must match an ID in `player.unlockedItems` OR be `TankSizeTier.Nano` (always available)
- `calculateCurrentCost(state.fish)` must be `<=` `TANK_BASE_CAPACITY[newSize] + filterBonus`
- On failure: return `{ success: false, message: "Capacity exceeded" }`

### Filter Switch
- `filterId` must match an ID in `player.unlockedItems` OR be `'basic_sponge'` (always available)
- `calculateCurrentCost(state.fish)` must be `<=` `TANK_BASE_CAPACITY[currentSize] + newFilterBonus`
- On failure: return `{ success: false, message: "Capacity exceeded" }`

### Fish Rename
- `fishId` must exist in `state.fish`
- `customName` trimmed, max 20 characters. Empty string = clear name (set to undefined)

### Fish Remove
- `fishId` must exist in `state.fish`
- Fish is removed from `state.fish` array (both living and dead fish can be removed)
- Capacity is freed immediately
