# Tasks: Fish Sprite Animation System

**Input**: Design documents from `/specs/007-fish-sprite-animation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Sprite directory reorganization and shared utilities

- [x] T001 Reorganize sprite files: move `media/sprites/fish/corydras/` to `media/sprites/fish/corydoras/` (fix typo) and create variant subdirectories (albino/, panda/, sterbai/) with renamed sprite files (remove variant prefix from filenames, e.g. `albino_corydoras_swim_64x64_6x2_12f.png` → `albino/swim_64x64_6x2_12f.png`)
- [x] T002 [P] Reorganize `media/sprites/fish/neon_tetra/` into variant subdirectories: standard/, albino/, green/ (rename `neon_tetra_swim_*` → `standard/swim_*`, `albino_neon_tetra_*` → `albino/swim_*`, etc.)
- [x] T003 [P] Reorganize `media/sprites/fish/gourami/` into variant subdirectories: dwarf/, cobalt_blue_dwarf/
- [x] T004 [P] Reorganize `media/sprites/fish/otocinclus/` into variant subdirectory: standard/ (rename `otocinclus_weak_side_*` → `standard/weak_64x64_6x2_12f.png`)
- [x] T005 [P] Reorganize `media/sprites/fish/shrimp/` into variant subdirectory: amano/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Update type system, species registry, and sprite loading infrastructure that all user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Update `FishSpeciesId` union type in `src/shared/types.ts`: replace `'guppy' | 'neon_tetra' | 'corydoras' | 'betta' | 'angelfish'` with `'neon_tetra' | 'corydoras' | 'gourami' | 'otocinclus' | 'shrimp'`. Add `variantId: string` field to `Fish` interface. Add `AnimState` type (`'swim' | 'weak' | 'feeding'`). Add `FishSpeciesConfig` interface with swimZone, baseSpeed, minSize, maxSize, variants, hasFeedingAnim fields.
- [x] T007 Update `FISH_SPECIES` registry in `src/game/state.ts`: remove guppy/betta/angelfish entries, add gourami/otocinclus/shrimp entries with full behavior config (swim zones, speed multipliers, size ranges, variant lists per data-model.md species table). Update `createInitialState()` to use neon_tetra instead of guppy.
- [x] T008 Add state migration logic in `src/game/state.ts`: when loading state, map legacy speciesId values (guppy→neon_tetra with variant 'standard', betta→gourami with variant 'dwarf', angelfish→gourami with variant 'cobalt_blue_dwarf'). Assign default variant to any fish missing `variantId` field.
- [x] T009 Update purchase logic in `src/game/store.ts`: on fish purchase, randomly assign a `variantId` from the species' available variants. Update `STORE_ITEMS` to replace guppy/betta/angelfish with gourami/otocinclus/shrimp (set appropriate pomo prices and capacity costs).
- [x] T010 Create sprite URI map builder in `src/providers/tank-panel.ts`: generate `Record<FishSpeciesId, Record<variantId, Record<AnimState, string>>>` using `webview.asWebviewUri()` for all sprite files following the `media/sprites/fish/{species}/{variant}/{state}_64x64_6x2_12f.png` pattern. Pass the URI map to the webview in the HTML template or initial state message.
- [x] T011 Create sprite frame helper in `src/webview/tank-panel/components/sprite-sheet-utils.ts`: export a function `buildAnimations(width: 64, height: 64, cols: 6, rows: 2)` that returns Konva Sprite `animations` format (flat array of [x, y, w, h] for 12 frames). Export constants for SPRITE_WIDTH=64, SPRITE_HEIGHT=64, FRAME_RATE=8.
- [x] T012 Create `src/webview/tank-panel/hooks/useSpriteLoader.ts`: hook that takes the sprite URI map, preloads all sprite sheet images as `HTMLImageElement` objects, and returns `Record<speciesId, Record<variantId, Record<animState, HTMLImageElement | null>>>` with loading state.

**Checkpoint**: Foundation ready - type system updated, species migrated, sprites loadable

---

## Phase 3: User Story 5 - Organized Sprite Directory Structure (Priority: P1)

**Goal**: Sprite files are reorganized into `{species}/{variant}/` directories and discoverable by the system

**Independent Test**: Verify directory structure matches target layout from spec. Verify sprite URI map generates correct paths for all species/variant/state combinations.

**Note**: This story's implementation is covered by Phase 1 (T001-T005) for file reorganization and Phase 2 (T010) for URI mapping. No additional tasks needed.

**Checkpoint**: Directory structure reorganized and URI map functional

---

## Phase 4: User Story 1 - Sprite Sheet Fish Animation (Priority: P1) MVP

**Goal**: Fish render as animated pixel-art sprites using Konva Sprite component instead of procedural rectangles

**Independent Test**: Open tank panel, verify fish display as animated sprites cycling through swim frames at 8 FPS, flipping horizontally when changing direction

### Implementation for User Story 1

- [x] T013 [US1] Replace procedural rendering in `src/webview/tank-panel/components/Fish.tsx`: replace the rectangle/tail/fin/eye Group with a Konva `Sprite` component. Use preloaded image from sprite loader, `animations` from `buildAnimations()`, `animation='swim'`, `frameRate=8`. Start animation on mount. Flip via `scaleX: -1` when `dx < 0` (preserve existing flip logic). Set sprite dimensions based on species `displaySize` (from animation state).
- [x] T014 [US1] Update `src/webview/tank-panel/components/TankScene.tsx`: pass sprite URI map and preloaded images to Fish components. Accept `spriteUriMap` from `useGameState` and pass preloaded images from `useSpriteLoader`. Pass each fish's `variantId` and species config to Fish component.
- [x] T015 [US1] Update `src/webview/tank-panel/hooks/useGameState.ts`: receive and store the sprite URI map from extension messages (either from initial HTML data or a new message type). Expose `spriteUriMap` in the hook return value.
- [x] T016 [US1] Update `src/webview/tank-panel/components/Store.tsx`: update species display to show new roster (gourami, otocinclus, shrimp instead of guppy, betta, angelfish). Ensure capacity cost and pomo price display correctly for new species.

**Checkpoint**: Fish render as animated sprites, swim animation plays at 8 FPS, direction flip works

---

## Phase 5: User Story 2 - Health-Based Animation States (Priority: P1)

**Goal**: Fish switch to weak animation when sick, dead fish show frozen weak sprite

**Independent Test**: Let tank conditions deteriorate, verify fish switch to weak animation with slower movement. Let fish die, verify it shows frozen weak sprite at low opacity.

**Depends on**: Phase 4 (US1) for sprite rendering foundation

### Implementation for User Story 2

- [x] T017 [US2] Add health-based animation switching in `src/webview/tank-panel/components/Fish.tsx`: switch Konva Sprite `animation` prop based on `healthState` — 'swim' for Healthy, 'weak' for Warning/Sick. For Dead state: set animation to 'weak', stop the Sprite animation (freeze), set `frameIndex` to 11 (last frame), set opacity to 0.4. If weak sprite image is not available for a species, keep 'swim' animation but reduce opacity to 0.5.
- [x] T018 [US2] Update speed logic in `src/webview/tank-panel/hooks/useFishAnimation.ts`: when fish is in Warning/Sick state, apply `SICK_SPEED` multiplier (existing 0.3). When Dead, set velocity to 0 (stationary, no float-to-top — just freeze in place). Remove existing dead fish float-to-top behavior.

**Checkpoint**: Healthy=swim animation, Warning/Sick=weak animation + slow, Dead=frozen weak last frame + low opacity

---

## Phase 6: User Story 3 - Per-Species Behavior Configuration (Priority: P2)

**Goal**: Each species swims in its designated zone at its configured speed and renders at species-appropriate size

**Independent Test**: Add fish of different species, verify they stay within their designated swim zones, move at different speeds, render at different sizes

**Depends on**: Phase 4 (US1) for sprite rendering

### Implementation for User Story 3

- [x] T019 [US3] Add swim zone constraints in `src/webview/tank-panel/hooks/useFishAnimation.ts`: look up each fish's species config from `FISH_SPECIES` registry. Constrain Y position to `swimZone.min * tankHeight` to `swimZone.max * tankHeight`. Apply bounce at zone boundaries instead of tank boundaries. On fish creation, randomize initial Y within the swim zone.
- [x] T020 [US3] Add per-species speed in `src/webview/tank-panel/hooks/useFishAnimation.ts`: multiply `BASE_SPEED` by species `baseSpeed` multiplier (e.g., neon_tetra=1.2, shrimp=0.6). Apply before health multipliers.
- [x] T021 [US3] Add per-fish display size in `src/webview/tank-panel/hooks/useFishAnimation.ts` and `src/webview/tank-panel/components/Fish.tsx`: on fish creation, randomize a `displaySize` between species `minSize` and `maxSize`. Store in `AnimatedFishState`. Use `displaySize` to scale the Konva Sprite component (scale = displaySize / 64).

**Checkpoint**: Species occupy distinct zones, move at different speeds, render at different sizes

---

## Phase 7: User Story 4 - Feeding Animation (Priority: P3)

**Goal**: Species with feeding sprites play a brief feeding animation on feed action

**Independent Test**: Click Feed button with otocinclus/shrimp in tank, verify feeding animation plays for ~1.5s then returns to swim

**Depends on**: Phase 4 (US1) for sprite rendering

### Implementation for User Story 4

- [x] T022 [US4] Add feeding trigger in `src/webview/tank-panel/hooks/useGameState.ts`: when receiving `actionResult` for `feedFish` action, set a `feedingActive` flag with a timestamp. Expose `feedingActive` in hook return.
- [x] T023 [US4] Add feeding animation state in `src/webview/tank-panel/components/Fish.tsx`: when `feedingActive` is true and the fish's species `hasFeedingAnim` is true and the feeding sprite image is loaded, switch Konva Sprite `animation` to 'feeding'. After 1.5 seconds (one full 12-frame loop), revert to current state animation (swim or weak). Species without feeding sprites continue their current animation.

**Checkpoint**: Otocinclus/shrimp play feeding animation on feed, other species unaffected

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation

- [x] T024 Remove procedural fish color map (`FISH_COLORS`) and old rectangle rendering code from `src/webview/tank-panel/components/Fish.tsx` (if any remnants remain after T013)
- [x] T025 [P] Update `src/webview/tank-panel/components/Fish.tsx` speech bubble system: ensure hunger "!" and sick "..." bubbles still render on top of sprite (adjust position relative to sprite dimensions instead of hardcoded rectangle positions)
- [x] T026 Run quickstart.md validation scenarios to verify all user stories work correctly
- [x] T027 Build and lint check: run `npm run build && npm run lint` and fix any type errors or lint issues from the refactored code

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - T001-T005 can run in parallel
- **Phase 2 (Foundational)**: Depends on Phase 1 (sprite files must be reorganized before URI map works)
- **Phase 3 (US5)**: Covered by Phase 1 + Phase 2
- **Phase 4 (US1)**: Depends on Phase 2 - core sprite rendering
- **Phase 5 (US2)**: Depends on Phase 4 - extends Fish.tsx with health switching
- **Phase 6 (US3)**: Depends on Phase 4 - extends useFishAnimation.ts with zones/speed
- **Phase 7 (US4)**: Depends on Phase 4 - extends Fish.tsx with feeding state
- **Phase 8 (Polish)**: Depends on all prior phases

### User Story Dependencies

- **US5 (P1)**: Independent - file reorganization only
- **US1 (P1)**: Depends on Phase 2 foundation
- **US2 (P1)**: Depends on US1 (sprite rendering must exist to add health switching)
- **US3 (P2)**: Depends on US1 only (can run parallel with US2)
- **US4 (P3)**: Depends on US1 only (can run parallel with US2 and US3)

### Parallel Opportunities

- T001-T005: All sprite reorganization tasks run in parallel
- T006-T012: T006 first (types), then T007-T009 in parallel (state/store), then T010-T012 in parallel (URI/sprites/loader)
- US3 (T019-T021) and US4 (T022-T023) can run in parallel after US1
- US2 (T017-T018) and US3 (T019-T021) can run in parallel after US1

---

## Implementation Strategy

### MVP First (US5 + US1 + US2)

1. Complete Phase 1: Reorganize sprite directories
2. Complete Phase 2: Types, registry, migration, sprite loading
3. Complete Phase 4: Sprite sheet rendering (US1)
4. Complete Phase 5: Health-based animation (US2)
5. **STOP and VALIDATE**: Fish render as sprites with health state switching

### Incremental Delivery

1. Setup + Foundation → Sprites loadable
2. US5 + US1 → Fish render as animated sprites (MVP!)
3. US2 → Health-based animation states
4. US3 → Per-species zones/speed/size
5. US4 → Feeding animation polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Konva `Sprite` component handles frame advancement internally — no manual frame counter needed
- All species in new roster have sprites; procedural fallback only needed for corrupted/missing files
- Commit after each phase completion
