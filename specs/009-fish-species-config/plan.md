# Implementation Plan: Fish Species Hierarchy Config with Growth & Lifespan Mechanics

**Branch**: `009-fish-species-config` | **Date**: 2026-03-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/009-fish-species-config/spec.md`

## Summary

Restructure fish species configuration from a flat inline catalog into a Genus/Species hierarchy with separate config files per Genus. Introduce mm-based sizing with tank-relative scaling, named swim layers, per-fish growth curves driven by a sigmoid model, natural lifespan aging (coexisting with existing acute sicknessTick death), and a cumulative maintenance quality score sampled from tank conditions at each pomo completion. Add a fish info tooltip on click/hover, and tank downgrade with overflow fish removal.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**: React 18, react-konva, konva, @types/vscode ^1.85.0, esbuild ^0.20.0
**Storage**: VSCode ExtensionContext globalState (key-value persistence)
**Testing**: Vitest (unit), manual testing via debug mode
**Target Platform**: VSCode Extension (desktop, all OS)
**Project Type**: VSCode Extension with React webview
**Performance Goals**: 60fps canvas rendering with up to 32 fish
**Constraints**: All state persisted in globalState (JSON-serializable), sprite sheets 64×64 with 6×2 grid
**Scale/Scope**: 5 existing genera, ~14 species/variants, single-user local

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is an unfilled template — no active gates to evaluate. Proceeding.

## Project Structure

### Documentation (this feature)

```text
specs/009-fish-species-config/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── game/
│   ├── species/                  # NEW: Genus config files
│   │   ├── index.ts              # Registry: loads & exports all genera
│   │   ├── neon-tetra.ts         # Genus: Neon Tetra (3 species)
│   │   ├── corydoras.ts          # Genus: Corydoras (3 species)
│   │   ├── gourami.ts            # Genus: Gourami (2 species)
│   │   ├── otocinclus.ts         # Genus: Otocinclus (1 species)
│   │   └── shrimp.ts             # Genus: Shrimp (1 species)
│   ├── growth.ts                 # NEW: Growth & aging logic
│   ├── maintenance-quality.ts    # NEW: Quality score computation
│   ├── scaling.ts                # NEW: mm ↔ px conversion
│   ├── state.ts                  # MODIFIED: Remove inline FISH_SPECIES, import from species/
│   ├── engine.ts                 # MODIFIED: Hook growth/aging into pomo completion
│   ├── store.ts                  # MODIFIED: Tank downgrade with overflow removal
│   ├── health.ts                 # UNCHANGED (sicknessTick coexists)
│   ├── deterioration.ts          # UNCHANGED
│   └── points.ts                 # UNCHANGED
├── shared/
│   └── types.ts                  # MODIFIED: New types (GenusConfig, SpeciesConfig, SwimLayer, Fish fields)
├── providers/
│   └── tank-panel.ts             # MODIFIED: buildSpriteUriMap reads from species registry
└── webview/
    └── tank-panel/
        ├── components/
        │   ├── Fish.tsx           # MODIFIED: Use mm→px scaling for displaySize
        │   ├── FishTooltip.tsx    # NEW: Tooltip on click/hover
        │   └── Store.tsx          # MODIFIED: Downgrade confirmation dialog
        └── hooks/
            ├── useFishAnimation.ts # MODIFIED: Use SwimLayer enum, dynamic size from growth
            └── useSpriteLoader.ts  # UNCHANGED (works with any URI map)

tests/
├── unit/
│   ├── growth.test.ts            # NEW: Growth curve, aging, plateau
│   ├── maintenance-quality.test.ts # NEW: Quality score blending
│   ├── scaling.test.ts           # NEW: mm↔px conversion
│   ├── species-registry.test.ts  # NEW: Genus/Species loading, inheritance
│   └── migration.test.ts         # NEW: Legacy → new format migration
```

**Structure Decision**: Single project structure (VSCode extension). New `src/game/species/` directory holds one file per Genus. Core game logic modules added for growth, quality, and scaling. No new top-level directories needed.

## Complexity Tracking

No constitution violations to justify.
