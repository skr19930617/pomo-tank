# Research: Legacy Code Cleanup

**Date**: 2026-03-26 | **Branch**: `010-legacy-code-cleanup`

## Summary

No NEEDS CLARIFICATION items existed in the technical context. All removal targets were identified through static analysis (grep + read).

## Findings

### 1. Removal Safety Verification

**Decision**: All identified targets are safe to remove.

**Rationale**: Every target was verified via codebase-wide grep:
- `FishSpeciesId` — only defined (types.ts:47) and re-exported (state.ts:20). No consumer.
- `VariantConfig` — only defined (types.ts:85) and re-exported (state.ts:25). No consumer.
- `FishSpeciesConfig` — only defined (types.ts:91) and re-exported (state.ts:26). No consumer. References `FishSpeciesId` and `VariantConfig` internally.
- `ACTION_BAR_HEIGHT` — only defined (types.ts:159). No import anywhere.
- `getGenusOrThrow()` — only defined (species/index.ts:39). No call site.
- `LEGACY_SPECIES_MAP` — only defined and used within `migrateState()` (state.ts:249-270).
- `migrateState()` (state.ts) — only imported by engine.ts:9, called at engine.ts:78.
- `engine.migrateState()` — only called at extension.ts:44.

**Alternatives considered**: Keeping migration code behind a feature flag was rejected — it adds complexity for a path that is no longer exercised.

### 2. Test Coverage Gap

**Decision**: Rely on TypeScript compilation as the primary safety net.

**Rationale**: No project-level test files exist. The `npm test` command and `npm run build` (esbuild) are the available verification tools. Since all changes are pure deletions, a successful build confirms no remaining references to removed code.

**Alternatives considered**: Writing tests before deletion was considered but rejected — there is nothing to test when the goal is removal of dead code. Post-deletion compilation is sufficient.
