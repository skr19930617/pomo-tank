# Implementation Plan: Dead Fish Interaction Improvement

**Branch**: `024-dead-fish-interaction` | **Date**: 2026-03-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/024-dead-fish-interaction/spec.md`

## Summary

Replace click-based fish info display with hover-based tooltip + highlight, add dead fish bottom placement (upside-down + transparent), and enable click-to-remove for dead fish with fade-out animation. All interactive behaviors are gated by `compact === false` so they apply to Tank Panel only.

## Technical Context

**Language/Version**: TypeScript 5.3 (strict mode)
**Primary Dependencies**: React 19, react-konva 19, Konva 10, @mui/material 7, @types/vscode ^1.85.0, esbuild 0.20.0
**Storage**: VSCode ExtensionContext globalState (existing via `src/persistence/storage.ts`)
**Testing**: Vitest 1.2.0 (unit tests in `test/unit/`)
**Target Platform**: VSCode Desktop (macOS/Windows/Linux), mouse-only (FR-012)
**Project Type**: VSCode Extension (desktop-app)
**Performance Goals**: 60fps canvas rendering (existing requestAnimationFrame loop)
**Constraints**: No new npm dependencies
**Scale/Scope**: 1-10 fish per tank, single Tank Panel webview

## Existing Infrastructure (No Changes Needed)

- **`removeFish` message type** in `src/shared/messages.ts` (line 36)
- **`removeFish` handler** in `src/providers/tank-panel.ts` (line 201)
- **`engine.removeFish()`** in `src/game/engine.ts` (line 403)

## Scope: Tank Panel Only (FR-012)

**Problem**: `TankScene.tsx`, `Fish.tsx`, and `useFishAnimation.ts` are shared between Tank Panel (`compact=false`) and Companion View (`compact=true`).

**Strategy**:
- **TankScene.tsx**: All new interactive behaviors (hover state, per-frame re-eval, click-to-remove, cursor, fade ghosts, mode suppression) are gated behind `!compact`. When `compact=true` (companion), none of this code runs.
- **Fish.tsx**: New optional props (`isHovered`, `onMouseEnter`, `onMouseLeave`) default to undefined/false. Companion view passes none of these. The existing `onTap` prop is driven by `onClick` — companion view doesn't pass `onClick`, so tap is already inactive there. No change needed.
- **useFishAnimation.ts**: Dead fish positioning and deathOrder tracking apply to all views (visual-only, no interaction). Dead fish appearing at the bottom upside-down is purely visual and acceptable in companion too.
- **FishBounds**: Extended with `tankFloorY`. Both App.tsx (tank-panel) and companion/App.tsx compute this. Since it's just a coordinate, no behavioral change.

## Constitution Check

Constitution is template-only. No gates to enforce.

## Project Structure

```text
src/
├── webview/tank-panel/
│   ├── components/
│   │   ├── Fish.tsx              # MODIFY: isHovered overlay, onMouseEnter/Leave props, dead scaleY flip
│   │   ├── FishTooltip.tsx       # MODIFY: listening={false} on root Group
│   │   └── TankScene.tsx         # MODIFY: hover state (gated !compact), per-frame re-eval, click→remove, fade ghosts, mode suppression, cursor, Z-sort
│   └── hooks/
│       └── useFishAnimation.ts   # MODIFY: dead fish floor position, deathOrder tracking, FishBounds.tankFloorY
│   ├── App.tsx                   # MODIFY: add tankFloorY to fishBounds
├── webview/companion/
│   └── App.tsx                   # MODIFY: add tankFloorY to fishBounds
```

## Design Decisions

### D1: Hover Detection — Dual Mechanism

**Primary (mouse movement)**: Add optional `onMouseEnter`/`onMouseLeave` props to Fish.tsx's outer `<Group>`. TankScene passes these when `!compact`. On enter: set `hoveredFishId`. On leave: clear it.

**Secondary (cursor stationary, FR-014)**: In TankScene, when `!compact`, use a `useEffect` watching `frameCount`. Each frame: call `stageRef.current?.getPointerPosition()`, convert to logical coords, iterate rendered fish (topmost-first based on Z-sort, excluding `removingIds`) to find which fish's bounding box contains the point. Update `hoveredFishId`. This handles the case where the cursor is still but fish move.

### D2: Highlight Effect — White Rect Overlay

Render a `<Rect fill="white" opacity={0.25} width={displaySize} height={displaySize} listening={false} />` on top of the sprite when `isHovered=true`. No `cache()` needed, animation-safe.

### D3: Dead Fish Positioning — Center-Based Coordinates

Fish position `(x, y)` represents the **center** of the fish sprite. The outer Group renders at `(x, y)` with inner Group offset by `halfSize` for centering.

**Dead fish floor Y**: `tankFloorY - displaySize / 2` (center is half the fish height above the floor, so bottom edge touches floor).

**X clamp**: Clamp to `[b.left + halfSize, b.left + b.width - halfSize]` to keep sprite within tank.

**FishBounds extension**: Add `tankFloorY: number` to FishBounds interface. In App.tsx: `tankFloorY = frame + innerH` (= actual floor Y in tank-local coords, below swim zone and sand area). In companion App.tsx: same formula.

**scaleY flip**: In Fish.tsx, when `isDead`: inner Group uses `scaleY={-scale}` (no Y offset needed since the outer Group position is center-based and offsetY centers correctly regardless of flip direction).

**Death order**: `deathOrder: number` in FishAnimState + AnimatedFishData. Counter increments on first Dead transition.

### D4: Click-to-Remove — Fade Ghost Array with removingIds

**State**:
- `removingIds: Set<string>` — IDs of fish being removed (immediate local disable)
- `fadingGhosts: Map<string, { x: number; y: number; displaySize: number; genusId: GenusId; speciesId: string; startTime: number }>` — multiple concurrent fade-outs supported

**Flow**:
1. Click dead fish → add to `removingIds` → save ghost in `fadingGhosts` → `sendMessage(removeFish)`
2. Render each ghost as `<Group listening={false}>` with opacity decreasing over 300ms
3. After 300ms: remove from `fadingGhosts` and `removingIds`

Using a Map keyed by fish ID supports clicking multiple dead fish in quick succession.

### D5: Mode Suppression

```typescript
const isAnyModeActive =
  feedingMode.phase === 'targeting' ||
  waterChangeMode.phase === 'ready' ||
  mossCleaningMode.phase === 'active';
```
useEffect clears `hoveredFishId` when `isAnyModeActive` becomes true.

### D6: Tooltip Pointer-Events

`listening={false}` on FishTooltip.tsx root `<Group>` (FR-016).

## Data Flow

```
Mouse moves       → Fish onMouseEnter → setHoveredFishId(id) [!compact only]
Cursor stationary → per-frame check → update hoveredFishId [!compact only]
Fish swims away   → per-frame check → hoveredFishId cleared
Mode activates    → useEffect → hoveredFishId cleared
Click dead fish   → removingIds.add → fadingGhosts.set → sendMessage(removeFish)
Ghost fading      → listening={false} → per-frame check ignores ghost → retargets below
300ms elapsed     → fadingGhosts.delete → removingIds.delete
```
