# Data Model: Pomotank MVP

**Branch**: `001-pomotank-mvp` | **Date**: 2026-03-23

## Entity Relationship Overview

```
PlayerProfile (1) ──── (1) Tank
                            │
Tank (1) ──── (0..1) Filter
Tank (1) ──── (0..*) Fish
                        │
Fish (*) ──── (1) FishSpecies

StoreItem (standalone catalog)
```

## Entities

### PlayerProfile

The root persistence object. One per extension installation.

| Field               | Type     | Description                                            |
|---------------------|----------|--------------------------------------------------------|
| pomoBalance         | number   | Current spendable `pomo` point balance                 |
| totalPomoEarned     | number   | Lifetime `pomo` earned (never decreases)               |
| currentStreak       | number   | Consecutive well-timed maintenance count               |
| lastMaintenanceDate | string   | ISO date of last maintenance (for daily continuity)    |
| dailyContinuityDays | number   | Consecutive days with at least one maintenance action  |
| unlockedItems       | string[] | IDs of purchased store items                           |
| lastTickTimestamp   | number   | Unix ms of last game tick (for offline calculation)    |
| sessionStartTime    | number   | Unix ms when current work session timer started        |

### Tank

Single tank per player in MVP.

| Field          | Type   | Description                                                    |
|----------------|--------|----------------------------------------------------------------|
| sizeTier       | enum   | Nano, Small, Medium, Large, XL                                 |
| waterDirtiness | number | 0–100 scale; 0 = pristine, 100 = severely polluted            |
| algaeLevel     | number | 0–100 scale; 0 = clean, 100 = overgrown                       |
| filterId       | string | ID of equipped filter (nullable if none)                       |

**Derived properties**:
- `capacity`: Maximum fish load, determined by `sizeTier`
- `currentLoad`: Sum of fish in tank (count or weighted by species load)

### Tank Size Tiers

| Tier   | Capacity (fish count) |
|--------|----------------------|
| Nano   | 3                    |
| Small  | 5                    |
| Medium | 8                    |
| Large  | 12                   |
| XL     | 18                   |

### Fish

Individual fish instance in the tank.

| Field        | Type   | Description                                          |
|--------------|--------|------------------------------------------------------|
| id           | string | Unique identifier                                    |
| speciesId    | string | References a FishSpecies                             |
| hungerLevel  | number | 0–100 scale; 0 = full, 100 = starving               |
| healthState  | enum   | Healthy, Warning, Sick, Dead                         |
| sicknessTick | number | Tick count in current unhealthy state (for timing)   |

**State transitions** (healthState):

```
Healthy ──[poor conditions for ~2-3 hours]──→ Warning
Warning ──[poor conditions for ~3-4 more hours]──→ Sick
Sick ──[poor conditions for ~4-6 more hours]──→ Dead
Warning ──[conditions improve]──→ Healthy
Sick ──[conditions improve]──→ Warning ──→ Healthy
Dead ──[no recovery]──→ (removed, replaced via restart mechanic)
```

"Poor conditions" = hunger > 70 OR waterDirtiness > 70 OR algaeLevel > 80.

### FishSpecies

Static catalog. 5 species in MVP.

| Field              | Type   | Description                                        |
|--------------------|--------|----------------------------------------------------|
| id                 | string | Unique species identifier                          |
| name               | string | Display name                                       |
| hungerRate         | number | Hunger increase per tick (base rate)               |
| dirtinessLoad      | number | Contribution to water dirtiness per tick           |
| minTankSize        | enum   | Minimum tank size tier required                    |
| schoolingMin       | number | Recommended group size (soft warning if unmet)     |

**MVP Species (indicative — final balancing TBD)**:

| Species      | Hunger Rate | Dirtiness Load | Min Tank | Schooling |
|--------------|-------------|----------------|----------|-----------|
| Guppy        | Low         | Low            | Nano     | 1         |
| Neon Tetra   | Low         | Low            | Nano     | 3         |
| Corydoras    | Medium      | Medium         | Small    | 3         |
| Betta        | Medium      | Low            | Small    | 1         |
| Angelfish    | High        | High           | Medium   | 1         |

### Filter

Equipment item attached to a tank.

| Field            | Type   | Description                                      |
|------------------|--------|--------------------------------------------------|
| id               | string | Unique filter identifier                         |
| name             | string | Display name                                     |
| efficiency       | number | Multiplier (0.0–1.0) reducing dirtiness per tick |

**MVP Filters (indicative)**:

| Filter         | Efficiency | Pomo Cost |
|----------------|------------|-----------|
| Basic Sponge   | 0.15       | 0 (starter) |
| Hang-On-Back   | 0.30       | 50        |
| Canister       | 0.50       | 150       |
| Premium Canister| 0.70      | 400       |

Effective dirtiness per tick = baseDirtiness × (1 - filterEfficiency)

### StoreItem

Static catalog of purchasable items.

| Field          | Type   | Description                                         |
|----------------|--------|-----------------------------------------------------|
| id             | string | Unique item identifier                              |
| name           | string | Display name                                        |
| type           | enum   | TankUpgrade, Filter, FishSpecies                    |
| pomoCost       | number | Price in `pomo` points                              |
| prerequisite   | object | Conditions: minTankSize, requiredUnlocks, etc.      |
| description    | string | Short flavor text for store display                 |

## Maintenance Action Effects

| Action       | Primary Effect                    | Secondary Effect              |
|--------------|-----------------------------------|-------------------------------|
| Feed Fish    | All fish: hungerLevel → max(0, hungerLevel - 60) | None                |
| Change Water | waterDirtiness → max(0, waterDirtiness - 50)      | algaeLevel reduced by 10 |
| Clean Algae  | algaeLevel → 0                    | None                          |

## Deterioration Formulas (Per Tick)

These are baseline formulas; exact constants are balancing parameters.

```
hungerDelta = species.hungerRate × activityMultiplier
  where activityMultiplier = 1.0 (idle) or 1.15 (active coding)

dirtinessDelta = sum(fish.species.dirtinessLoad) × (1 - filter.efficiency)

algaeDelta = baseAlgaeRate + (waterDirtiness / 100) × dirtyAlgaeBonus
```

## Point Award Formulas

```
basePoints = 10 per action

timingBonus:
  if timeSinceLastMaintenance ∈ [20min, 30min]: ×1.5
  if timeSinceLastMaintenance ∈ [15min, 35min]: ×1.2
  else: ×1.0

streakMultiplier = 1.0 + (currentStreak × 0.1), capped at 2.0

dailyContinuityBonus = 5 × dailyContinuityDays, capped at 50

finalPoints = basePoints × timingBonus × streakMultiplier
  (dailyContinuityBonus added once per day on first maintenance)
```
