# Feature Specification: Legacy Code Cleanup

**Feature Branch**: `010-legacy-code-cleanup`
**Created**: 2026-03-25
**Status**: Draft
**Input**: User description: "Remove unused code and legacy compatibility layers, treat current data structures as source of truth"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remove Unused Type Definitions and Exports (Priority: P1)

As a developer maintaining the codebase, I want all dead type definitions and unused exports removed so that the codebase only contains code that is actively referenced.

**Why this priority**: Unused types and exports create confusion about what is canonical. Removing them is the lowest-risk cleanup step and immediately reduces cognitive load.

**Independent Test**: After removal, the project compiles without errors and all existing tests pass. Searching for removed identifiers returns zero results.

**Acceptance Scenarios**:

1. **Given** the deprecated `FishSpeciesId` type alias exists, **When** it is removed from its definition and all re-export sites, **Then** the project compiles successfully and no file references `FishSpeciesId`
2. **Given** the legacy `VariantConfig` and `FishSpeciesConfig` interfaces exist, **When** they are removed from their definition and all re-export sites, **Then** no compilation errors occur and no file references these types
3. **Given** the constant `ACTION_BAR_HEIGHT` is exported but never imported, **When** it is removed, **Then** the project compiles and no file references the constant
4. **Given** the function `getGenusOrThrow()` is exported but never called, **When** it is removed, **Then** the project compiles and no file references the function

---

### User Story 2 - Remove Legacy Species Migration Code (Priority: P2)

As a developer, I want the legacy species migration logic removed so that the current genus/species hierarchy is treated as the sole data format, without old compatibility paths.

**Why this priority**: Migration code references the old data model (flat species with variants) and adds complexity to state initialization. Removing it eliminates an entire code path and simplifies the engine.

**Independent Test**: After removal, the project compiles and tests pass. The engine initialization no longer calls any species migration function. The legacy species mapping constant no longer exists.

**Acceptance Scenarios**:

1. **Given** a legacy species mapping constant maps old species names to new genus/species IDs, **When** it is removed along with its associated migration function, **Then** no file references these identifiers and the project compiles
2. **Given** the engine's initialization method calls the species migration, **When** the species migration call is removed from the engine, **Then** the engine initializes state without legacy transformation

---

### User Story 3 - Remove Per-Fish Hunger Migration (Priority: P3)

As a developer, I want the per-fish hunger level migration logic removed from the engine so that the tank-wide hunger model is the only recognized format.

**Why this priority**: This migration handles a schema change from per-fish to tank-wide hunger. Once all users have migrated, the migration path is dead code.

**Independent Test**: After removal, the engine's initialization method no longer checks for or deletes per-fish hunger levels. The project compiles and tests pass.

**Acceptance Scenarios**:

1. **Given** the engine checks for undefined tank-level hunger to detect old schema, **When** this migration block is removed, **Then** the engine assumes tank-level hunger always exists
2. **Given** the engine loops over fish to delete legacy per-fish hunger fields, **When** this cleanup loop is removed, **Then** no code references per-fish hunger levels

---

### Edge Cases

- What happens if a user still has old-format data in storage when the migration code is removed? The old data will be loaded as-is, potentially causing runtime issues if fields are missing. This is an accepted trade-off — the old schema is no longer supported.
- What if a test fixture uses legacy data shapes? Those test fixtures must be updated to use the current schema.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project MUST compile without errors after all removals
- **FR-002**: All existing tests MUST pass after cleanup, with test fixtures updated if necessary
- **FR-003**: The deprecated `FishSpeciesId` type alias MUST be removed from all definition and re-export sites
- **FR-004**: The legacy `VariantConfig` and `FishSpeciesConfig` interfaces MUST be removed from all definition and re-export sites
- **FR-005**: The unused `ACTION_BAR_HEIGHT` constant MUST be removed
- **FR-006**: The unused `getGenusOrThrow()` function MUST be removed from the species registry
- **FR-007**: The legacy species mapping constant and associated migration function MUST be removed
- **FR-008**: The per-fish hunger level migration block in the engine MUST be removed
- **FR-009**: The backward-compatibility re-export block MUST be removed
- **FR-010**: No new functionality MUST be introduced — this is a removal-only change

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero compilation errors after all changes (build exits successfully)
- **SC-002**: All existing tests pass (test suite exits successfully)
- **SC-003**: Zero references to removed identifiers across the codebase (no matches for `FishSpeciesId`, `VariantConfig`, `FishSpeciesConfig`, `ACTION_BAR_HEIGHT`, `getGenusOrThrow`, `LEGACY_SPECIES_MAP`, legacy `migrateState` in non-spec files)
- **SC-004**: Net reduction of at least 80 lines of code
- **SC-005**: No behavioral change for users with current-format data — the extension operates identically

## Assumptions

- All active users have already been migrated to the current genus/species hierarchy and tank-wide hunger model. Old-format data in storage is no longer supported.
- The underscore-prefixed parameters (`_fish`, `_isActiveCoding`, `_genus`) are intentional API placeholders and are out of scope for this cleanup.
- The engine's initialization method itself may remain if other non-legacy logic is present; only the legacy-specific blocks within it are removed.
