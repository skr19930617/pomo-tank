# Tasks: Legacy Code Cleanup

**Input**: Design documents from `/specs/010-legacy-code-cleanup/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: Not requested. No test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: User Story 1 - Remove Unused Type Definitions and Exports (Priority: P1) 🎯 MVP

**Goal**: Delete all dead type definitions, unused constants, unused functions, and their re-exports.

**Independent Test**: `npm run build` succeeds. Grep for removed identifiers returns zero matches in `src/`.

### Implementation for User Story 1

- [x] T001 [P] [US1] Remove deprecated `FishSpeciesId` type alias (lines 46-47) and legacy types section: `VariantConfig` interface (lines 85-89), `FishSpeciesConfig` interface (lines 91-103), and the section comment (line 83) from `src/shared/types.ts`
- [x] T002 [P] [US1] Remove unused `ACTION_BAR_HEIGHT` constant (line 159) from `src/shared/types.ts`
- [x] T003 [P] [US1] Remove unused `getGenusOrThrow()` function and its JSDoc comment (lines 38-43) from `src/game/species/index.ts`
- [x] T004 [US1] Remove `FishSpeciesId`, `VariantConfig`, `FishSpeciesConfig` from the type re-export block (lines 20, 25-26) in `src/game/state.ts`
- [x] T005 [US1] Run `npm run build` to verify zero compilation errors after US1 removals

**Checkpoint**: All unused types, constants, and functions are removed. Build passes.

---

## Phase 2: User Story 2 - Remove Legacy Species Migration Code (Priority: P2)

**Goal**: Delete the legacy species name mapping and migration function from state.ts, and remove the migration call chain from engine.ts and extension.ts.

**Independent Test**: `npm run build` succeeds. Grep for `LEGACY_SPECIES_MAP` and `migrateState` returns zero matches in `src/`.

### Implementation for User Story 2

- [x] T006 [US2] Remove the entire state migration section: section comment (line 246), `LEGACY_SPECIES_MAP` constant (lines 248-253), and `migrateState()` function (lines 255-304) from `src/game/state.ts`
- [x] T007 [US2] Remove `migrateState` from the import statement (line 9) and delete the entire `migrateState()` method (lines 45-79, including JSDoc) from `src/game/engine.ts`
- [x] T008 [US2] Remove the `engine.migrateState()` call and its comment (lines 43-44) from `src/extension.ts`
- [x] T009 [US2] Run `npm run build` to verify zero compilation errors after US2 removals

**Checkpoint**: All legacy migration code is removed. Build passes.

---

## Phase 3: User Story 3 - Remove Per-Fish Hunger Migration (Priority: P3)

**Goal**: Ensure per-fish hunger migration block is fully removed (covered within US2's engine.ts cleanup at T007).

**Independent Test**: Grep for `hungerLevel` in engine.ts returns only references to `this.state.tank.hungerLevel` (the current canonical form).

**Note**: The per-fish hunger migration lives inside `GameEngine.migrateState()` which is entirely deleted in T007. This phase exists only as a verification checkpoint.

- [x] T010 [US3] Verify that no per-fish `hungerLevel` migration references remain in `src/game/engine.ts` (grep check)

**Checkpoint**: All legacy hunger migration code confirmed removed.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across the entire codebase.

- [x] T011 Verify zero references to removed identifiers (`FishSpeciesId`, `VariantConfig`, `FishSpeciesConfig`, `ACTION_BAR_HEIGHT`, `getGenusOrThrow`, `LEGACY_SPECIES_MAP`, `migrateState`) across all `src/` files
- [x] T012 Update the backward-compatibility comment on the re-export block in `src/game/state.ts` (line 1) — remove "backward compatibility" wording since legacy types are gone
- [x] T013 Run `npm run build` for final compilation check
- [x] T014 Run `npm run lint` to verify no lint errors introduced

---

## Dependencies & Execution Order

### Phase Dependencies

- **US1 (Phase 1)**: No dependencies — can start immediately
- **US2 (Phase 2)**: No dependency on US1 (different code sections), but recommended after US1 for clean incremental commits
- **US3 (Phase 3)**: Depends on US2 (T007 deletes the method containing hunger migration)
- **Polish (Phase 4)**: Depends on all user stories being complete

### Within Each User Story

- Deletions in independent files (marked [P]) can run in parallel
- Build verification must run after all deletions in that story

### Parallel Opportunities

- T001, T002, T003 can all run in parallel (different files or independent sections)
- US1 and US2 can run in parallel (no overlapping code sections, except state.ts where US1 touches re-exports and US2 touches migration block)

---

## Parallel Example: User Story 1

```text
# These three tasks touch independent code and can run in parallel:
T001: Remove FishSpeciesId + VariantConfig + FishSpeciesConfig from src/shared/types.ts
T002: Remove ACTION_BAR_HEIGHT from src/shared/types.ts
T003: Remove getGenusOrThrow() from src/game/species/index.ts

# Then sequentially:
T004: Remove legacy re-exports from src/game/state.ts (depends on T001 removing the types)
T005: Build verification (depends on all above)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete US1 (T001-T005): Remove all unused types/constants/functions
2. **STOP and VALIDATE**: Build passes, grep confirms removals
3. Commit — codebase is cleaner, no behavioral change

### Incremental Delivery

1. US1 → Remove dead exports → Build & verify → Commit
2. US2 → Remove migration code → Build & verify → Commit
3. US3 → Verify hunger migration gone → Confirm
4. Polish → Final lint + comment cleanup → Commit

---

## Notes

- All changes are pure deletions — no new code
- TypeScript compilation is the primary safety net (no test suite exists)
- Commit after each user story for clean git history
- Total estimated removal: ~100 lines
