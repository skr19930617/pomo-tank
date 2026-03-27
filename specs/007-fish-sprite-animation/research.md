# Research: Fish Sprite Animation System

## R1: Sprite Loading in VSCode Webview

**Decision**: Generate URI map on extension side, pass to webview via state message, preload as `HTMLImageElement` objects.

**Rationale**: VSCode webview has no file system access. Assets must use `webview.asWebviewUri()` which only works in the extension host. The existing pattern in `tank-panel.ts` already uses `asWebviewUri` for CSS/JS. Extending this to sprite sheets is consistent.

**Alternatives considered**:
- Base64 inline: Too large for 23 sprite sheets (~384x128 each). Would bloat state messages.
- Dynamic fetch from extension: Would require a custom message protocol for each image load. Overly complex.
- Bundle sprites into JS: esbuild doesn't support image imports without plugins. Adding a plugin is unnecessary complexity.

## R2: Konva Sprite Sheet Rendering

**Decision**: Use Konva `Sprite` component with animation definitions for each state (swim, weak, feeding).

**Rationale**: Konva's `Sprite` component is purpose-built for sprite sheet animation. It accepts an `animations` prop defining named frame sequences as flat arrays of `[x, y, width, height, ...]` and an `animation` prop to switch between them. It handles frame advancement internally via `frameRate` and `start()`/`stop()`. This is cleaner than manual `Image` + `crop` and integrates naturally with react-konva.

**Configuration**:
- `image`: preloaded HTMLImageElement
- `animations`: `{ swim: [0,0,64,64, 64,0,64,64, ...], weak: [...], feeding: [...] }`
- `animation`: current state name ('swim', 'weak', 'feeding')
- `frameRate`: 8 (FPS)
- Frame array: 12 entries of [x, y, 64, 64] for 6x2 grid

**Alternatives considered**:
- Konva `Image` + `crop`: Manual frame management, more code, no built-in frame rate control.
- Raw canvas `drawImage`: Would bypass react-konva, losing declarative rendering benefits.

## R3: Animation Frame Timing at 8 FPS

**Decision**: Use the existing `frameCount` from `requestAnimationFrame` loop (~60 FPS) and derive sprite frame as `Math.floor(frameCount / 7.5) % 12`.

**Rationale**: The `useFishAnimation` hook already increments `frameCount` every rAF tick. Dividing by ~7.5 (60/8) gives 8 FPS sprite advancement. No separate timer needed.

**Alternatives considered**:
- `setInterval(125ms)`: Extra timer, potential drift, harder to sync with movement.
- Per-fish frame counters: Unnecessary complexity; all fish sharing a global frame counter with per-fish offset is simpler.

## R4: Species Roster Migration Strategy

**Decision**: Map legacy species to new equivalents. guppy → neon_tetra (standard), betta → gourami (dwarf), angelfish → gourami (cobalt_blue_dwarf).

**Rationale**: Users with existing save data shouldn't lose their fish. Mapping to visually similar species preserves the experience. The migration runs once on state load when legacy speciesId is detected.

**Alternatives considered**:
- Delete legacy fish: Destructive, poor UX.
- Keep legacy species with procedural rendering: Inconsistent visual experience, increases code complexity.

## R5: Horizontal Flip for Direction

**Decision**: Use Konva `scaleX: -1` with offset adjustment, same as current implementation.

**Rationale**: Current `Fish.tsx` already flips via `scaleX` based on `dx < 0`. This works identically with `Image` component. The flip pivot is the fish center.

## R6: Otocinclus "weak_side" Naming

**Decision**: Treat `weak_side_64x64_6x2_12f.png` as the standard weak sprite for otocinclus. Load it as the `weak` animation state.

**Rationale**: The "_side" suffix likely indicates a side-view variant of the weak animation. Since all other sprites are side-view, this is functionally equivalent to a standard weak sprite. Rename to `weak_64x64_6x2_12f.png` during directory reorganization for consistency.

## R7: Feeding Animation Trigger

**Decision**: On `feedFish` action, set a per-fish `feedingUntil` timestamp. Fish plays feeding animation for 1.5 seconds (one full loop), then reverts to current state.

**Rationale**: 1.5 seconds = exactly one 12-frame loop at 8 FPS. Clean visual loop. The trigger comes from `useGameState` receiving `actionResult` for feed, which sets the feeding flag on all living fish.

**Alternatives considered**:
- Feed only specific fish: No targeting mechanism exists; all fish feed simultaneously.
- Longer duration: Multiple loops look repetitive; one loop is sufficient feedback.
