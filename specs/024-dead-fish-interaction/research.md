# Research: Dead Fish Interaction

## R1: Konva Brighten Filter for Sprite Highlight

**Decision**: Use Konva's built-in `Brighten` filter via `filters={[Konva.Filters.Brighten]}` and `brightness` prop.

**Rationale**: Konva provides `Brighten` as a native image filter that works on any node with an image cache. For `Sprite` components, we need to call `cache()` after mounting to enable filtering. Setting `brightness(0.3)` gives a visible but subtle highlight. Setting `brightness(0)` restores the original appearance.

**Alternatives considered**:
- CSS filter on canvas element — not applicable (single canvas, would affect everything)
- Manual pixel manipulation — too complex, not needed
- Shadow/glow effect via Konva `shadowColor`/`shadowBlur` — heavier rendering, less precise highlight

**Implementation notes**:
- Import `Konva` from 'konva' for `Konva.Filters.Brighten`
- On the `<Sprite>` node: `filters={isHovered ? [Konva.Filters.Brighten] : []}`, `brightness={isHovered ? 0.3 : 0}`
- Must call `spriteRef.current.cache()` after image loads and on hover state change for filter to apply
- Performance: cache() is the main cost, but with 1-10 fish it's negligible

## R2: Konva scaleY for Upside-Down Dead Fish

**Decision**: Use `scaleY={-1}` on the fish `<Group>` to flip vertically, with adjusted `y` offset to maintain correct anchor point.

**Rationale**: Konva's transform system supports negative scale values. `scaleY={-1}` mirrors the sprite vertically around its origin point. Since the origin is top-left by default, flipping requires adjusting the Y position by adding the sprite height to keep the fish visually in the same location (bottom of tank).

**Alternatives considered**:
- `rotation={180}` — flips both axes, would also reverse horizontal direction
- New "dead" sprite frames — requires artist work, unnecessary when flip achieves the goal

**Implementation notes**:
- The existing `scaleX` is used for horizontal direction (left/right facing). `scaleY` is independent.
- Dead fish: `scaleY={-scale}` (where `scale` is the size multiplier), keeps proportional sizing while flipping
- Existing opacity 0.4 for dead fish is already in Fish.tsx (line ~84)

## R3: Fish Removal Message Flow

**Decision**: Add `REMOVE_FISH` to the `WebviewToExtensionMessage` union type, handled by `engine.removeFish(id)`.

**Rationale**: Existing message pattern: webview sends typed messages via `vscode.postMessage()`, extension handles in `onDidReceiveMessage`. Actions like `feedFish`, `startWaterChange`, `cleanAlgae` follow this pattern. Adding `removeFish` is consistent.

**Alternatives considered**:
- Direct state mutation in webview — breaks the extension-as-authority pattern
- Separate API endpoint — over-engineered for a single action

**Implementation notes**:
- Message type: `{ type: 'removeFish'; fishId: string }`
- Engine action: filter `state.fish` to remove matching ID, then save
- Webview receives updated snapshot via existing `GAME_STATE_UPDATE` message flow
- Fade-out animation is webview-local (not persisted)

## R4: Continuous Hover Re-evaluation

**Decision**: Leverage Konva's built-in `onMouseEnter`/`onMouseLeave` on each fish Group, supplemented by checking `hoveredFishId` validity in the animation loop.

**Rationale**: Konva fires `mouseenter`/`mouseleave` events on nodes even when the cursor is stationary and the node moves (because Konva re-evaluates hit regions on each render). This means FR-014 (continuous re-evaluation) is largely handled by Konva itself. However, as an additional safety measure, the animation loop can verify that the hovered fish still overlaps the cursor position and clear the hover state if not.

**Alternatives considered**:
- Manual hit-testing every frame — redundant with Konva's built-in behavior
- Polling mousemove — unnecessary overhead

**Implementation notes**:
- Konva's Stage internally tracks the last mouse position
- When fish nodes move (via position props), Konva fires synthetic mouseenter/mouseleave
- This naturally handles: fish swimming away, fish swimming in, death repositioning

## R5: Fade-Out Animation for Dead Fish Removal

**Decision**: Use a local React state `fadingFishId` with CSS-like opacity transition via `useEffect` + `setTimeout`.

**Rationale**: When a dead fish is clicked, set `fadingFishId = fishId` and start a 300ms timer. During this period, the fish renders with rapidly decreasing opacity (0.4 → 0). After 300ms, remove from render. Data is already deleted at click time (FR-017), so this is purely visual.

**Alternatives considered**:
- Konva Tween — more complex API, requires manual cleanup
- requestAnimationFrame-based animation — overkill for a simple opacity fade
- No animation (instant removal) — user wanted fade-out per clarification

**Implementation notes**:
- Track `fadingFishId: string | null` and `fadeStartTime: number` in TankScene state
- In render: if fish.id === fadingFishId, compute opacity = 0.4 * (1 - elapsed/300)
- After 300ms, set fadingFishId = null
- Fading fish has `listening={false}` on its Group (hit-test disabled per FR-015)
