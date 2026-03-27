# Tasks: Filter Config & Pixel-Art Rendering

**Input**: Design documents from `/specs/013-filter-config-rendering/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story. US1 (config extraction) must complete before US2 (rendering) since rendering depends on the config's visual properties. US3 (visual scaling) is inherently satisfied by the data-driven rendering in US2 — its phase is verification only.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Add shared types for the new filter data model.

- [x] T001 Add `FilterMountType` type (`'internal' | 'hang_on_back' | 'canister'`), `FilterVisual` interface (relativeSize, primaryColor, accentColor, width, height), and `FilterConfig` interface (id, displayName, capacityBonus, pomoCost, prerequisite, description, mount, visual) to `src/shared/types.ts`. Export all from the file.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the filter config module with all 4 filter definitions and the store item builder. This is the single source of truth that replaces hardcoded data.

**CRITICAL**: No rendering or store integration can begin until this phase is complete.

- [x] T002 Create `src/game/filters/basic-sponge.ts`: export a `FilterConfig` for basic_sponge with mount `'internal'`, capacityBonus 0, pomoCost 0, visual `{ relativeSize: 0.6, primaryColor: '#66aa66', accentColor: '#448844', width: 10, height: 12 }`.
- [x] T003 [P] Create `src/game/filters/hang-on-back.ts`: export a `FilterConfig` for hang_on_back with mount `'hang_on_back'`, capacityBonus 3, pomoCost 50, visual `{ relativeSize: 0.8, primaryColor: '#555577', accentColor: '#7777aa', width: 14, height: 20 }`.
- [x] T004 [P] Create `src/game/filters/canister.ts`: export a `FilterConfig` for canister with mount `'canister'`, capacityBonus 6, pomoCost 150, visual `{ relativeSize: 1.0, primaryColor: '#446644', accentColor: '#668866', width: 16, height: 24 }`.
- [x] T005 [P] Create `src/game/filters/premium-canister.ts`: export a `FilterConfig` for premium_canister with mount `'canister'`, capacityBonus 10, pomoCost 400, visual `{ relativeSize: 1.3, primaryColor: '#334455', accentColor: '#ccaa44', width: 20, height: 28 }`.
- [x] T006 Create `src/game/filters/index.ts`: import all 4 filter configs, create `ALL_FILTERS` array, `FILTER_REGISTRY` Map keyed by FilterId, export `getFilter(id)`, `getAllFilters()`, and `buildFilterStoreItems()`. `buildFilterStoreItems()` should generate `StoreItemData` entries from each FilterConfig where `pomoCost > 0` (skip basic_sponge), following the same pattern as `buildFishStoreItems()` in `src/game/species/index.ts`.

**Checkpoint**: Filter config module exists with all 4 filters and a store item builder. No other files changed yet.

---

## Phase 3: User Story 1 - Filter Data Configuration Extraction (Priority: P1) MVP

**Goal**: Remove hardcoded filter data from state.ts and store.ts. Replace with imports from the new filter config module. All existing functionality preserved.

**Independent Test**: Build succeeds. Open tank → purchase filters → capacity bonus applies correctly. Store lists filters with correct names and prices.

### Implementation for User Story 1

- [x] T007 [US1] Update `src/game/state.ts`: remove the `FilterData` interface (lines 44-48) and the `FILTERS` Record (lines 50-71). Remove the 3 filter entries from `BASE_STORE_ITEMS` (hang_on_back, canister, premium_canister). Import `buildFilterStoreItems` from `../game/filters` and add `...buildFilterStoreItems()` to the `STORE_ITEMS` composition (alongside `...buildFishStoreItems()`). Re-export `FilterConfig` and `FilterMountType` types from the filters module for convenience.
- [x] T008 [US1] Update `src/game/store.ts`: replace `import { FILTERS } from './state'` with `import { getFilter } from './filters'`. Update `calculateMaxCapacity()` to use `getFilter(tank.filterId)?.capacityBonus ?? 0` instead of `FILTERS[tank.filterId]?.capacityBonus`. Verify no other references to the old `FILTERS` constant remain in this file.
- [x] T009 [US1] Verify all other files that imported `FILTERS` or `FilterData` from `state.ts` are updated. Search for remaining references in `src/` and fix any import errors.

**Checkpoint**: Build succeeds. `FILTERS` and `FilterData` no longer exist in state.ts. Store lists filters correctly. Capacity bonuses work.

---

## Phase 4: User Story 2 - Pixel-Art Filter Rendering in Tank (Priority: P2)

**Goal**: Render pixel-art filter visuals in the tank scene based on the equipped filter's config. Internal (sponge) renders inside Tank.tsx. External (HOB, canister) renders in a new Filter.tsx component.

**Independent Test**: Open tank → basic sponge visible inside water. Purchase HOB → box on tank rim. Purchase canister → cylinder on desk beside tank. Purchase premium canister → larger cylinder with gold accent.

### Implementation for User Story 2

- [x] T010 [US2] Update `src/webview/tank-panel/components/Tank.tsx`: add `filterId` prop (type `FilterId | null`). When filterId is an internal mount filter (look up via `getFilter()`), render a small Konva Rect/Group inside the water area at bottom-right corner. Use the filter's `visual.primaryColor` and `visual.accentColor` for the rect fill. Position: x = `tankWidth - frameThickness - visual.width - 2`, y = `tankHeight - frameThickness - sandHeight - visual.height`. Only render when lightOn is true (or dim with opacity when off). Import `getFilter` from `../../../game/filters`.
- [x] T011 [US2] Create `src/webview/tank-panel/components/Filter.tsx`: a Konva component that renders external filters (hang_on_back and canister mount types). Accept props: `filterId: FilterId | null`, `tankWidth: number`, `tankHeight: number`, `lightOn: boolean`. Look up FilterConfig via `getFilter(filterId)`. For hang_on_back: render a box at x = `tankWidth - 2`, y = `tankHeight * 0.3`, straddling the tank rim (some rects above, some below the rim line). For canister: render a cylinder shape at x = `tankWidth + 4`, y = `tankHeight - visual.height`, sitting at desk level. Use visual.primaryColor for body, visual.accentColor for highlights/tubes. Dim with opacity when lightOn is false. Return null if filterId is null or mount is internal.
- [x] T012 [US2] Update `src/webview/tank-panel/components/TankScene.tsx`: pass `state.tank.filterId` as `filterId` prop to `<Tank>`. Add `<Filter>` component after `<Tank>` and before fish rendering in the tank Group. Pass `filterId={state.tank.filterId}`, `tankWidth={rawTankW}`, `tankHeight={rawTankH}`, `lightOn={state.lightOn}` to Filter.

**Checkpoint**: All 4 filter types render visually. Each mount type renders at the correct position. Filters dim when light is off.

---

## Phase 5: User Story 3 - Filter Visual Scaling by Rank (Priority: P3)

**Goal**: Verify that filter visual progression (size + color) is driven by config data and that each tier is visually distinguishable.

**Independent Test**: Compare all 4 filters side-by-side (via debug mode or sequential purchase). Each tier should be noticeably larger and/or more colorful than the previous.

### Verification for User Story 3

- [x] T013 [US3] Verify that visual scaling is correct by reviewing the filter configs: basic_sponge (10×12, muted green) < hang_on_back (14×20, gray-blue) < canister (16×24, dark green) < premium_canister (20×28, dark blue with gold accent). Ensure the rendering code in Tank.tsx and Filter.tsx uses `visual.width` and `visual.height` from config (not hardcoded sizes). Adjust any hardcoded rendering dimensions if found.

**Checkpoint**: All 4 tiers are visually distinguishable by size and color. No rendering code uses hardcoded size values.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final build validation and cleanup.

- [x] T014 Run `npm run build` and fix any TypeScript or esbuild errors across all modified files
- [x] T015 Run `npm run lint` and fix any ESLint errors
- [x] T016 Perform manual visual testing per quickstart.md checklist: verify all 10 test scenarios pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001) — BLOCKS all other work
- **US1 (Phase 3)**: Depends on Phase 2 (T006) — config module must exist before state.ts refactoring
- **US2 (Phase 4)**: Depends on US1 (config integrated) — rendering needs filter data accessible
- **US3 (Phase 5)**: Depends on US2 — verification of visual output
- **Polish (Phase 6)**: Depends on US1 + US2 + US3

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2. Foundation — all config data extracted.
- **US2 (P2)**: Depends on US1. Core rendering feature.
- **US3 (P3)**: Depends on US2. Verification and polish.

### Parallel Opportunities

- T002, T003, T004, T005 can all run in parallel (separate filter config files)
- T010 and T011 can run in parallel (Tank.tsx vs Filter.tsx, different rendering concerns)

---

## Parallel Example: Foundational Phase

```text
# After T001 (types) is complete:

# Parallel: All 4 filter config files are independent
Task T002: Create basic-sponge.ts
Task T003: Create hang-on-back.ts
Task T004: Create canister.ts
Task T005: Create premium-canister.ts

# Sequential: Index depends on all configs
Task T006: Create filters/index.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002-T006)
3. Complete Phase 3: User Story 1 (T007-T009)
4. **STOP and VALIDATE**: Build succeeds, store works, capacity bonuses correct
5. Proceed to US2 (rendering) and US3 (verification)

### Recommended Execution Order (Single Developer)

1. T001 → T002+T003+T004+T005 (parallel) → T006
2. T007 → T008 → T009
3. T010+T011 (parallel) → T012
4. T013
5. T014 → T015 → T016

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- US3 is primarily verification — the visual scaling is inherently data-driven from US2's implementation
- Filter config files follow the species config pattern (see `src/game/species/neon-tetra.ts` as reference)
- Internal filter renders inside Tank.tsx; external filter renders in new Filter.tsx
- The basic_sponge is NOT sold in store (pomoCost = 0, skipped by buildFilterStoreItems)
