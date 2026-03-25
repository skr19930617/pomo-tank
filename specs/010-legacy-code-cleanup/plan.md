# Implementation Plan: Legacy Code Cleanup

**Branch**: `010-legacy-code-cleanup` | **Date**: 2026-03-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/010-legacy-code-cleanup/spec.md`

## Summary

Remove all unused type definitions, unused exports, unused functions, and legacy migration code from the codebase. The current genus/species hierarchy and tank-wide hunger model become the sole recognized data format. This is a removal-only change with no new functionality.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**: @types/vscode ^1.85.0, esbuild ^0.20.0, React 18, react-konva, konva
**Storage**: VSCode ExtensionContext globalState (key-value persistence)
**Testing**: No project-level test suite exists (no test files found outside node_modules)
**Target Platform**: VSCode Extension (Node.js + Webview)
**Project Type**: VSCode Extension (desktop-app)
**Performance Goals**: N/A (removal-only, no behavioral change)
**Constraints**: Zero compilation errors, identical runtime behavior for current-format data
**Scale/Scope**: ~6 files touched, ~100 lines removed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is unconfigured (template placeholders only). No gates to evaluate — proceeding.

## Project Structure

### Documentation (this feature)

```text
specs/010-legacy-code-cleanup/
├── plan.md              # This file
├── research.md          # Phase 0 output (minimal — no unknowns)
├── data-model.md        # Phase 1 output (current canonical model)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── shared/
│   └── types.ts          # Remove: FishSpeciesId, VariantConfig, FishSpeciesConfig, ACTION_BAR_HEIGHT
├── game/
│   ├── state.ts          # Remove: legacy re-exports, LEGACY_SPECIES_MAP, migrateState()
│   ├── engine.ts         # Remove: hunger migration block, migrateState() call + import
│   └── species/
│       └── index.ts      # Remove: getGenusOrThrow()
└── extension.ts          # Remove: engine.migrateState() call
```

**Structure Decision**: No new files or directories. All changes are deletions within existing files.

## Removal Manifest

### File 1: `src/shared/types.ts`

| Line(s) | Target | Action |
|---------|--------|--------|
| 46-47 | `FishSpeciesId` type alias + `@deprecated` comment | Delete |
| 83-103 | Legacy section: comment + `VariantConfig` + `FishSpeciesConfig` | Delete |
| 159 | `ACTION_BAR_HEIGHT` constant | Delete |

### File 2: `src/game/state.ts`

| Line(s) | Target | Action |
|---------|--------|--------|
| 20 | `FishSpeciesId` re-export | Remove from type re-export block |
| 25-26 | `VariantConfig`, `FishSpeciesConfig` re-exports | Remove from type re-export block |
| 246-304 | `LEGACY_SPECIES_MAP` + `migrateState()` + section comment | Delete entire block |

### File 3: `src/game/engine.ts`

| Line(s) | Target | Action |
|---------|--------|--------|
| 9 | `migrateState` import | Remove from import statement |
| 45-79 | `migrateState()` method (entire method including JSDoc) | Delete |

### File 4: `src/game/species/index.ts`

| Line(s) | Target | Action |
|---------|--------|--------|
| 38-43 | `getGenusOrThrow()` function + JSDoc | Delete |

### File 5: `src/extension.ts`

| Line(s) | Target | Action |
|---------|--------|--------|
| 43-44 | `engine.migrateState()` call + comment | Delete |

## Execution Order

1. **types.ts** — Remove dead types and constant (no dependents)
2. **species/index.ts** — Remove `getGenusOrThrow()` (no dependents)
3. **state.ts** — Remove legacy re-exports and migration function
4. **engine.ts** — Remove migration method and import
5. **extension.ts** — Remove migration call
6. **Verify** — `npm run build` (compilation check)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| User with old-format globalState | Low (migration has been live for multiple releases) | Medium (fish data lost or errors) | Accepted trade-off per spec. Users can reset state. |
| Hidden import of removed type | Very Low | Low (compile error caught immediately) | Full grep verification before and after removal |
| No test suite to catch regressions | Medium | Medium | Compilation check is primary safety net. Manual smoke test recommended. |

## Complexity Tracking

No constitution violations to justify. This is a straightforward deletion task.
