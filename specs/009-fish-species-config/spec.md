# Feature Specification: Fish Species Hierarchy Config with Growth & Lifespan Mechanics

**Feature Branch**: `009-fish-species-config`
**Created**: 2026-03-25
**Status**: Draft
**Input**: User description: "各魚の設定ファイルを分離し、大区分・小区分の階層構造で管理。泳ぐエリア・性格・成長・寿命メカニクスを導入し、メンテナンス品質が魚の成長と寿命に影響するシステム"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Species Config Hierarchy (Priority: P1)

As a developer, I want fish to be organized in a two-level hierarchy (Genus and Species) with separate config files, so that adding new fish is straightforward and the codebase is maintainable.

Currently all 5 species are defined inline in a single `state.ts` file. This story restructures configuration into individual files per Genus, with Species nested within. Each Genus defines shared behavioral traits (swim layer, personality, schooling), and each Species defines visual traits (sprite paths, size ranges).

**Why this priority**: This is the foundational data model change that all other stories depend on. Without the hierarchy, growth, lifespan, and layer mechanics cannot be properly defined.

**Independent Test**: Can be tested by verifying that all existing fish render and behave identically after migration to the new config structure.

**Acceptance Scenarios**:

1. **Given** the application loads, **When** fish configs are read, **Then** each Genus file contains genus-level traits (swim layer, personality, schooling minimum, base speed) and each Species within it defines sprite paths, min/max size in mm, and min/max lifespan in years.
2. **Given** a Species config, **When** the system resolves its properties, **Then** it inherits all genus-level traits from its parent Genus.
3. **Given** a schooling Genus (e.g., Neon Tetra), **When** multiple Species of the same Genus are present in the tank, **Then** they school together regardless of which specific Species they are.
4. **Given** the existing 5 species and their variants, **When** migrated to the new structure, **Then** all existing fish data is preserved and the application behaves identically.

---

### User Story 2 - Swimming Layer System (Priority: P2)

As a user, I want fish to swim in ecologically appropriate layers (upper, middle, lower, all), so that the tank looks natural and realistic with fish occupying different vertical zones.

The current system uses arbitrary percentage ranges per species. This story replaces that with named swim layers defined at the Genus level, mapped to vertical zones in the tank. This makes tank composition more intuitive and visually appealing.

**Why this priority**: Swim layers are a core behavioral trait defined at the Genus level, directly tied to the hierarchy from P1. It enhances visual realism with relatively low complexity.

**Independent Test**: Can be tested by placing fish from different swim layers in the tank and verifying each stays within its designated vertical zone.

**Acceptance Scenarios**:

1. **Given** a fish belonging to a Genus with swim layer "lower", **When** it swims in the tank, **Then** it stays within the lower third of the water column.
2. **Given** a fish with swim layer "all", **When** it swims, **Then** it can move freely across the entire water column.
3. **Given** multiple fish of different layers, **When** observing the tank, **Then** they naturally separate into their respective zones with no unnatural clustering.

---

### User Story 3 - Realistic Size Units & Tank Scale (Priority: P2)

As a developer, I want all sizes (fish body length and tank dimensions) expressed in millimeters and lifespans in years, so that the simulation can scale consistently and realistically.

Currently fish sizes are in pixels (12-30px) and tank sizes are abstract tiers. This story introduces real-world mm dimensions for both fish and tanks, with a scaling function that converts mm to screen pixels based on the visible tank area. This enables realistic proportions between fish species and meaningful growth progression.

**Why this priority**: The mm-based size system is required before growth and lifespan mechanics can work meaningfully. It ties directly into the config hierarchy from P1.

**Independent Test**: Can be tested by verifying fish render at appropriate relative sizes (e.g., a 30mm Gourami appears visibly larger than a 20mm Neon Tetra) and that tank upgrades change the visible scale.

**Acceptance Scenarios**:

1. **Given** a Species defines minSize: 20mm and maxSize: 35mm, **When** a fish is purchased, **Then** its initial size is randomized near the minimum (e.g., 18-24mm range).
2. **Given** a tank with mm-based dimensions, **When** fish are rendered, **Then** their pixel size is proportional to their mm size relative to the tank's mm dimensions.
3. **Given** existing save data with pixel-based sizes, **When** the application loads, **Then** fish are migrated to equivalent mm sizes without visual disruption.

---

### User Story 4 - Growth & Lifespan Mechanics (Priority: P3)

As a user, I want my fish to grow over time from a small juvenile size toward their adult maximum, with their growth rate and lifespan influenced by how well I maintain the tank, so that there is a rewarding long-term progression tied to consistent care.

Fish are purchased at near-minimum size and gradually grow toward maximum size over their lifespan. Good maintenance (regular feeding, water changes, algae cleaning) accelerates growth toward maximum and preserves full lifespan. Neglecting maintenance stunts growth and shortens lifespan. With 1 pomodoro representing approximately 1 week of in-tank time, a fish with a 2-year lifespan would live for roughly 104 pomodoros.

**Why this priority**: This is the most complex mechanic and depends on all previous stories (config hierarchy, size units, swim layers). It adds the core gameplay loop connecting maintenance quality to visual fish progression.

**Independent Test**: Can be tested by simulating pomodoro completions with varying maintenance quality and verifying fish size changes and lifespan progression match expected curves.

**Acceptance Scenarios**:

1. **Given** a newly purchased fish, **When** time passes with consistent good maintenance, **Then** the fish gradually grows from near-minimum toward maximum size over its natural lifespan.
2. **Given** a fish in a well-maintained tank, **When** approaching end of lifespan, **Then** its size is close to (with some randomness) the species maximum size.
3. **Given** a fish in a poorly maintained tank (high hunger/dirtiness), **When** time passes, **Then** growth rate is reduced and lifespan is shortened compared to well-maintained fish.
4. **Given** a fish with shortened lifespan due to neglect, **When** it reaches end of its reduced lifespan, **Then** it dies at a smaller size than it would have reached with good care.
5. **Given** the time scale of 1 pomo = ~1 week, **When** a fish species has a 2-year natural lifespan, **Then** it lives for approximately 100 pomodoros under good conditions.

---

### User Story 5 - Maintenance Quality Tracking (Priority: P3)

As a user, I want the system to track my maintenance consistency over time, so that fish growth and lifespan reflect my long-term care patterns rather than just the current tank state.

The existing health system uses instantaneous sicknessTick counters. This story adds a cumulative maintenance quality score per fish that smoothly influences growth rate and lifespan. This creates a more forgiving system where occasional lapses don't immediately punish, but sustained neglect has visible consequences.

**Why this priority**: This provides the bridge between the existing deterioration system and the new growth mechanics. It depends on the growth system from P3 but could be simplified if needed.

**Independent Test**: Can be tested by simulating different maintenance patterns and verifying the quality score correctly reflects cumulative care history.

**Acceptance Scenarios**:

1. **Given** a fish in a consistently well-maintained tank, **When** its maintenance quality is evaluated, **Then** it has a high quality score that maximizes growth rate and preserves full lifespan.
2. **Given** a fish that experienced a period of neglect followed by recovery, **When** quality is evaluated, **Then** the score reflects both periods proportionally, showing partial recovery but not full.
3. **Given** a fish in a tank where maintenance is completely neglected, **When** quality drops below a critical threshold, **Then** lifespan reduction accelerates and growth effectively stops.

---

### Edge Cases

- What happens when a fish is migrated from the old pixel-based system but its species config has changed?
- How does growth behave when a fish is already at maximum size but still has remaining lifespan?
- What happens if the user doesn't complete any pomodoros for an extended period — does time still pass for fish?
- How should schooling work when a Genus has only one Species in the tank?
- What happens to fish if tank is downgraded — overflow fish exceeding the smaller tank's capacity are removed after user confirmation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST organize fish into a two-level hierarchy: Genus and Species, stored in separate configuration files per Genus.
- **FR-002**: Each Genus MUST define: display name, swim layer (upper/middle/lower/all), personality type, schooling minimum, base speed, and feeding behavior flag.
- **FR-003**: Each Species MUST define: display name, sprite file paths (per animation state), minimum body length in mm, maximum body length in mm, minimum natural lifespan in years, and maximum natural lifespan in years.
- **FR-004**: Each Species MUST reference its parent Genus, enabling genus-level grouping for behaviors like schooling.
- **FR-005**: Schooling behavior MUST group fish by Genus — all Species within the same Genus school together.
- **FR-006**: Swim layers MUST be defined as named zones (upper, middle, lower, all) mapped to vertical percentage ranges within the tank water column.
- **FR-007**: All fish body sizes MUST be expressed in millimeters; all tank interior dimensions MUST be expressed in millimeters.
- **FR-008**: System MUST provide a scaling function that converts mm dimensions to screen pixels based on current tank size.
- **FR-009**: When a fish is purchased, its initial body length MUST be randomized within a range near the Species minimum size.
- **FR-010**: Fish MUST grow over time from initial size toward maximum size, with growth rate influenced by cumulative maintenance quality.
- **FR-011**: Each fish MUST have a natural lifespan (randomized between Species min/max at purchase) that is shortened by sustained poor maintenance.
- **FR-012**: Good maintenance MUST result in fish growing closer to their maximum size by end of lifespan; poor maintenance MUST result in stunted growth and premature death.
- **FR-013**: System MUST track a per-fish cumulative maintenance quality score that reflects long-term care patterns. The score is computed by sampling the three existing tank conditions (hunger, water dirtiness, algae level) at each completed pomodoro, averaging them into a quality snapshot, and blending it into the fish's cumulative score.
- **FR-014**: The time scale MUST map 1 completed pomodoro session to approximately 1 week of in-tank time for growth and aging calculations.
- **FR-015**: System MUST migrate existing fish data (pixel sizes, old variant structure) to the new mm-based hierarchical format without data loss.
- **FR-016**: Growth MUST plateau (stop increasing) once a fish reaches its maximum size, even if lifespan remains.
- **FR-019**: When a user clicks or hovers on a fish, the system MUST display a tooltip showing the fish's Species name, current body length, age, and health state.
- **FR-020**: When a user attempts to downgrade the tank and current fish population exceeds the smaller tank's capacity, the system MUST warn the user that overflow fish will be removed. On confirmation, excess fish are removed; on cancellation, the downgrade is aborted.
- **FR-017**: Fish that are not being actively timed (no pomodoro running) MUST NOT age or grow — time only passes during completed sessions.
- **FR-018**: The existing acute death system (sicknessTick threshold) and the new lifespan-based natural death MUST coexist as independent death paths. A fish can die from either acute neglect or natural aging, whichever occurs first.

### Key Entities

- **Genus**: A genus-level grouping of fish sharing behavioral traits. Defines swim layer, personality, schooling rules, base speed. Examples: Neon Tetra, Corydoras, Gourami.
- **Species**: A specific variety within a Genus. Defines appearance (sprite paths), physical size range (mm), and natural lifespan range (years). Examples: Green Neon Tetra, Albino Corydoras, Dwarf Gourami.
- **Fish Instance**: An individual fish in the tank. Has a specific Species, current body length (mm), current age, remaining lifespan, cumulative maintenance quality score, and health state.
- **Swim Layer**: A named vertical zone in the tank (upper, middle, lower, all) with defined percentage boundaries.
- **Maintenance Quality Score**: A per-fish cumulative metric tracking the quality of care received over the fish's lifetime, influencing growth rate and lifespan.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Adding a new fish (Genus + Species) requires creating only one configuration file with no changes to core application logic.
- **SC-002**: All fish in the tank swim within their designated layer zones at least 95% of the time (allowing brief transitions).
- **SC-003**: A well-maintained fish reaches at least 85% of its maximum size by end of natural lifespan.
- **SC-004**: A poorly maintained fish (neglected >50% of its life) reaches no more than 60% of its maximum size and loses at least 30% of its natural lifespan.
- **SC-005**: Fish with a 2-year natural lifespan survive approximately 100 completed pomodoro sessions under good maintenance conditions.
- **SC-006**: Fish of different Species within the same Genus visibly school together in the tank.
- **SC-007**: Existing users experience no data loss when upgrading — all previously owned fish are preserved with equivalent sizes and behaviors.
- **SC-008**: Fish sizes appear proportionally correct relative to each other and to the tank (e.g., a 50mm fish appears roughly twice the length of a 25mm fish).

## Clarifications

### Session 2026-03-25

- Q: How do sicknessTick-based death and lifespan-based death coexist? → A: Both mechanisms coexist independently. sicknessTick handles acute neglect death (fish dies quickly from severe poor conditions), lifespan handles natural aging death (fish eventually dies of old age even in perfect conditions).
- Q: What inputs feed the cumulative maintenance quality score? → A: Sample the existing 3 tank conditions (hunger, dirtiness, algae) at each pomo completion, average them into a quality snapshot, then blend into the per-fish cumulative score.
- Q: Canonical terminology for hierarchy levels? → A: "Genus" (formerly Major Category/大区分) and "Species" (formerly Minor Category/小区分). Biological naming for aquarium context.
- Q: Can users see fish growth/age/lifespan info? → A: Basic info shown on interaction (click/hover) — displays name, size, age, and health in a tooltip. No always-visible indicators.
- Q: How to handle tank downgrade when fish exceed smaller tank capacity? → A: Allow downgrade with warning. Warn user that overflow fish will be removed; remove them on confirmation.

## Assumptions

- The current 5 species (neon_tetra, corydoras, gourami, otocinclus, shrimp) will be migrated to the new hierarchy as the initial dataset.
- "Personality" in major categories refers to behavioral traits affecting movement patterns (e.g., calm, active, territorial) — not a complex AI system.
- Growth follows a sigmoid-like curve (slow start, faster in middle, plateaus near max) rather than linear progression.
- The 1 pomo = 1 week mapping applies only to completed work sessions, not break sessions.
- Tank mm dimensions will be derived from realistic aquarium sizes corresponding to each tier (e.g., Nano = ~200mm, Small = ~300mm, up to XL = ~600mm internal width).
- Time does not pass for fish between sessions — aging and growth only occur when pomodoros are completed. This avoids punishing users for not using the extension.
