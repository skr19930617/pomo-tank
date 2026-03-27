# Feature Specification: Fish Sprite Animation System

**Feature Branch**: `007-fish-sprite-animation`
**Created**: 2026-03-25
**Status**: Draft
**Input**: User description: "Organize fish sprites into proper subdirectories by variant, integrate sprite sheet animations with swim/weak/feeding states, and add per-species configuration for swim zone, speed, and size"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sprite Sheet Fish Animation (Priority: P1)

As a user, I want to see my fish rendered as detailed pixel-art sprite sheet animations instead of procedural rectangles, so the tank feels alive and visually appealing.

**Why this priority**: This is the core visual upgrade. Without sprite sheet rendering, the other stories (weak state, feeding, per-species config) have nothing to display.

**Independent Test**: Open the tank panel and verify that fish are rendered using sprite sheet frames cycling through the swim animation. Fish should visually move and animate smoothly.

**Acceptance Scenarios**:

1. **Given** a tank with a guppy (mapped to neon_tetra sprites), **When** the tank panel renders, **Then** the fish displays as an animated sprite cycling through swim frames
2. **Given** a fish swimming left, **When** the sprite renders, **Then** the sprite is horizontally flipped to face the direction of movement
3. **Given** multiple fish of the same species but different variants, **When** they render, **Then** each fish displays its assigned variant's sprite sheet
4. **Given** the light is off, **When** fish render, **Then** fish still animate but at a reduced frame rate or dimmed appearance

---

### User Story 2 - Health-Based Animation States (Priority: P1)

As a user, I want fish to visually change their animation when they are sick or weak, so I can see at a glance which fish need attention.

**Why this priority**: Equally critical to P1 — the weak animation provides essential gameplay feedback that directly impacts the pomodoro maintenance loop.

**Independent Test**: Trigger poor tank conditions and verify fish switch from swim to weak animation with visibly slower movement.

**Acceptance Scenarios**:

1. **Given** a healthy fish, **When** it swims normally, **Then** the swim animation plays at normal speed
2. **Given** a fish in Warning or Sick health state, **When** it renders, **Then** the weak animation plays and the fish moves noticeably slower
3. **Given** a fish that recovers to Healthy state, **When** conditions improve, **Then** it transitions back to the swim animation at normal speed
4. **Given** a species where the weak sprite is missing, **When** the fish is in sick state, **Then** the swim animation plays at reduced opacity or speed as a fallback

---

### User Story 3 - Per-Species Behavior Configuration (Priority: P2)

As a user, I want different species to swim in different zones (top, middle, bottom) at different speeds and sizes, so each species feels distinct and the tank has visual depth.

**Why this priority**: Adds personality and realism to each species. Not strictly required for MVP but significantly improves the experience.

**Independent Test**: Add fish of different species and verify they stay within their designated swim zones, move at their configured speeds, and render at appropriate sizes.

**Acceptance Scenarios**:

1. **Given** a bottom-dwelling species (e.g., corydoras), **When** it swims, **Then** it stays in the lower portion of the tank
2. **Given** a mid-level species (e.g., neon tetra), **When** it swims, **Then** it stays in the middle portion of the tank
3. **Given** two species with different speed settings, **When** they swim, **Then** the faster species visibly moves quicker than the slower one
4. **Given** a species with min/max size range, **When** a new fish of that species is added, **Then** it renders at a random size within the configured range

---

### User Story 4 - Feeding Animation (Priority: P3)

As a user, I want to see fish play a feeding animation when I perform the feed action, so I get visual feedback that the feeding was successful.

**Why this priority**: Nice-to-have polish. Only some species have feeding sprites, so this is a bonus for species that support it.

**Independent Test**: Trigger the feed action and verify species with feeding sprites play the feeding animation briefly.

**Acceptance Scenarios**:

1. **Given** a species with a feeding sprite (e.g., otocinclus, shrimp), **When** the user feeds the tank, **Then** the fish briefly plays the feeding animation before returning to swim
2. **Given** a species without a feeding sprite, **When** the user feeds the tank, **Then** the fish continues the swim animation without disruption

---

### User Story 5 - Organized Sprite Directory Structure (Priority: P1)

As a developer/content creator, I want the sprite files organized by species and then by variant in clear subdirectories, so I can easily find, add, or modify sprite sheets.

**Why this priority**: Foundation for all sprite loading. Files must be discoverable in a predictable structure.

**Independent Test**: Verify the directory structure follows the convention and all existing sprite sheets are in their correct locations.

**Acceptance Scenarios**:

1. **Given** the sprite directory, **When** navigating the file tree, **Then** each species has a directory, and each variant within has its own subdirectory containing swim/weak/feeding sheets
2. **Given** a new variant is added to a species directory following the naming convention, **When** the system loads, **Then** it can discover and use the new variant without code changes

---

### Edge Cases

- What happens when a sprite sheet file is missing or corrupted? The system falls back to the current procedural rectangle rendering for that fish.
- What happens when a fish has no variant assigned? The system assigns the default (first) variant for that species.
- What happens when all frames are identical in a sprite sheet? The fish displays as a static sprite (no animation error).
- What happens when a species has swim but not weak sprites? Use the swim animation with reduced opacity/speed for the weak state.
- What happens when a fish dies? It displays the weak sprite frozen on the last frame at low opacity and stays in the tank permanently. Dead fish are no longer auto-removed; a "clean dead fish" maintenance action will be a future feature.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each fish species MUST have a defined directory structure: `media/sprites/fish/{species}/{variant}/` containing sprite sheets
- **FR-002**: The system MUST load sprite sheets and render fish using frame-by-frame animation at 8 FPS (12 frames per sheet, 64x64 pixels per frame, 6 columns x 2 rows grid, 1.5 seconds per loop)
- **FR-003**: Fish MUST play the swim animation during normal (Healthy) movement
- **FR-004**: Fish MUST play the weak animation when in Warning or Sick health state, with reduced movement speed
- **FR-004a**: Dead fish MUST display the weak sprite frozen on the last frame at low opacity, remain stationary, and persist in the tank until a future maintenance feature removes them
- **FR-005**: Fish with feeding sprites MUST briefly play the feeding animation when the feed action is performed
- **FR-006**: Fish MUST be horizontally flipped to face their direction of movement
- **FR-007**: Each species MUST have configurable behavior properties: swim zone (top/middle/bottom range), base movement speed, minimum display size, and maximum display size
- **FR-008**: Species behavior configuration MUST be defined in a single, accessible location alongside other species data
- **FR-009**: When a sprite sheet is unavailable for a required animation state, the system MUST fall back gracefully (use swim sprites at reduced opacity for weak, skip feeding animation)
- **FR-010**: Each individual fish MUST be assigned a variant on creation that determines which sprite sheets are used
- **FR-011**: The sprite directory MUST be reorganized so that each variant's files are grouped in their own subdirectory within the species directory

### Key Entities

- **Species**: A fish type (e.g., neon_tetra, corydoras) with defined behavior properties (swim zone, speed, size range) and one or more variants
- **Variant**: A visual variation of a species (e.g., albino, panda, sterbai) with its own set of sprite sheets (swim, weak, feeding)
- **Sprite Sheet**: A single image containing 12 animation frames arranged in a 6x2 grid at 64x64 pixels per frame
- **Animation State**: One of three states (swim, weak, feeding) that determines which sprite sheet to play and how movement behaves
- **Swim Zone**: A vertical range within the tank (expressed as percentage of tank height) where a species prefers to swim

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All fish in the tank render using sprite sheet animations instead of procedural shapes
- **SC-002**: Users can visually distinguish healthy fish (swim animation, normal speed) from sick fish (weak animation, slower speed) at a glance
- **SC-003**: Different species occupy distinct vertical zones in the tank, creating visual depth
- **SC-004**: Adding a new sprite variant requires only adding files to the correct directory — no code changes needed
- **SC-005**: Species behavior configuration (zone, speed, size) is defined in a single, readable location that is easy to find and modify
- **SC-006**: Animation plays smoothly without visible stuttering or frame drops

## Clarifications

### Session 2026-03-25

- Q: Should new sprite species (gourami, otocinclus, shrimp) be added to the game? → A: Yes, replace guppy/betta/angelfish (no sprites) with gourami/otocinclus/shrimp (have sprites). New roster: neon_tetra, corydoras, gourami, otocinclus, shrimp. Snail excluded (insufficient sprites).
- Q: How should dead fish be rendered? → A: Show weak sprite frozen on last frame at low opacity. Dead fish remain in the tank permanently and are never auto-removed. A "clean dead fish" maintenance feature will be added in a future spec.
- Q: What animation frame rate for sprite sheets? → A: 8 FPS (12 frames = 1.5 seconds per loop). Standard pixel-art rate.

## Assumptions

- The existing sprite sheets follow the naming convention: `{variant_name}_{state}_{size}_{grid}_{frames}.png` (e.g., `albino_corydoras_swim_64x64_6x2_12f.png`)
- All sprite sheets are 64x64 per frame, 6 columns x 2 rows, 12 frames total — this is consistent across all existing assets
- The game roster is updated to 5 species that all have sprites: neon_tetra, corydoras, gourami, otocinclus, shrimp. Guppy, betta, and angelfish are removed from the catalog. Snail is excluded due to insufficient sprite coverage (swim only, no weak)
- All 5 species will have full sprite sheet rendering — no procedural fallback is needed for the active roster
- The feeding animation is a brief overlay (1-2 seconds) that plays once after the feed action, then returns to the current state animation
- Variant assignment happens at fish creation time and persists for the life of the fish

## Sprite Directory Reorganization

### Current Structure (flat)
```
media/sprites/fish/{species}/{variant_name}_{state}_{size}_{grid}_{frames}.png
```

### Target Structure (variant subdirectories)
```
media/sprites/fish/
├── corydoras/
│   ├── albino/
│   │   ├── swim_64x64_6x2_12f.png
│   │   └── weak_64x64_6x2_12f.png
│   ├── panda/
│   │   ├── swim_64x64_6x2_12f.png
│   │   └── weak_64x64_6x2_12f.png
│   └── sterbai/
│       ├── swim_64x64_6x2_12f.png
│       └── weak_64x64_6x2_12f.png
├── gourami/
│   ├── cobalt_blue_dwarf/
│   │   ├── swim_64x64_6x2_12f.png
│   │   └── weak_64x64_6x2_12f.png
│   └── dwarf/
│       ├── swim_64x64_6x2_12f.png
│       └── weak_64x64_6x2_12f.png
├── neon_tetra/
│   ├── albino/
│   │   ├── swim_64x64_6x2_12f.png
│   │   └── weak_64x64_6x2_12f.png
│   ├── green/
│   │   ├── swim_64x64_6x2_12f.png
│   │   └── weak_64x64_6x2_12f.png
│   └── standard/
│       ├── swim_64x64_6x2_12f.png
│       └── weak_64x64_6x2_12f.png
├── otocinclus/
│   └── standard/
│       ├── swim_64x64_6x2_12f.png
│       ├── weak_side_64x64_6x2_12f.png
│       └── feeding_64x64_6x2_12f.png
├── shrimp/
│   └── amano/
│       ├── swim_64x64_6x2_12f.png
│       ├── weak_64x64_6x2_12f.png
│       └── feeding_64x64_6x2_12f.png
└── snail/
    └── freshwater_limpet/
        └── swim_64x64_6x2_12f.png
```
