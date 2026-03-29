# Tasks: Dead Fish Interaction Improvement

**Input**: Design documents from `/specs/024-dead-fish-interaction/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

**Note**: `removeFish` message, handler, and engine method already exist. No foundational phase needed.

---

## Phase 1: User Story 1 — ホバーで魚の情報を表示 (Priority: P1) 🎯 MVP

**Goal**: Replace click-based fish tooltip with hover-based tooltip. Per-frame hover re-evaluation for stationary cursor. Tank Panel only (gated by `!compact`).

**Independent Test**: Hover any fish → tooltip appears. Leave → disappears. Keep cursor still, fish swims away → disappears. Fish enters cursor → appears.

### Implementation for User Story 1

- [x] T001 [US1] Add optional `onMouseEnter`/`onMouseLeave` props to `src/webview/tank-panel/components/Fish.tsx` — add `onMouseEnter?: () => void` and `onMouseLeave?: () => void` to FishProps. Wire them onto the outer `<Group>` element (line 112) alongside existing `onClick`/`onTap`. When props are undefined (companion view), no handlers are attached
- [x] T002 [US1] Add `hoveredFishId` state, `removingIds` state, and `isAnyModeActive` to `src/webview/tank-panel/components/TankScene.tsx` — replace `selectedFishId` with `hoveredFishId: string | null`. Add `removingIds: Set<string>` state (for US4). Compute `isAnyModeActive = feedingMode.phase === 'targeting' || waterChangeMode.phase === 'ready' || mossCleaningMode.phase === 'active'`. All gated behind `!compact`
- [x] T003 [US1] Pass hover handlers from TankScene to Fish in `src/webview/tank-panel/components/TankScene.tsx` — when `!compact`: pass `onMouseEnter={() => { if (!isAnyModeActive && !removingIds.has(f.id)) setHoveredFishId(f.id) }}` and `onMouseLeave={() => setHoveredFishId(null)}` to each FishSprite. When `compact`: pass no hover handlers (companion unaffected)
- [x] T004 [US1] Add per-frame hover re-evaluation in `src/webview/tank-panel/components/TankScene.tsx` — when `!compact`, add useEffect watching `frameCount`: call `stageRef.current?.getPointerPosition()` to get cursor pos in stage pixels, divide by `layerScale` to get logical coords, subtract tank offset to get tank-local coords. Iterate rendered fish (Z-sorted topmost-first, excluding removingIds) checking if cursor is within `(fishX ± displaySize/2, fishY ± displaySize/2)`. Set hoveredFishId to topmost match or null. Skip when `isAnyModeActive`. This handles FR-014 (cursor stationary, fish moves)
- [x] T005 [US1] Update FishTooltip rendering in `src/webview/tank-panel/components/TankScene.tsx` — show tooltip when `hoveredFishId` is set (instead of `selectedFishId`). Use hovered fish's animated coordinates for positioning. Gate behind `!compact`
- [x] T006 [US1] Set `listening={false}` on FishTooltip root Group in `src/webview/tank-panel/components/FishTooltip.tsx` — add `listening={false}` to the outermost `<Group>` (FR-016, prevents tooltip from intercepting hover events)
- [x] T007 [US1] Add mode suppression useEffect in `src/webview/tank-panel/components/TankScene.tsx` — watch `isAnyModeActive`: when true, set `hoveredFishId` to null (FR-010, immediate clear of tooltip/highlight/cursor)
- [x] T008 [US1] Remove old click-to-select logic in `src/webview/tank-panel/components/TankScene.tsx` — remove `selectedFishId` state and onClick toggle. Alive fish click becomes no-op (FR-009/FR-011). Keep Fish Group `onClick` prop for US4 dead-fish click (gated to dead-only)

**Checkpoint**: Hover tooltip with per-frame re-evaluation works. Click no longer shows tooltip. Companion view unchanged.

---

## Phase 2: User Story 2 — ホバー中の魚のハイライト表示 (Priority: P1)

**Goal**: Hovered fish highlighted with white overlay. Animation-safe (no cache).

**Independent Test**: Hover any fish → fish brightens. Leave → normal. Sprite animation continues during highlight.

### Implementation for User Story 2

- [x] T009 [US2] Add `isHovered` prop and white Rect overlay to `src/webview/tank-panel/components/Fish.tsx` — add `isHovered?: boolean` to FishProps (default false). When true, render `<Rect fill="white" opacity={0.25} width={displaySize} height={displaySize} listening={false} />` inside the inner Group, on top of the Sprite. No cache() needed. Companion view passes no isHovered, so unaffected
- [x] T010 [US2] Pass `isHovered` from TankScene to Fish in `src/webview/tank-panel/components/TankScene.tsx` — when `!compact`: set `isHovered={hoveredFishId === f.id}`. When `compact`: omit prop (companion unaffected)

**Checkpoint**: Highlight works without breaking sprite animation. Companion view unaffected.

---

## Phase 3: User Story 3 — 死んだ魚の底への沈降表示 (Priority: P2)

**Goal**: Dead fish at tank floor, upside-down, semi-transparent, behind live fish.

**Independent Test**: Fish dies → immediately at floor level, belly up, behind alive fish.

### Implementation for User Story 3

- [x] T011 [P] [US3] Extend `FishBounds` with `tankFloorY` in `src/webview/tank-panel/hooks/useFishAnimation.ts` — add `tankFloorY: number` to FishBounds interface (Y coordinate of actual tank floor in tank-local coords)
- [x] T012 [P] [US3] Set `tankFloorY` in tank-panel `src/webview/tank-panel/App.tsx` — in fishBounds computation, add `tankFloorY: frame + innerH` (actual floor below swim zone and sand)
- [x] T013 [P] [US3] Set `tankFloorY` in companion `src/webview/companion/App.tsx` — same formula as tank-panel App.tsx to keep FishBounds compatible
- [x] T014 [US3] Add `deathOrder` to `FishAnimState` and `AnimatedFishData` in `src/webview/tank-panel/hooks/useFishAnimation.ts` — add `deathOrder: number` (default 0) to both interfaces. Add `deathCounterRef = useRef(0)`. When a fish's healthState first becomes Dead (was not Dead before in FishAnimState), assign `deathOrder = ++deathCounterRef.current`
- [x] T015 [US3] Override dead fish position in `src/webview/tank-panel/hooks/useFishAnimation.ts` — when `healthState === HealthState.Dead`: set `s.y = boundsRef.current.tankFloorY - displaySize / 2` (center-based: bottom edge touches floor), clamp `s.x` to `[b.left + halfSize, b.left + b.width - halfSize]`, set `s.dx = 0`, `s.dy = 0`. Skip all movement/schooling/food-attraction logic for dead fish
- [x] T016 [US3] Add vertical flip for dead fish in `src/webview/tank-panel/components/Fish.tsx` — when `isDead` (derived from healthState prop): set inner Group's `scaleY={-scale}` (negative of normal scale). The outer Group is center-positioned with offsetX/offsetY centering, so no Y offset needed — the flip mirrors around the center point correctly
- [x] T017 [US3] Sort fish rendering order in `src/webview/tank-panel/components/TankScene.tsx` — before mapping fish to JSX, sort: dead fish first (back), alive fish second (front, FR-005a). Among dead fish, sort by `deathOrder` ascending (older=back, newer=front). Gate sort behind `!compact` (companion renders unsorted)
- [x] T018 [US3] Verify dead fish opacity 0.4 preserved in `src/webview/tank-panel/components/Fish.tsx` — confirm existing `opacity={isDead ? 0.4 : ...}` works with new scaleY flip

**Checkpoint**: Dead fish at floor, flipped, transparent, correctly Z-ordered. Both views updated for FishBounds.

---

## Phase 4: User Story 4 — 死んだ魚をクリックで取り除く (Priority: P2)

**Goal**: Click dead fish → immediate data deletion + 300ms fade ghost. Pointer cursor. Multiple concurrent fades supported.

**Independent Test**: Hover dead fish → pointer cursor. Click → fade-out 300ms. Click second dead fish during first fade → both fade independently. After fade, gone from tank + FishManager + persistence.

### Implementation for User Story 4

- [x] T019 [US4] Add pointer cursor for dead fish hover in `src/webview/tank-panel/components/TankScene.tsx` — in cursor useEffect (line ~158-173): when `!compact && hoveredFishId` points to a Dead fish and `!isAnyModeActive`, set cursor to `'pointer'`. Mode cursors (sponge/crosshair/water-change) take priority. Reset to default otherwise
- [x] T020 [US4] Add `fadingGhosts` Map state and click-to-remove handler in `src/webview/tank-panel/components/TankScene.tsx` — add `fadingGhosts: Map<string, { x: number; y: number; displaySize: number; genusId: GenusId; speciesId: string; startTime: number }>` state. On Fish Group click (passed via `onClick` prop): if `!compact && fish.healthState === 'Dead' && !isAnyModeActive`, (1) add fish.id to `removingIds`, (2) save ghost snapshot with `startTime = performance.now()`, (3) `sendMessage({ type: 'removeFish', fishId: f.id })`. Alive fish click = no-op (FR-009)
- [x] T021 [US4] Render fade-out ghosts in `src/webview/tank-panel/components/TankScene.tsx` — for each entry in `fadingGhosts`, render `<Group listening={false} x={ghost.x} y={ghost.y}>` containing a FishSprite (or minimal Sprite) with ghost species data, `scaleY={-scale}`, opacity = `0.4 × (1 - elapsed/300)`. Use useEffect with requestAnimationFrame or interval to update opacity each frame and remove entries where elapsed > 300ms (also remove from `removingIds`). `listening={false}` from frame 0 ensures FR-015
- [x] T022 [US4] Verify companion view and touch are unaffected — confirm: companion view passes no `onClick` to Fish (so click does nothing). Fish.tsx `onTap` is wired to `onClick` which is undefined in companion → no tap action. No new touch handlers introduced (FR-012)

**Checkpoint**: Dead fish removable with concurrent fade ghosts. Companion and touch unaffected.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T023 Verify all 3 mode suppressions in `src/webview/tank-panel/components/TankScene.tsx` — test each mode: hover/highlight/cursor/remove all disabled, hoveredFishId clears on mode start, cursor resets
- [x] T024 Run `npm run ci` — lint, format check, unit tests, build must all pass
- [x] T025 Manual integration test — all 4 user stories end-to-end: hover with per-frame re-eval, highlight overlay, dead fish floor placement with Z-ordering, click removal with concurrent fade ghosts, companion view unchanged

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (US1)**: No dependencies — start immediately
- **Phase 2 (US2)**: Depends on Phase 1 (needs isHovered from hover system)
- **Phase 3 (US3)**: T011-T016 (useFishAnimation.ts, App.tsx, Fish.tsx) independent of Phase 1. T017 (TankScene Z-sort) depends on Phase 1 (same file)
- **Phase 4 (US4)**: Depends on Phase 1 (hover state, removingIds) + Phase 3 (dead fish positioning)
- **Phase 5 (Polish)**: Depends on all

### Parallel Opportunities

- T011, T012, T013 can all run in parallel (different files)
- T011-T016 (US3 non-TankScene) can start in parallel with Phase 1
- T017 must wait for Phase 1 to merge TankScene changes

---

## Implementation Strategy

### Recommended Order

1. Phase 1 (US1) → Hover tooltip MVP
2. Phase 2 (US2) → Highlight
3. Phase 3 (US3) → Dead fish placement (T017 after Phase 1)
4. Phase 4 (US4) → Click removal with fade ghosts
5. Phase 5 → CI and integration test

---

## Notes

- Files modified: Fish.tsx, FishTooltip.tsx, TankScene.tsx, useFishAnimation.ts, App.tsx (tank-panel), App.tsx (companion)
- No new npm dependencies, no new message types
- Highlight uses white Rect overlay (animation-safe, no cache)
- Per-frame hover uses getPointerPosition() + bounding box
- Fade ghosts stored in Map for concurrent removals
- All interactive behaviors gated by `!compact`
- Total: 25 tasks across 5 phases
