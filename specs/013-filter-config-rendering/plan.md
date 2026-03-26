# Implementation Plan: Filter Config & Pixel-Art Rendering

**Branch**: `013-filter-config-rendering` | **Date**: 2026-03-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/013-filter-config-rendering/spec.md`

## Summary

Extract filter definitions from the hardcoded catalog in `state.ts` into a dedicated config module (following the species config pattern), add visual properties (mount type, size, color) to each filter, and render pixel-art filter graphics in the tank scene using Konva primitives. Internal sponge renders inside the water, hang-on-back straddles the tank rim, canisters sit on the desk beside the tank. Visual size and color scale by tier.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**: React 19, react-konva 19, Konva 10, @mui/material, @emotion/react
**Storage**: VSCode ExtensionContext globalState (existing, unchanged)
**Testing**: Vitest (unit tests), manual visual testing
**Target Platform**: VSCode Extension webview (browser IIFE bundle), VSCode ^1.85.0
**Project Type**: VSCode extension with React/Konva webview
**Performance Goals**: 60fps canvas rendering (filter is static geometry, negligible cost)
**Constraints**: Filter rendering must work within the existing Konva Group coordinate system, scaled by contentScale
**Scale/Scope**: 1 new config module, 1 new Konva component, ~5 files modified

## Constitution Check

No constitution principles defined. Gate passes by default.

## Project Structure

### Documentation (this feature)

```text
specs/013-filter-config-rendering/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── shared/
│   └── types.ts                     # MODIFY: add FilterMountType enum, update FilterId if needed
├── game/
│   ├── state.ts                     # MODIFY: remove FILTERS/FilterData, import from filters module
│   ├── store.ts                     # MODIFY: import filter data from new module
│   ├── filters/                     # NEW: filter config module
│   │   ├── index.ts                 # Registry: FILTER_REGISTRY, getAllFilters(), getFilter(), buildFilterStoreItems()
│   │   ├── basic-sponge.ts          # FilterConfig for basic_sponge
│   │   ├── hang-on-back.ts          # FilterConfig for hang_on_back
│   │   ├── canister.ts              # FilterConfig for canister
│   │   └── premium-canister.ts      # FilterConfig for premium_canister
│   └── species/                     # UNCHANGED (reference pattern)
├── webview/
│   └── tank-panel/
│       └── components/
│           ├── TankScene.tsx         # MODIFY: pass filterId to Tank, add Filter component
│           ├── Tank.tsx              # MODIFY: accept filterId prop, render internal filter (sponge)
│           └── Filter.tsx            # NEW: Konva component rendering external filters (HOB, canister)
└── tests/                           # (if tests exist)
```

**Structure Decision**: New `src/game/filters/` directory mirrors the existing `src/game/species/` pattern. One file per filter type, plus an index with registry and store item builder. The rendering splits into: internal filters rendered inside Tank.tsx, external filters rendered as a sibling component Filter.tsx in the tank Group.

## Complexity Tracking

No constitution violations to justify.
