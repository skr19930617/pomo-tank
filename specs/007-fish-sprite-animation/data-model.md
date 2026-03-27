# Data Model: Fish Sprite Animation System

## Entity Changes

### FishSpeciesId (UPDATED)

```
Type: string literal union
Old values: 'guppy' | 'neon_tetra' | 'corydoras' | 'betta' | 'angelfish'
New values: 'neon_tetra' | 'corydoras' | 'gourami' | 'otocinclus' | 'shrimp'
```

### Fish (UPDATED)

```
Field           | Type              | Notes
----------------|-------------------|------
id              | string            | Existing - unique identifier
speciesId       | FishSpeciesId     | Existing - updated union type
variantId       | string            | NEW - assigned on creation, e.g. "albino", "panda", "standard"
healthState     | HealthState       | Existing - Healthy/Warning/Sick/Dead
sicknessTick    | number            | Existing
```

### FishSpeciesConfig (NEW)

```
Field           | Type              | Notes
----------------|-------------------|------
id              | FishSpeciesId     | Species identifier
name            | string            | Display name
capacityCost    | number            | Tank capacity units consumed (from 006)
minTankSize     | TankSizeTier      | Minimum tank required to purchase
schoolingMin    | number            | Minimum group preference
swimZone        | { min: number, max: number } | Vertical range as % of tank height (0=top, 100=bottom)
baseSpeed       | number            | Speed multiplier relative to BASE_SPEED
minSize         | number            | Minimum display size in pixels
maxSize         | number            | Maximum display size in pixels
variants        | VariantConfig[]   | Available visual variants
hasFeedingAnim  | boolean           | Whether feeding sprite exists
```

### VariantConfig (NEW)

```
Field           | Type              | Notes
----------------|-------------------|------
id              | string            | Variant identifier, e.g. "albino", "standard"
name            | string            | Display name
sprites         | { swim: string, weak?: string, feeding?: string } | File name patterns within variant dir
```

### SpriteUriMap (NEW - webview only)

```
Structure: Record<FishSpeciesId, Record<variantId, Record<AnimState, string>>>
AnimState: 'swim' | 'weak' | 'feeding'
Value: webview URI string for the sprite sheet image
```

### AnimatedFishState (UPDATED)

```
Field           | Type              | Notes
----------------|-------------------|------
x               | number            | Existing - current X position
y               | number            | Existing - current Y position
dx              | number            | Existing - velocity X
dy              | number            | Existing - velocity Y
displaySize     | number            | NEW - randomized on creation within species min/max
feedingUntil    | number            | NEW - frameCount at which feeding animation ends (0 = not feeding)
```

## State Transitions

### Animation State Machine (per fish)

```
                 ┌──────────────────────────────────────┐
                 │                                      │
                 ▼                                      │
  ┌──────────┐  health=Healthy  ┌──────────┐           │
  │   SWIM   │◄────────────────│   WEAK   │           │
  │ (normal) │────────────────►│ (slower) │           │
  └──────────┘  health=Warning  └──────────┘           │
       │         or Sick              │                 │
       │                              │                 │
       │  feedAction                  │ feedAction      │
       │  (has sprite)                │ (ignored)       │
       ▼                              │                 │
  ┌──────────┐                        │                 │
  │ FEEDING  │── 1.5s timeout ────────┘─────────────────┘
  │ (brief)  │
  └──────────┘

  health=Dead → DEAD (weak sprite, last frame, frozen, opacity 0.4)
```

### Species Migration (one-time on state load)

```
guppy     → neon_tetra (variant: standard)
betta     → gourami (variant: dwarf)
angelfish → gourami (variant: cobalt_blue_dwarf)
```

Fish without `variantId` field → assign default (first) variant for their species.

## Species Behavior Configuration

| Species      | Swim Zone     | Base Speed | Size Range | Variants                          | Feeding |
|-------------|---------------|------------|------------|-----------------------------------|---------|
| neon_tetra  | 20-70% (mid)  | 1.2        | 16-22px    | standard, albino, green           | No      |
| corydoras   | 65-95% (bot)  | 0.8        | 18-24px    | albino, panda, sterbai            | No      |
| gourami     | 15-55% (up)   | 0.7        | 22-30px    | dwarf, cobalt_blue_dwarf          | No      |
| otocinclus  | 60-90% (bot)  | 0.9        | 14-18px    | standard                          | Yes     |
| shrimp      | 70-95% (bot)  | 0.6        | 12-16px    | amano                             | Yes     |
