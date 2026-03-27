# Data Model: Fish Species Hierarchy Config

## Entities

### SwimLayer (Enum)

Named vertical zone in the tank water column.

| Value | Vertical Range | Description |
|-------|---------------|-------------|
| upper | 5%–35% | Surface-dwelling fish |
| middle | 25%–75% | Mid-water swimmers |
| lower | 60%–95% | Bottom dwellers |
| all | 5%–95% | Full water column |

### Personality (Enum)

Behavioral trait affecting movement patterns.

| Value | Description |
|-------|-------------|
| calm | Slow, smooth movement with minimal direction changes |
| active | Frequent direction changes, higher base speed |
| timid | Prefers edges, avoids center of tank |
| social | Stays close to other fish of same genus |

### GenusConfig

Genus-level configuration defining shared behavioral traits.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | Unique, kebab-case | Genus identifier (e.g., "neon_tetra") |
| displayName | string | Non-empty | Human-readable name (e.g., "Neon Tetra") |
| swimLayer | SwimLayer | Required | Preferred vertical zone |
| personality | Personality | Required | Movement behavior type |
| schoolingMin | number | ≥ 1 | Minimum group size for schooling |
| baseSpeed | number | > 0 | Base movement speed multiplier |
| hasFeedingAnim | boolean | Required | Whether species has feeding animation |
| capacityCost | number | ≥ 1 | Tank capacity units per fish |
| minTankSize | TankSizeTier | Required | Minimum tank size for purchase |
| species | SpeciesConfig[] | ≥ 1 entry | Species within this genus |

### SpeciesConfig

Species-level configuration defining visual and physical traits.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | Unique within genus | Species identifier (e.g., "green") |
| displayName | string | Non-empty | Human-readable name (e.g., "Green Neon Tetra") |
| sprites | SpriteSet | Required | Sprite file paths per animation state |
| minSizeMm | number | > 0 | Minimum body length at birth (mm) |
| maxSizeMm | number | > minSizeMm | Maximum body length at maturity (mm) |
| minLifespanYears | number | > 0 | Minimum natural lifespan (years) |
| maxLifespanYears | number | ≥ minLifespanYears | Maximum natural lifespan (years) |

### SpriteSet

Sprite file paths for animation states.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| swim | string | Required | Normal swimming animation filename |
| weak | string | Optional | Sick/warning state animation filename |
| feeding | string | Optional | Feeding animation filename (only if genus.hasFeedingAnim) |

### Fish (Instance — persisted in globalState)

An individual fish in the player's tank. **Modified from current model.**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | UUID | Unique fish identifier |
| genusId | string | Valid genus | References GenusConfig.id (formerly speciesId) |
| speciesId | string | Valid species in genus | References SpeciesConfig.id (formerly variantId) |
| healthState | HealthState | Enum | Current health (Healthy/Warning/Sick/Dead) |
| sicknessTick | number | ≥ 0 | Acute health counter (existing system) |
| bodyLengthMm | number | ≥ species.minSizeMm | Current body length in mm |
| ageWeeks | number | ≥ 0 | Age in in-tank weeks (1 pomo = 1 week) |
| lifespanWeeks | number | > 0 | Natural lifespan for this individual (randomized at purchase) |
| maintenanceQuality | number | 0.0–1.0 | Cumulative care quality (EMA) |
| purchasedAt | number | Timestamp | When the fish was added to tank |

### TankDimensionsMm

Real-world mm dimensions for each tank tier.

| Tier | widthMm | heightMm |
|------|---------|----------|
| Nano | 200 | 150 |
| Small | 300 | 225 |
| Medium | 450 | 300 |
| Large | 600 | 400 |
| XL | 900 | 600 |

## Relationships

```
GenusConfig 1──* SpeciesConfig     (genus contains species)
GenusConfig 1──* Fish              (fish belongs to a genus)
SpeciesConfig 1──* Fish            (fish is a specific species)
Fish *──1 Tank                     (fish lives in one tank)
SwimLayer 1──* GenusConfig         (genus has one swim layer)
```

## State Transitions

### Fish Lifecycle

```
Purchase → Alive (Healthy, bodyLength ≈ minSize, age = 0, quality = 1.0)
    │
    ├── Per Pomo Completion:
    │   ├── age += 1 week
    │   ├── quality = EMA(quality, snapshot)
    │   ├── bodyLength = growth_curve(age, lifespan, quality)
    │   └── effective_lifespan recalculated
    │
    ├── Per 60s Tick (existing):
    │   ├── sicknessTick += 1 (if poor conditions)
    │   └── sicknessTick -= 2 (if good conditions)
    │
    ├── Death Path A: sicknessTick ≥ 540 → Dead (acute neglect)
    ├── Death Path B: ageWeeks ≥ effective_lifespan → Dead (natural aging)
    └── Dead → Remains in tank (existing behavior: 0.4 opacity, frozen)
```

### Health State (unchanged)

```
Healthy ←→ Warning ←→ Sick → Dead
(sicknessTick thresholds: 0/120/300/540)
```

## Migration

### Old Fish → New Fish

| Old Field | New Field | Transformation |
|-----------|-----------|---------------|
| speciesId | genusId | Direct mapping (same string values) |
| variantId | speciesId | Direct mapping (same string values) |
| — | bodyLengthMm | `(species.minSizeMm + species.maxSizeMm) / 2` |
| — | ageWeeks | `0` (treat as if just purchased) |
| — | lifespanWeeks | `random(species.minLifespanYears, species.maxLifespanYears) * 52` |
| — | maintenanceQuality | `0.8` |
| — | purchasedAt | `Date.now()` |
| healthState | healthState | Preserved |
| sicknessTick | sicknessTick | Preserved |

### Legacy Species Migration (existing, preserved)

| Old speciesId | New genusId | New speciesId |
|---------------|-------------|---------------|
| guppy | neon_tetra | standard |
| betta | gourami | dwarf |
| angelfish | gourami | cobalt_blue_dwarf |
