# Tasks: Tank Config Refactor

**Input**: Design documents from `/specs/016-tank-config-refactor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Create tank registry directory structure

- [x] T001 Create directory `src/game/tanks/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define TankId type, TankConfig interface, and visual constants that all user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Add `TankId` union literal type and `TankConfig` interface to `src/shared/types.ts` — TankId = `'nano_20' | 'small_30' | 'medium_45' | 'large_60' | 'xl_90'`; TankConfig fields: id, displayName, widthMm, heightMm, depthMm, baseCapacity, pomoCost, prerequisite, description, renderWidth, renderHeight. Keep old `TankSizeTier` enum temporarily for backward compatibility during migration.
- [x] T003 Add new visual constants `LIGHT_GAP = 6`, `LIGHT_DIFFUSION_OVERHANG = 12`, `HUD_BOTTOM_PAD = 8` to `src/shared/types.ts`

**Checkpoint**: Foundation types ready — user story implementation can begin

---

## Phase 3: User Story 1 — Tank Config as Typed Registry (Priority: P1)

**Goal**: Define all tanks in individual config files with a Map-based registry, mirroring the filter pattern. Replace scattered constants (`TANK_BASE_CAPACITY`, `TANK_RENDER_SIZES`, `TANK_DIMENSIONS_MM`, `TANK_SIZE_ORDER`) with unified `TankConfig` objects.

**Independent Test**: `getTank('nano_20')` returns full config; `getAllTanks()` returns 5 tanks in size order; old `TANK_BASE_CAPACITY` / `TANK_RENDER_SIZES` / `TANK_DIMENSIONS_MM` / `TANK_SIZE_ORDER` constants are removed.

### Implementation for User Story 1

- [x] T004 [P] [US1] Create `src/game/tanks/nano-20.ts` — export `nano20: TankConfig` with id='nano_20', displayName='20cm Cube', widthMm=200, heightMm=200, depthMm=200, baseCapacity=4, pomoCost=0, prerequisite={}, renderWidth=200, renderHeight=150
- [x] T005 [P] [US1] Create `src/game/tanks/small-30.ts` — export `small30: TankConfig` with id='small_30', displayName='30cm Tank', widthMm=300, heightMm=250, depthMm=200, baseCapacity=8, pomoCost=30, prerequisite={}, renderWidth=260, renderHeight=195
- [x] T006 [P] [US1] Create `src/game/tanks/medium-45.ts` — export `medium45: TankConfig` with id='medium_45', displayName='45cm Tank', widthMm=450, heightMm=300, depthMm=240, baseCapacity=14, pomoCost=100, prerequisite={requiredUnlocks:['small_30']}, renderWidth=320, renderHeight=240
- [x] T007 [P] [US1] Create `src/game/tanks/large-60.ts` — export `large60: TankConfig` with id='large_60', displayName='60cm Tank', widthMm=600, heightMm=360, depthMm=300, baseCapacity=22, pomoCost=250, prerequisite={requiredUnlocks:['medium_45']}, renderWidth=370, renderHeight=278
- [x] T008 [P] [US1] Create `src/game/tanks/xl-90.ts` — export `xl90: TankConfig` with id='xl_90', displayName='90cm Tank', widthMm=900, heightMm=450, depthMm=350, baseCapacity=32, pomoCost=500, prerequisite={requiredUnlocks:['large_60']}, renderWidth=400, renderHeight=300
- [x] T009 [US1] Create `src/game/tanks/index.ts` — import all tank configs, create `TANK_REGISTRY: Map<TankId, TankConfig>`, export `getTank(id)`, `getAllTanks()` (returns ordered array), `buildTankStoreItems()` (skip pomoCost=0, return Record<string, StoreItemData>)
- [x] T010 [US1] Update `src/game/state.ts` — change `Tank.sizeTier: TankSizeTier` to `Tank.tankId: TankId`; replace `BASE_STORE_ITEMS` with import from `buildTankStoreItems()`; add `migrateState()` function that detects old `sizeTier` field and maps to new `tankId` (Nano→nano_20, Small→small_30, Medium→medium_45, Large→large_60, XL→xl_90), also migrate `unlockedItems` (tank_small→small_30, tank_medium→medium_45, tank_large→large_60, tank_xl→xl_90); update `createInitialState()` to use `tankId: 'nano_20'`; update `GameStateSnapshot.tank.sizeTier` to `tank.tankId: TankId`; update re-exports (remove `TANK_BASE_CAPACITY`, `TANK_SIZE_ORDER`, `TANK_RENDER_SIZES`, `TANK_DIMENSIONS_MM`, `TankSizeTier`)
- [x] T011 [US1] Update `src/persistence/storage.ts` — wrap `loadState()` return with `migrateState()` call to handle old save data
- [x] T012 [US1] Update `src/game/store.ts` — replace `TANK_BASE_CAPACITY[tank.sizeTier]` in `calculateMaxCapacity()` with `getTank(tank.tankId)?.baseCapacity ?? 0`; update `canPurchase()` to remove `TANK_SIZE_ORDER` usage; update `executePurchase()` TankUpgrade case to set `newState.tank.tankId` directly from item ID instead of `sizeMap`; remove imports of `TankSizeTier`, `TANK_BASE_CAPACITY`, `TANK_SIZE_ORDER`
- [x] T013 [US1] Update `src/game/engine.ts` — change `switchTank(sizeTier: TankSizeTier)` to `switchTank(tankId: TankId)`; use `getTank(tankId)` for validation and capacity check; update state assignment to `tank.tankId`; replace `TANK_BASE_CAPACITY[sizeTier]` with `getTank(tankId)?.baseCapacity`
- [x] T014 [US1] Update `src/shared/messages.ts` — change `switchTank` message from `{ type: 'switchTank'; sizeTier: TankSizeTier }` to `{ type: 'switchTank'; tankId: TankId }`; update import
- [x] T015 [US1] Update `src/providers/tank-panel.ts` — change `switchTank` handler to pass `message.tankId` instead of `message.sizeTier`
- [x] T016 [US1] Update `src/webview/tank-panel/components/TankScene.tsx` — replace `TANK_RENDER_SIZES[state.tank.sizeTier]` with `getTank(state.tank.tankId)` to get `renderWidth`/`renderHeight`; remove import of `TANK_RENDER_SIZES`
- [x] T017 [US1] Update `src/webview/tank-panel/components/TankManager.tsx` — replace `TANK_SIZE_ORDER` / `TANK_ITEM_MAP` / `TANK_BASE_CAPACITY` usage with `getAllTanks()` and `getTank()`; update switchTank message to use `tankId`; show tank `displayName` and `baseCapacity` from config
- [x] T018 [US1] Remove old constants from `src/shared/types.ts` — delete `TankSizeTier` enum, `TANK_BASE_CAPACITY`, `TANK_SIZE_ORDER`, `TANK_RENDER_SIZES`, `TANK_DIMENSIONS_MM`; update `FilterConfig.prerequisite.minTankSize` to `minTankId?: TankId`; update `StoreItemId` type to use new tank IDs
- [x] T019 [US1] Fix all remaining TypeScript compilation errors — search for any remaining references to `TankSizeTier`, `TANK_BASE_CAPACITY`, `TANK_SIZE_ORDER`, `TANK_RENDER_SIZES`, `TANK_DIMENSIONS_MM`, `sizeTier` across the codebase and update to use new TankId / TankConfig pattern; update filter configs (`src/game/filters/hang-on-back.ts`, etc.) if they reference `minTankSize` in prerequisites

**Checkpoint**: All tanks defined via registry, old constants removed, state migration works. `npm run build` passes.

---

## Phase 4: User Story 2 — Size-Based Fish Restriction (Priority: P2)

**Goal**: Remove `minTankSize` from `GenusConfig` and replace with dynamic calculation: `tankWidthMm >= maxSizeMm × 4`.

**Independent Test**: `GenusConfig` has no `minTankSize` field; purchasing a gourami (max 60mm) in a 20cm cube (200mm) is rejected because 60×4=240 > 200; purchasing a neon tetra (max 35mm) in a 20cm cube is allowed because 35×4=140 <= 200.

### Implementation for User Story 2

- [x] T020 [P] [US2] Remove `minTankSize` field from `GenusConfig` interface in `src/shared/types.ts`
- [x] T021 [P] [US2] Remove `minTankSize` from `src/game/species/neon-tetra.ts`
- [x] T022 [P] [US2] Remove `minTankSize` from `src/game/species/corydoras.ts`
- [x] T023 [P] [US2] Remove `minTankSize` from `src/game/species/gourami.ts`
- [x] T024 [P] [US2] Remove `minTankSize` from `src/game/species/otocinclus.ts`
- [x] T025 [P] [US2] Remove `minTankSize` from `src/game/species/shrimp.ts`
- [x] T026 [US2] Add `canFishFitInTank(genusId: GenusId, tankId: TankId): boolean` function to `src/game/store.ts` — compute `maxFishSize = Math.max(...genus.species.map(s => s.maxSizeMm))`, return `tank.widthMm >= maxFishSize * 4`
- [x] T027 [US2] Update `canPurchase()` in `src/game/store.ts` — replace the `minTankSize` check block (lines ~109-119) with call to `canFishFitInTank(genus.id, state.tank.tankId)`; update error message to show size requirement (e.g. "60mm fish needs 240mm+ tank width, current: 200mm")
- [x] T028 [US2] Update `src/game/species/index.ts` — remove `minTankSize` from `buildFishStoreItems()` prerequisite generation; remove the `genus.minTankSize !== 'Nano'` check; remove `minTankSize` from prerequisite type in return value
- [x] T029 [US2] Remove `minTankSize` from `StoreItemPrerequisite` interface in `src/game/state.ts` and remove the `minTankSize` check in `canPurchase()` (the generic prerequisite check around line 69-78 of store.ts)

**Checkpoint**: Fish restriction is purely size-based. No `minTankSize` anywhere in codebase. `npm run build` passes.

---

## Phase 5: User Story 3 — Light Diffusion and Spacing (Priority: P3)

**Goal**: Add visual gap between light and tank with diffusion effect; increase HUD-to-light spacing.

**Independent Test**: Light bar visually separated from tank top; light-on shows trapezoid glow wider than tank; HUD has more breathing room above light.

### Implementation for User Story 3

- [x] T030 [US3] Update `src/webview/tank-panel/components/Light.tsx` — add `LIGHT_GAP` (6px) below the light glow; add a trapezoid (Konva `Line` closed polygon) light cone when `lightOn=true`: top edge = light surface width, bottom edge = tankWidth + 2×LIGHT_DIFFUSION_OVERHANG, fill='#ffffcc', opacity=0.15; import `Line` from react-konva; accept new prop `lightGap` or use imported constant
- [x] T031 [US3] Update `src/webview/tank-panel/components/TankScene.tsx` — adjust `computeTankLayout()`: add `LIGHT_GAP` to `clusterH` calculation (clusterH = rawTankH + LIGHT_BAR_HEIGHT + LIGHT_GAP); add `HUD_BOTTOM_PAD` to available height calculation (availH = deskTop - HUD_HEIGHT - HUD_BOTTOM_PAD - TANK_PAD); update `lightTopRaw` to `-(LIGHT_BAR_HEIGHT + LIGHT_GAP)` so light bar is positioned higher, leaving gap to tank top

**Checkpoint**: Visual improvements confirmed — light diffuses, spacing is improved. `npm run build` passes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T032 Run `npm run lint` and fix any lint errors across all modified files
- [x] T033 Run `npm run test:unit` and fix any failing tests
- [x] T034 Verify full build with `npm run build` — ensure extension loads in VSCode and renders correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1
- **Phase 3 (US1 — Tank Registry)**: Depends on Phase 2 — MUST complete first as US2/US3 depend on TankId/TankConfig
- **Phase 4 (US2 — Size-Based Restriction)**: Depends on Phase 3 (needs TankConfig.widthMm and no TankSizeTier)
- **Phase 5 (US3 — Light Diffusion)**: Depends on Phase 3 (uses updated TankScene layout)
- **Phase 6 (Polish)**: Depends on all previous phases

### User Story Dependencies

- **US1 (P1)**: Foundation only — no other story dependencies
- **US2 (P2)**: Depends on US1 (needs TankConfig with widthMm, TankId type in store)
- **US3 (P3)**: Depends on US1 (needs updated TankScene layout). Can run in parallel with US2.

### Parallel Opportunities

- T004–T008: All 5 tank config files can be created in parallel
- T020–T025: All 5 species minTankSize removals can run in parallel
- US2 and US3 can run in parallel after US1 completes

---

## Parallel Example: User Story 1

```bash
# Create all tank config files in parallel:
Task T004: "Create src/game/tanks/nano-20.ts"
Task T005: "Create src/game/tanks/small-30.ts"
Task T006: "Create src/game/tanks/medium-45.ts"
Task T007: "Create src/game/tanks/large-60.ts"
Task T008: "Create src/game/tanks/xl-90.ts"

# Then sequentially: registry → state → store → engine → UI
```

## Parallel Example: User Story 2

```bash
# Remove minTankSize from all species in parallel:
Task T020: "Remove from GenusConfig interface"
Task T021: "Remove from neon-tetra.ts"
Task T022: "Remove from corydoras.ts"
Task T023: "Remove from gourami.ts"
Task T024: "Remove from otocinclus.ts"
Task T025: "Remove from shrimp.ts"

# Then sequentially: add canFishFitInTank → update canPurchase → update buildFishStoreItems
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational types
3. Complete Phase 3: Tank Registry (US1)
4. **STOP and VALIDATE**: Build passes, tanks display correctly, migration works
5. This alone delivers the core refactor value

### Incremental Delivery

1. Setup + Foundational → Types ready
2. US1 (Tank Registry) → Build passes, tanks work → Core refactor complete
3. US2 (Size Restriction) → Fish purchase uses size calc → Game balance improved
4. US3 (Light Diffusion) → Visual polish → User experience improved
5. Polish → Lint, tests, final build → Release ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US2 and US3 can proceed in parallel after US1 — but US1 MUST complete first
- Commit after each phase checkpoint
- T019 is a catch-all for compilation fixes — may require updating files beyond the explicit list
