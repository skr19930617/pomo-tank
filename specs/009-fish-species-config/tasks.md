# Tasks: Fish Species Hierarchy Config with Growth & Lifespan Mechanics

**Input**: Design documents from `/specs/009-fish-species-config/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add new type definitions and enums that all user stories depend on

- [x] T001 Add SwimLayer enum (upper/middle/lower/all), Personality enum (calm/active/timid/social), GenusConfig interface, SpeciesConfig interface, SpriteSet interface to src/shared/types.ts
- [x] T002 Update Fish interface in src/shared/types.ts — rename speciesId→genusId, variantId→speciesId, add bodyLengthMm, ageWeeks, lifespanWeeks, maintenanceQuality, purchasedAt fields per data-model.md
- [x] T003 Add SWIM_LAYER_RANGES mapping (SwimLayer → {min, max} percentages per research R2) and TANK_DIMENSIONS_MM constant (per data-model TankDimensionsMm) to src/shared/types.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the species registry that replaces inline FISH_SPECIES — BLOCKS all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] Create src/game/species/neon-tetra.ts — export GenusConfig for Neon Tetra with swimLayer: middle, personality: active, schoolingMin: 3, baseSpeed: 1.2, 3 species (standard, albino, green) with mm sizes and lifespan years per research R3/R5
- [x] T005 [P] Create src/game/species/corydoras.ts — export GenusConfig for Corydoras with swimLayer: lower, personality: social, schoolingMin: 3, baseSpeed: 0.8, 3 species (albino, panda, sterbai) with mm sizes and lifespan years per research R3/R5
- [x] T006 [P] Create src/game/species/gourami.ts — export GenusConfig for Gourami with swimLayer: upper, personality: calm, schoolingMin: 1, baseSpeed: 0.7, 2 species (dwarf, cobalt_blue_dwarf) with mm sizes and lifespan years per research R3/R5
- [x] T007 [P] Create src/game/species/otocinclus.ts — export GenusConfig for Otocinclus with swimLayer: lower, personality: timid, schoolingMin: 3, baseSpeed: 0.9, hasFeedingAnim: true, 1 species (standard) with mm sizes and lifespan years per research R3/R5
- [x] T008 [P] Create src/game/species/shrimp.ts — export GenusConfig for Shrimp with swimLayer: lower, personality: social, schoolingMin: 3, baseSpeed: 0.6, hasFeedingAnim: true, 1 species (amano) with mm sizes and lifespan years per research R3/R5
- [x] T009 Create src/game/species/index.ts — export GENUS_REGISTRY (Map<string, GenusConfig>) importing all 5 genus files, plus helper functions: getGenus(genusId), getSpecies(genusId, speciesId), getAllGenera(), getSpeciesWithGenus(genusId, speciesId) returning {genus, species}

**Checkpoint**: Species registry is complete and can be imported by other modules

---

## Phase 3: User Story 1 — Species Config Hierarchy (Priority: P1) 🎯 MVP

**Goal**: Replace inline FISH_SPECIES with the Genus/Species registry, migrate existing Fish data, and ensure all existing functionality works identically

**Independent Test**: Launch extension in debug mode, verify all existing fish render and behave the same as before the refactor

### Implementation for User Story 1

- [x] T010 [US1] Update src/game/state.ts — remove inline FISH_SPECIES array and FishSpeciesConfig references, import GENUS_REGISTRY from src/game/species/index.ts, update STORE_ITEMS fish entries to reference genus registry for capacityCost/minTankSize
- [x] T011 [US1] Update state migration in src/game/state.ts — extend migrateState() to detect old Fish format (has speciesId but no genusId), rename fields per data-model migration table, set default values for new fields (bodyLengthMm=midpoint, ageWeeks=0, lifespanWeeks=random, maintenanceQuality=0.8, purchasedAt=Date.now())
- [x] T012 [US1] Update src/game/store.ts — modify fish purchase logic to use GENUS_REGISTRY: look up genus by id, select random species, create Fish with new fields (genusId, speciesId, bodyLengthMm near min, ageWeeks=0, lifespanWeeks randomized from species min/max years×52, maintenanceQuality=1.0, purchasedAt)
- [x] T013 [US1] Update src/game/health.ts — change evaluateHealthTick to read fish.genusId instead of fish.speciesId when looking up species config
- [x] T014 [US1] Update src/providers/tank-panel.ts — modify buildSpriteUriMap() to iterate GENUS_REGISTRY instead of FISH_SPECIES, building paths as media/sprites/fish/{genusId}/{speciesId}/{filename}
- [x] T015 [US1] Update src/webview/tank-panel/hooks/useFishAnimation.ts — replace FISH_SPECIES lookups with GENUS_REGISTRY lookups using fish.genusId, use species config for size/speed, keep existing swimZone logic temporarily (will be replaced in US2)
- [x] T016 [US1] Update src/webview/tank-panel/components/Fish.tsx — update prop types to use genusId/speciesId, update sprite lookup key from speciesId/variantId to genusId/speciesId
- [x] T017 [US1] Update src/shared/messages.ts — update any message types that reference speciesId/variantId to use genusId/speciesId naming
- [x] T018 [US1] Update src/game/engine.ts — update createSnapshot() and any fish references to use new field names (genusId, speciesId)
- [x] T019 [US1] Update src/webview/tank-panel/components/Store.tsx — update fish purchase UI to display genus displayName, reference genusId in purchase messages
- [x] T020 [US1] Update src/webview/tank-panel/components/DebugPanel.tsx — update any debug fish references to use new genusId/speciesId field names
- [x] T021 [US1] Run npm run lint && npm test to verify no type errors or test failures after migration

**Checkpoint**: All existing fish render and behave identically with new Genus/Species registry. Save data migrates seamlessly.

---

## Phase 4: User Story 2 — Swimming Layer System (Priority: P2)

**Goal**: Replace arbitrary swimZone percentages with named SwimLayer enum, mapped at the Genus level

**Independent Test**: Place fish from different genera in tank, verify Corydoras/Otocinclus/Shrimp stay in lower zone, Neon Tetra in middle, Gourami in upper

### Implementation for User Story 2

- [x] T022 [US2] Update src/webview/tank-panel/hooks/useFishAnimation.ts — replace direct swimZone.min/max reads with SWIM_LAYER_RANGES[genus.swimLayer] lookup, remove any hardcoded percentage fallbacks
- [x] T023 [US2] Verify swim layer behavior in debug mode — confirm each genus stays within its designated zone with natural overlap at boundaries

**Checkpoint**: Fish swim in ecologically appropriate named layers

---

## Phase 5: User Story 3 — Realistic Size Units & Tank Scale (Priority: P2)

**Goal**: Express all sizes in mm, add mm→px scaling function, render fish at proportionally correct sizes relative to tank dimensions

**Independent Test**: Verify a 60mm Gourami appears visibly larger than a 35mm Neon Tetra, and fish appear proportionally smaller in larger tanks

### Implementation for User Story 3

- [x] T024 [P] [US3] Create src/game/scaling.ts — implement mmToPx(fishMm, tankWidthMm, tankRenderWidthPx) per research R3 formula: pxSize = (fishMm / tankWidthMm) * tankRenderWidthPx
- [x] T025 [US3] Update src/webview/tank-panel/hooks/useFishAnimation.ts — replace static displaySize (random px at spawn) with dynamic computation: mmToPx(fish.bodyLengthMm, TANK_DIMENSIONS_MM[tankTier].widthMm, TANK_RENDER_SIZES[tankTier].width) called each frame
- [x] T026 [US3] Update src/webview/tank-panel/components/Fish.tsx — receive computed px size from animation hook instead of static displaySize, update scale calculation
- [x] T027 [US3] Verify proportional rendering in debug mode — purchase fish of different genera, confirm relative sizes match mm ratios and scale correctly across tank upgrades

**Checkpoint**: Fish sizes are mm-based and proportionally correct relative to tank

---

## Phase 6: User Story 5 — Maintenance Quality Tracking (Priority: P3)

**Goal**: Track cumulative maintenance quality per fish using EMA of tank conditions sampled at each pomo completion

**Independent Test**: Simulate multiple pomo completions with varying tank conditions (via debug mode), verify quality score responds correctly — high conditions degrade quality, good conditions maintain/recover it

**Note**: US5 is implemented before US4 because growth mechanics depend on the quality score

### Implementation for User Story 5

- [x] T028 [P] [US5] Create src/game/maintenance-quality.ts — implement computeQualitySnapshot(hunger, dirtiness, algae): returns 1.0 - (hunger + dirtiness + algae) / 300, and updateQuality(currentQuality, snapshot, alpha=0.1): returns EMA blend per research R6
- [x] T029 [US5] Update src/game/engine.ts — in performAction() (pomo completion path), after calculating points, call updateQuality for each living fish using current tank conditions as snapshot, persist updated maintenanceQuality on each fish

**Checkpoint**: Each fish tracks a cumulative quality score that degrades with neglect and recovers with good care

---

## Phase 7: User Story 4 — Growth & Lifespan Mechanics (Priority: P3)

**Goal**: Fish grow from juvenile size toward maximum over their lifespan using sigmoid curve modulated by maintenance quality. Fish die naturally when lifespan expires.

**Independent Test**: Use debug mode to simulate 50+ pomo completions, verify fish visibly grow. Simulate poor maintenance and verify stunted growth and shortened lifespan.

### Implementation for User Story 4

- [x] T030 [P] [US4] Create src/game/growth.ts — implement growFish(fish, genus, species): applies sigmoid growth curve per research R4 (age_ratio, sigmoid_progress with center 0.4, quality_factor scaling, lerp smoothing, max to prevent shrinkage), and computeEffectiveLifespan(baseLifespanWeeks, quality): returns base * (0.7 + 0.3 * quality) per research R6
- [x] T031 [US4] Update src/game/engine.ts — in performAction() (pomo completion path), after quality update (T029), call growFish for each living fish: increment ageWeeks by 1, compute new bodyLengthMm, check if ageWeeks >= effective lifespan and set healthState to Dead if so (natural death path B per data-model)
- [x] T032 [US4] Ensure lifespan death coexists with sicknessTick death — in engine tick loop, keep existing sicknessTick → Dead check (path A) unchanged; in pomo completion, add ageWeeks >= effectiveLifespan → Dead check (path B). Fish dies from whichever triggers first.
- [x] T033 [US4] Verify growth and lifespan in debug mode — purchase fish, simulate multiple pomos, confirm sigmoid growth progression visible and fish that reach lifespan end die naturally

**Checkpoint**: Fish grow over time, quality affects growth rate and lifespan, natural death works alongside acute death

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Add fish info tooltip (FR-019) and tank downgrade handling (FR-020)

- [x] T034 [P] Create src/webview/tank-panel/components/FishTooltip.tsx — pixel-art styled tooltip showing Species displayName, body length (mm), age (weeks→"X weeks" or "X months"), health state, and care quality as 1-5 star rating (quintiles of maintenanceQuality) per research R7
- [x] T035 Update src/webview/tank-panel/components/Fish.tsx — add onClick handler that toggles FishTooltip visibility for the clicked fish, dismiss on click outside or on another fish
- [x] T036 Update src/game/store.ts — add tank downgrade capacity validation: if new tank capacity < current fish cost, compute overflow fish list (LIFO by purchasedAt), return warning with fish names. Add confirmDowngrade function that removes overflow fish per research R8. Note: actual downgrade UI deferred since current store only supports upgrades.
- [x] T037 Run full validation: npm run lint && npm test, launch debug mode, verify all 5 user stories work together end-to-end
- [x] T038 Update src/game/state.ts — bump state version for migration detection

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (types must exist before config files)
- **US1 (Phase 3)**: Depends on Phase 2 (registry must exist before consumers update)
- **US2 (Phase 4)**: Depends on US1 (needs genusId on Fish and SwimLayer in GenusConfig)
- **US3 (Phase 5)**: Depends on US1 (needs bodyLengthMm on Fish and mm sizes in SpeciesConfig)
- **US5 (Phase 6)**: Depends on US1 (needs maintenanceQuality on Fish)
- **US4 (Phase 7)**: Depends on US3 (mm sizing) + US5 (quality score)
- **Polish (Phase 8)**: Depends on US4 (tooltip needs all fish fields populated)

### User Story Dependencies

- **US1 (P1)**: Foundation → US1. **All other stories depend on US1.**
- **US2 (P2)**: US1 → US2. Can run in parallel with US3 and US5.
- **US3 (P2)**: US1 → US3. Can run in parallel with US2 and US5.
- **US5 (P3)**: US1 → US5. Can run in parallel with US2 and US3.
- **US4 (P3)**: US3 + US5 → US4. Must wait for both sizing and quality.

```
Phase 1 → Phase 2 → US1 ──┬── US2 (parallel)
                           ├── US3 (parallel) ──┐
                           └── US5 (parallel) ──┴── US4 → Polish
```

### Parallel Opportunities

- T004–T008: All 5 genus config files can be created in parallel
- T024 + T028: scaling.ts and maintenance-quality.ts can be created in parallel
- T030 + T034: growth.ts and FishTooltip.tsx can be created in parallel
- US2, US3, US5 can all proceed in parallel after US1 completes

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch all genus config files in parallel:
Task: "Create neon-tetra.ts in src/game/species/"
Task: "Create corydoras.ts in src/game/species/"
Task: "Create gourami.ts in src/game/species/"
Task: "Create otocinclus.ts in src/game/species/"
Task: "Create shrimp.ts in src/game/species/"
```

## Parallel Example: After US1

```bash
# These three user stories can proceed simultaneously:
Task: US2 "Update useFishAnimation.ts swim layer lookup"
Task: US3 "Create scaling.ts mm→px conversion"
Task: US5 "Create maintenance-quality.ts EMA computation"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types)
2. Complete Phase 2: Foundational (genus config files + registry)
3. Complete Phase 3: User Story 1 (migrate consumers, state migration)
4. **STOP and VALIDATE**: All existing fish render identically with new config structure
5. This is a safe stopping point — no user-visible changes, pure refactor

### Incremental Delivery

1. Setup + Foundational + US1 → Config hierarchy complete (MVP, no visible change)
2. Add US2 → Fish swim in named layers (visual improvement)
3. Add US3 → Fish sizes in mm, proportionally correct (visual improvement)
4. Add US5 → Quality tracking per fish (invisible, data foundation)
5. Add US4 → Growth + lifespan visible (major new gameplay mechanic)
6. Polish → Tooltip + downgrade support (UX polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US5 is intentionally implemented before US4 — quality score is a prerequisite for growth formula
- Tank downgrade (T036) adds validation logic but actual downgrade UI is deferred since the store currently only supports upgrades
- State version bump (T038) must be the last state.ts change to ensure clean migration detection
