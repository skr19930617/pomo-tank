# Research: Tank Cost System Simplification

**Branch**: `006-tank-cost-system` | **Date**: 2026-03-25

## R1: Fish Capacity Cost Values

**Decision**: Assign a new `capacityCost` integer attribute to each species based on their relative "weight" in the tank.

| Species | capacityCost | Rationale |
|---------|-------------|-----------|
| Guppy | 1 | Starter fish, smallest footprint |
| Neon Tetra | 1 | Small schooling fish, same tier as guppy |
| Corydoras | 2 | Medium-sized bottom dweller |
| Betta | 2 | Medium solitary fish |
| Angelfish | 4 | Large fish, significant presence |

**Rationale**: Cost values are simple integers that reflect the fish's relative size and presence in the tank. They are deliberately decoupled from the old hungerRate/dirtinessLoad values since those attributes are being removed.

**Alternatives considered**:
- Deriving cost from old hungerRate + dirtinessLoad sum — rejected because those attributes are being removed and the coupling would be confusing
- Using pomo purchase price as a proxy — rejected because purchase price reflects rarity/desirability, not tank footprint

## R2: Tank Base Capacity and Filter Bonus Values

**Decision**: Additive model: maxCostCapacity = tankBaseCapacity + filterBonus

| Tank Tier | Base Capacity | Rationale |
|-----------|--------------|-----------|
| Nano | 4 | Fits ~4 guppies or 1 angelfish |
| Small | 8 | Meaningful upgrade from Nano |
| Medium | 14 | Supports diverse stocking |
| Large | 22 | Room for large fish combos |
| XL | 32 | Endgame capacity |

| Filter | Bonus | Rationale |
|--------|-------|-----------|
| Basic Sponge | +0 | Default, no bonus |
| Hang-On-Back | +3 | First meaningful upgrade |
| Canister | +6 | Mid-tier bonus |
| Premium Canister | +10 | Endgame bonus |

**Example combinations**:
- Nano + Basic Sponge = 4 (starter: 1 guppy auto-spawned, room for 3 more guppies)
- Small + HOB = 11 (5 neon tetras + 1 corydoras + 2 guppies = 9)
- Medium + Canister = 20 (2 angelfish + 3 corydoras + 3 neon tetras = 17)
- XL + Premium = 42 (endgame: many combinations possible)

**Alternatives considered**:
- Multiplicative (filter × tank) — rejected per clarification; additive is simpler and more predictable
- Fish-count limit kept alongside cost — rejected; cost system fully replaces fish-count

## R3: Tank-Wide Fixed Deterioration Rates

**Decision**: Deterioration rates are fixed constants calculated relative to the configured pomo session duration, not per-fish. Rates dynamically adjust when the user changes their session duration.

**Formula**:
- `hungerRatePerTick = DETERIORATION_THRESHOLD / (1 × sessionMinutes)` — reaches threshold in 1 pomo
- `waterRatePerTick = DETERIORATION_THRESHOLD / (3 × sessionMinutes)` — reaches threshold in 3 pomo
- `algaeRatePerTick = DETERIORATION_THRESHOLD / (5 × sessionMinutes)` — reaches threshold in 5 pomo

Where `DETERIORATION_THRESHOLD = 70` (aligns with existing health system's "poor conditions" threshold of >70 for hunger/water).

**Default (25-min session)**:
- Hunger: 70/25 = 2.8 per tick → hits 70 at 25 min (1 pomo)
- Water: 70/75 ≈ 0.93 per tick → hits 70 at 75 min (3 pomo)
- Algae: 70/125 = 0.56 per tick → hits 70 at 125 min (5 pomo)

**Key change**: The `isActiveCoding` multiplier (1.15×) on hunger is removed since per-fish hunger rates no longer exist. All deterioration is uniform.

**Rationale**: Tying rates to session duration ensures the "1/3/5 pomo" rhythm holds regardless of how long the user sets their sessions. This is critical for the pomodoro experience — maintenance timing should always align with natural break points.

**Alternatives considered**:
- Fixed tick rates independent of session duration — rejected because a 50-min session user would need to feed at 25 min (mid-session), breaking focus
- Single "tank condition" meter — rejected per clarification; user prefers three separate meters with different rhythms

## R4: Timer Configuration Integration

**Decision**: Use the existing `pomotank.workSessionMinutes` VSCode configuration (already declared in package.json with default 25). Currently this value is not wired into the game engine or timer display.

**Changes needed**:
- Read config value in extension.ts and pass to GameEngine
- GameEngine uses it for deterioration rate calculation
- Timer display uses it to determine the threshold for overtime coloring (replaces hardcoded POMO_THRESHOLD_MS)
- Points system timing windows scale proportionally with session duration

**Rationale**: The config already exists but is unused. Wiring it in is simpler than adding a new config mechanism.

## R5: Removal of Per-Fish Deterioration Attributes

**Decision**: Remove `hungerRate` and `dirtinessLoad` fields from FishSpeciesData interface and FISH_SPECIES catalog. Remove per-fish hunger calculation from deterioration.ts.

**Impact analysis**:
- `FishSpeciesData.hungerRate` — used in deterioration.ts hunger calc → replaced by tank-wide rate
- `FishSpeciesData.dirtinessLoad` — used in deterioration.ts water calc → replaced by tank-wide rate
- `Fish.hungerLevel` — currently per-fish, needs to become tank-wide `Tank.hungerLevel`
- `health.ts isPoorConditions` — currently reads fish.hungerLevel → reads tank.hungerLevel instead
- `ActionBar` feed action — currently reduces per-fish hunger → reduces tank-wide hunger

**Migration**: Existing save state with per-fish hungerLevel values will be migrated to a single tank-wide hungerLevel (take the average of all living fish).

## R6: Store Purchase Validation Changes

**Decision**: Replace fish-count capacity check with cost-based capacity check.

**Current**: `livingFish.length >= TANK_CAPACITY[sizeTier]`
**New**: `currentTotalCost + species.capacityCost > maxCostCapacity`

Where:
- `currentTotalCost = sum of capacityCost for all living fish`
- `maxCostCapacity = TANK_BASE_CAPACITY[sizeTier] + FILTER_BONUS[filterId]`

**Edge case**: Over-capacity after migration is allowed (existing fish stay), but no new fish can be added until cost drops below capacity (fish die or capacity is upgraded).

## R7: HUD Cost Display Placement

**Decision**: Add cost display to the HUD center area, replacing the individual H/W/A/S stats in non-compact mode with a cost indicator alongside simplified tank status.

**Layout**: Between timer (left) and coin balance (right), display cost as a fish icon + "current/max" format (e.g., "3/10"). Color-coded: normal (white), warning at 80%+ capacity (yellow), full/over (red).

**Rationale**: The center area currently shows H/W/A/S percentages. Since deterioration is now tank-wide with predictable rhythms, granular percentage display is less critical. The cost ratio is more actionable information.

Note: H/W/A/S stats remain visible but can be simplified or moved to a detail view in future iterations. For this feature, we keep them alongside the cost display in non-compact mode.
