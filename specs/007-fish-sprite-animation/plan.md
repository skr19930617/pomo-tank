# Implementation Plan: Fish Sprite Animation System

**Branch**: `007-fish-sprite-animation` | **Date**: 2026-03-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-fish-sprite-animation/spec.md`

## Summary

Replace procedural rectangle fish rendering with sprite sheet animation system. Reorganize sprite files into `{species}/{variant}/` directories. Add per-species behavior config (swim zone, speed, size). Update game roster: remove guppy/betta/angelfish, add gourami/otocinclus/shrimp. Implement swim/weak/feeding animation states with health-based transitions.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**: React 18, react-konva, konva, @types/vscode ^1.85.0, esbuild ^0.20.0
**Storage**: VSCode ExtensionContext globalState (existing)
**Testing**: Manual visual testing (no test framework currently configured)
**Target Platform**: VSCode Extension webview (Chromium-based)
**Project Type**: VSCode Extension (desktop-app)
**Performance Goals**: 8 FPS sprite animation, 60 FPS requestAnimationFrame loop
**Constraints**: Webview CSP restrictions, assets loaded via `webview.asWebviewUri()`, no dynamic file system access from webview
**Scale/Scope**: 5 species, ~11 variants, ~23 sprite sheets

## Constitution Check

*GATE: No constitution defined (template only). No gates to evaluate.*

## Project Structure

### Documentation (this feature)

```text
specs/007-fish-sprite-animation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── shared/
│   └── types.ts                    # Fish, FishSpeciesId, variant types, species config
├── game/
│   ├── state.ts                    # FISH_SPECIES registry with behavior config, variant catalog
│   ├── store.ts                    # Updated purchase logic with variant assignment
│   ├── engine.ts                   # Game loop (unchanged)
│   ├── deterioration.ts            # Tank-wide deterioration (unchanged)
│   ├── health.ts                   # Health state transitions (unchanged)
│   └── points.ts                   # Pomo earning (unchanged)
├── providers/
│   └── tank-panel.ts               # Pass sprite URIs to webview
├── webview/tank-panel/
│   ├── components/
│   │   ├── Fish.tsx                # Replace procedural → sprite sheet rendering
│   │   ├── TankScene.tsx           # Pass sprite URIs and feed state to Fish
│   │   ├── HudOverlay.tsx          # Unchanged
│   │   ├── Store.tsx               # Updated species catalog display
│   │   └── sprite-sheet-utils.ts   # NEW: frame calculation, image loading helpers
│   └── hooks/
│       ├── useFishAnimation.ts     # Add swim zone constraints, per-species speed
│       ├── useSpriteLoader.ts      # NEW: preload sprite sheet images
│       └── useGameState.ts         # Handle feedFish animation trigger
media/
└── sprites/fish/
    ├── corydoras/{variant}/        # Reorganized from flat
    ├── gourami/{variant}/
    ├── neon_tetra/{variant}/
    ├── otocinclus/{variant}/
    └── shrimp/{variant}/
```

**Structure Decision**: Extends existing VSCode extension layout. New files are `sprite-sheet-utils.ts` (frame math) and `useSpriteLoader.ts` (image preloading). Species behavior config consolidated into `state.ts` alongside existing `FISH_SPECIES` registry.

## Key Technical Decisions

### 1. Sprite Loading in Webview

The VSCode webview cannot access the file system directly. Sprite sheet URIs must be:
1. Converted to webview URIs in `tank-panel.ts` using `webview.asWebviewUri()`
2. Passed to the webview via the initial HTML or state message
3. Loaded as `Image` objects in the webview and drawn via Konva `Image` component

**Approach**: Extension generates a sprite URI map `Record<speciesId, Record<variantId, Record<animState, string>>>` and sends it in the `stateUpdate` message. The webview preloads all images on first render.

### 2. Konva Sprite Component

Use Konva's built-in `Sprite` component instead of `Image` + manual crop. Each sprite sheet (384x128, 6 cols x 2 rows, 64x64 each) is defined as animation frame arrays:

```
animations: {
  swim: [0,0,64,64, 64,0,64,64, 128,0,64,64, ... (12 frames)],
  weak: [...],
  feeding: [...]
}
```

- `animation` prop switches between states ('swim', 'weak', 'feeding')
- `frameRate: 8` handles 8 FPS internally
- `start()` / `stop()` controls playback (stop for dead fish frozen on last frame)
- No manual frame counter needed for sprite animation

### 3. Species Roster Migration

Remove: guppy, betta, angelfish (no sprites)
Add: gourami, otocinclus, shrimp (have sprites)
Keep: neon_tetra, corydoras

State migration: Fish with removed speciesId → map to nearest equivalent or mark as legacy.

### 4. Variant Assignment

On fish purchase, randomly select a variant from the species' available variants. Store `variantId` on the `Fish` object. Persisted in globalState.

### 5. Per-Species Behavior Config

Consolidated in `FISH_SPECIES` registry in `state.ts`:

| Species    | Swim Zone (% height) | Speed Mult | Size Range (px) | Variants |
|------------|----------------------|------------|-----------------|----------|
| neon_tetra | 20-70% (mid)         | 1.2        | 16-22           | standard, albino, green |
| corydoras  | 65-95% (bottom)      | 0.8        | 18-24           | albino, panda, sterbai |
| gourami    | 15-55% (upper-mid)   | 0.7        | 22-30           | dwarf, cobalt_blue_dwarf |
| otocinclus | 60-90% (bottom)      | 0.9        | 14-18           | standard |
| shrimp     | 70-95% (bottom)      | 0.6        | 12-16           | amano |

### 6. Dead Fish Rendering

Dead fish: weak sprite frozen on frame 11 (last), opacity 0.4, stationary. No auto-removal.
