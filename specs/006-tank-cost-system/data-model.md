# Data Model: Tank Cost System Simplification

**Branch**: `006-tank-cost-system` | **Date**: 2026-03-25

## Entity Changes

### FishSpeciesData (modified)

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| id | FishSpeciesId | unchanged | |
| name | string | unchanged | |
| ~~hungerRate~~ | ~~number~~ | **removed** | Replaced by tank-wide fixed rate |
| ~~dirtinessLoad~~ | ~~number~~ | **removed** | Replaced by tank-wide fixed rate |
| capacityCost | number (integer) | **added** | New: tank capacity cost for this species |
| minTankSize | TankSizeTier | unchanged | |
| schoolingMin | number | unchanged | |

**capacityCost values**:

| Species | capacityCost |
|---------|-------------|
| guppy | 1 |
| neon_tetra | 1 |
| corydoras | 2 |
| betta | 2 |
| angelfish | 4 |

### Fish (modified)

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| id | string | unchanged | |
| speciesId | FishSpeciesId | unchanged | |
| ~~hungerLevel~~ | ~~number~~ | **removed** | Hunger is now tank-wide |
| healthState | HealthState | unchanged | |
| sicknessTick | number | unchanged | |

### Tank (modified)

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| sizeTier | TankSizeTier | unchanged | |
| hungerLevel | number (0-100) | **added** | Moved from per-fish to tank-wide |
| waterDirtiness | number (0-100) | unchanged | |
| algaeLevel | number (0-100) | unchanged | |
| filterId | FilterId \| null | unchanged | |

### FilterData (modified)

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| id | FilterId | unchanged | |
| name | string | unchanged | |
| ~~efficiency~~ | ~~number~~ | **removed** | Filters no longer affect deterioration |
| capacityBonus | number (integer) | **added** | Flat additive bonus to max capacity |

**capacityBonus values**:

| Filter | capacityBonus |
|--------|--------------|
| basic_sponge | 0 |
| hang_on_back | 3 |
| canister | 6 |
| premium_canister | 10 |

### New Constants

**TANK_BASE_CAPACITY** (replaces TANK_CAPACITY):

| TankSizeTier | baseCapacity |
|-------------|-------------|
| Nano | 4 |
| Small | 8 |
| Medium | 14 |
| Large | 22 |
| XL | 32 |

**DETERIORATION_THRESHOLD**: 70 (the level at which health system considers conditions "poor")

### Derived Values (not stored)

- `maxCostCapacity = TANK_BASE_CAPACITY[sizeTier] + FILTERS[filterId].capacityBonus`
- `currentTotalCost = sum(FISH_SPECIES[fish.speciesId].capacityCost for each living fish)`
- `hungerRatePerTick = DETERIORATION_THRESHOLD / (1 × sessionMinutes)`
- `waterRatePerTick = DETERIORATION_THRESHOLD / (3 × sessionMinutes)`
- `algaeRatePerTick = DETERIORATION_THRESHOLD / (5 × sessionMinutes)`

### GameState (modified)

No structural change at top level. Changes propagate through Tank and Fish sub-entities.

### GameStateSnapshot (modified for webview)

| Field | Change | Notes |
|-------|--------|-------|
| tank.hungerLevel | **added** | Tank-wide hunger for HUD display |
| capacity.current | **added** | Sum of living fish capacity costs |
| capacity.max | **added** | Tank base + filter bonus |
| session.sessionMinutes | **added** | Configured session duration |

### PlayerProfile (unchanged)

No changes. pomoBalance, streak, and session tracking remain as-is.

## State Transitions

### Tank Condition Lifecycle (simplified)

```
Good Condition ──[tick: rates accumulate]──> Warning Zone (>70)
     ^                                           │
     │                                           v
     └──[maintenance action: reset]──── Poor Condition
```

- Hunger: accumulates at fixed rate → feeding resets (subtract 60, min 0)
- Water: accumulates at fixed rate → water change resets (subtract 50, also -10 algae)
- Algae: accumulates at fixed rate (+ water-scaled bonus) → cleaning sets to 0

### Fish Health (unchanged logic, different input)

```
Healthy ──[sicknessTick >= 120]──> Warning ──[>= 300]──> Sick ──[>= 540]──> Dead
   ^                                                                          │
   └────────────[sicknessTick decreases by 2/tick in good conditions]─────────┘
```

`isPoorConditions` now reads tank.hungerLevel instead of fish.hungerLevel.

## Migration Strategy

For existing save state with the old schema:

1. **Per-fish hungerLevel → tank.hungerLevel**: Average all living fish hunger levels
2. **TANK_CAPACITY → TANK_BASE_CAPACITY**: Direct replacement, old fish-count limits no longer apply
3. **Filter efficiency → capacityBonus**: Map old filter IDs to new bonus values
4. **Over-capacity tolerance**: If existing fish total cost > maxCostCapacity, allow but block new purchases
5. **Schema version**: Bump version in persisted state to trigger migration on load
