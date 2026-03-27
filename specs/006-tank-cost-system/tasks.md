# Tasks: Tank Cost System Simplification

**Input**: Design documents from `/specs/006-tank-cost-system/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Type System & Data Model)

**Purpose**: Update all type definitions, catalogs, and core game logic to the new cost-based model. MUST complete before any user story work.

**Why blocking**: Every user story depends on the new `capacityCost` attribute, tank-wide deterioration, and the updated `Tank`/`Fish`/`FilterData` types.

- [x] T001 [P] Update FishSpeciesData interface in src/shared/types.ts: remove `hungerRate` and `dirtinessLoad` fields, add `capacityCost: number`
- [x] T002 [P] Update Fish interface in src/shared/types.ts: remove `hungerLevel` field
- [x] T003 [P] Update Tank interface in src/shared/types.ts: add `hungerLevel: number` (0-100, tank-wide)
- [x] T004 [P] Update FilterData interface in src/shared/types.ts: remove `efficiency` field, add `capacityBonus: number`
- [x] T005 Replace TANK_CAPACITY with TANK_BASE_CAPACITY in src/shared/types.ts (Nano:4, Small:8, Medium:14, Large:22, XL:32) and add DETERIORATION_THRESHOLD = 70 constant
- [x] T006 Update FISH_SPECIES catalog in src/game/state.ts: remove hungerRate/dirtinessLoad, add capacityCost (guppy:1, neon_tetra:1, corydoras:2, betta:2, angelfish:4)
- [x] T007 Update FILTERS catalog in src/game/state.ts: remove efficiency, add capacityBonus (basic_sponge:0, hang_on_back:3, canister:6, premium_canister:10)
- [x] T008 Rewrite applyTick in src/game/deterioration.ts: replace per-fish hunger/dirtiness with tank-wide fixed rates derived from sessionMinutes (hunger: DETERIORATION_THRESHOLD/(1×sessionMinutes), water: DETERIORATION_THRESHOLD/(3×sessionMinutes), algae: DETERIORATION_THRESHOLD/(5×sessionMinutes) + water-scaled bonus). Remove isActiveCoding multiplier. Apply hunger to tank.hungerLevel
- [x] T009 Update isPoorConditions in src/game/health.ts: read state.tank.hungerLevel instead of fish.hungerLevel for hunger threshold check
- [x] T010 Update GameEngine in src/game/engine.ts: accept sessionMinutes constructor parameter, pass to applyTick. Update performAction('feedFish') to reduce tank.hungerLevel (subtract 60, min 0) instead of per-fish hunger
- [x] T011 Update GameStateSnapshot in src/shared/types.ts: add `capacity: { current: number, max: number }` and ensure `tank.hungerLevel` is included
- [x] T012 Add state migration logic in src/game/engine.ts: on load, migrate per-fish hungerLevel to tank.hungerLevel (average of living fish), map old filter data to new capacityBonus by filterId, handle missing capacityCost fields gracefully

**Checkpoint**: Core data model and game logic updated. All type errors resolved. Game engine runs with tank-wide deterioration.

---

## Phase 2: User Story 1 - View Tank Cost Status on HUD (Priority: P1) 🎯 MVP

**Goal**: Display current total cost and maximum accepted cost on the HUD so users can see capacity at a glance.

**Independent Test**: Open tank panel → verify "current/max" cost numbers appear on HUD. At-capacity and over-capacity states show warning colors.

### Implementation for User Story 1

- [x] T013 [US1] Add helper functions in src/game/store.ts: `calculateCurrentCost(fish: Fish[]): number` (sum of capacityCost for living fish) and `calculateMaxCapacity(tank: Tank): number` (TANK_BASE_CAPACITY[sizeTier] + FILTERS[filterId].capacityBonus)
- [x] T014 [US1] Include capacity data in snapshot: update createSnapshot in src/game/engine.ts to populate `capacity.current` and `capacity.max` using the new helper functions
- [x] T015 [US1] Wire capacity data to webview: update src/providers/tank-panel.ts to pass capacity.current and capacity.max from snapshot to the webview
- [x] T016 [US1] Add cost display props to HudOverlay: update HudOverlayProps in src/webview/tank-panel/components/HudOverlay.tsx to accept `currentCost: number` and `maxCost: number`
- [x] T017 [US1] Render cost capacity indicator in HUD center area of src/webview/tank-panel/components/HudOverlay.tsx: display fish icon + "current/max" text. Color: white (normal), yellow (>=80% capacity), red (>=100% or over-capacity)
- [x] T018 [US1] Pass capacity props from App to HudOverlay in src/webview/tank-panel/App.tsx

**Checkpoint**: HUD shows cost capacity. Users can see "3/10" style display with color coding.

---

## Phase 3: User Story 2 - Fish Species Have Clear Individual Costs (Priority: P1)

**Goal**: Each fish species displays its capacity cost in the store alongside pomo price.

**Independent Test**: Open store → verify each fish species shows capacity cost value next to its pomo price.

### Implementation for User Story 2

- [x] T019 [US2] Update store purchase validation in src/game/store.ts: replace `livingFish.length >= TANK_CAPACITY[sizeTier]` with cost-based check using calculateCurrentCost and calculateMaxCapacity. Update error message to "Not enough capacity (current/max)"
- [x] T020 [US2] Add capacityCost display to store fish items in src/webview/tank-panel/components/Store.tsx (or equivalent store UI component): show capacity cost alongside pomo price for each fish species
- [x] T021 [US2] Update store item data passed to webview in src/game/engine.ts createSnapshot: include capacityCost for fish species items so the store UI can display it

**Checkpoint**: Store shows capacity cost per fish. Purchase blocked when cost would exceed capacity.

---

## Phase 4: User Story 3 - Configurable Timer Duration (Priority: P2)

**Goal**: Timer duration is configurable via VSCode settings and fully decoupled from tank state.

**Independent Test**: Change `pomotank.workSessionMinutes` setting → restart timer → verify countdown reflects new duration. Verify overtime color changes at configured threshold.

### Implementation for User Story 3

- [x] T022 [P] [US3] Read `pomotank.workSessionMinutes` config in src/extension.ts: get value from workspace configuration, clamp to [1, 120], pass to GameEngine constructor
- [x] T023 [P] [US3] Update points timing windows in src/game/points.ts: replace hardcoded PERFECT_WINDOW_MIN/MAX_MS and GOOD_WINDOW_MIN/MAX_MS with session-relative values (perfect: 0.8×-1.2× session, good: 0.6×-1.4× session)
- [x] T024 [US3] Update useTimer in src/webview/tank-panel/hooks/useTimer.ts: accept sessionMinutes prop, compute overtime threshold as sessionMinutes × 60 × 1000 instead of hardcoded POMO_THRESHOLD_MS
- [x] T025 [US3] Pass sessionMinutes from snapshot to webview timer: update src/providers/tank-panel.ts and src/webview/tank-panel/App.tsx to thread sessionMinutes through to useTimer

**Checkpoint**: Timer works with custom durations. Overtime coloring aligns with configured session length. Deterioration rates match session rhythm.

---

## Phase 5: User Story 4 - Tank Upgrades Increase Cost Capacity Only (Priority: P2)

**Goal**: Tank and filter upgrades increase max cost capacity only (already structurally done in Phase 1). Verify end-to-end behavior.

**Independent Test**: Purchase tank/filter upgrade → verify HUD max capacity increases → verify timer remains unchanged.

### Implementation for User Story 4

- [x] T026 [US4] Verify tank upgrade purchase in src/game/store.ts correctly updates sizeTier and that calculateMaxCapacity reflects the new base capacity
- [x] T027 [US4] Verify filter upgrade purchase in src/game/store.ts correctly updates filterId and that calculateMaxCapacity reflects the new capacityBonus
- [x] T028 [US4] Update store item descriptions in src/game/state.ts STORE_ITEMS: add capacity impact info to tank/filter upgrade descriptions (e.g., "Capacity: +8 base" for tank_small, "Capacity: +3 bonus" for hang_on_back)

**Checkpoint**: Upgrades increase capacity shown on HUD. Timer unaffected by any upgrade.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, migration robustness, and final validation.

- [x] T029 Add timer bounds validation in src/extension.ts: if user config is outside [1, 120], clamp and log a warning
- [x] T030 Handle over-capacity edge case in src/game/store.ts: when currentCost > maxCost (post-migration), show clear messaging that no new fish can be added
- [x] T031 Test state migration with sample legacy data: verify per-fish hungerLevel averages correctly to tank.hungerLevel, old fish-count capacity converts gracefully, over-capacity fish are preserved
- [x] T032 Run full build and lint check: `npm run build && npm test && npm run lint`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies - start immediately. BLOCKS all user stories.
- **US1 - HUD Cost Display (Phase 2)**: Depends on Phase 1 completion
- **US2 - Fish Species Costs (Phase 3)**: Depends on Phase 1 completion. Can run in parallel with US1.
- **US3 - Configurable Timer (Phase 4)**: Depends on Phase 1 completion. Can run in parallel with US1/US2.
- **US4 - Upgrades = Capacity (Phase 5)**: Depends on Phase 1 + US1 (to verify HUD updates). Lightweight verification phase.
- **Polish (Phase 6)**: Depends on all user stories being complete.

### User Story Dependencies

- **US1 (P1)**: After Foundational → independent
- **US2 (P1)**: After Foundational → independent (can parallel with US1)
- **US3 (P2)**: After Foundational → independent (can parallel with US1/US2)
- **US4 (P2)**: After Foundational + US1 (needs HUD to verify capacity display updates)

### Within Foundational Phase

- T001-T004 are parallel (independent type changes in same file but different interfaces)
- T005 after T001-T004 (replaces constant that depends on updated types)
- T006-T007 after T001-T005 (catalogs use updated types)
- T008 after T006-T007 (deterioration uses catalogs)
- T009 after T003 (health reads tank.hungerLevel)
- T010 after T008-T009 (engine uses deterioration + health)
- T011 after T001-T004 (snapshot reflects updated types)
- T012 after T010-T011 (migration needs all new types + engine)

### Parallel Opportunities

**Within Foundational Phase:**
```
Parallel: T001, T002, T003, T004 (independent interface updates)
Then: T005 (constants)
Parallel: T006, T007 (catalog updates)
Parallel: T008, T009, T011 (deterioration, health, snapshot)
Then: T010 (engine)
Then: T012 (migration)
```

**After Foundational:**
```
Parallel: US1 (T013-T018), US2 (T019-T021), US3 (T022-T025)
Then: US4 (T026-T028) after US1
Then: Polish (T029-T032)
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Foundational (T001-T012)
2. Complete Phase 2: US1 - HUD Cost Display (T013-T018)
3. **STOP and VALIDATE**: Open tank panel, verify cost display works
4. Core value delivered: users can see capacity

### Incremental Delivery

1. Foundational → all types and game logic updated
2. US1 → HUD shows cost → validate (MVP!)
3. US2 → Store shows per-fish cost, purchase validation → validate
4. US3 → Timer configurable → validate
5. US4 → Verify upgrades → validate
6. Polish → Edge cases, migration, final build

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No test tasks generated (not requested in spec)
- T001-T004 modify the same file (types.ts) but different interfaces — can be done as one atomic edit in practice
- State migration (T012) is critical for existing users — test with real save data
- Commit after each phase for safe rollback points
