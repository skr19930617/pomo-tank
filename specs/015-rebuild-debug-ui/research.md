# Research: Rebuild Debug UI

## R-001: Dynamic Tick Interval Implementation

**Decision**: Stop and restart `setInterval` when multiplier changes. New interval = `60_000 / multiplier`.

**Rationale**: The current `engine.start()` uses `setInterval(() => this.tick(), 60_000)`. To change tick speed dynamically, we must clear the existing interval and create a new one with the adjusted period. This is simpler and more reliable than calling `tick()` N times in a loop (which was the broken x10tick approach — it applied 10 ticks synchronously without updating the interval display, causing the UI timer to not reflect the acceleration).

**Alternatives considered**:
- **Batch tick() calls** (current x10tick approach): Rejected — applies ticks synchronously without letting the UI update between ticks. Timer display shows no change. Deterioration jumps happen all at once, making it impossible to observe gradual state changes.
- **requestAnimationFrame-based tick scheduling**: Rejected — over-engineered for debug tooling; `setInterval` with adjusted period is sufficient.

## R-002: Tick Multiplier State Location

**Decision**: Store `tickMultiplier` as a property on `GameEngine`, not in `GameState`.

**Rationale**: The multiplier is a debug-only transient value that should not be persisted or included in game saves. It defaults to 1 and resets when the extension reloads or debug mode is disabled. Keeping it on the engine instance avoids polluting the persisted state.

**Alternatives considered**:
- **Store in GameState**: Rejected — would persist across sessions, could accidentally speed up a normal user's game if debug mode was previously enabled.
- **Store in VSCode configuration**: Rejected — over-heavy for a transient runtime value.

## R-003: Message Protocol Extension

**Decision**: Add `debugSetTickMultiplier` message type to `WebviewToExtensionMessage` union.

**Rationale**: Follows existing pattern of `debugSetPomo` and `debugResetState`. The discriminated union in `messages.ts` is the established contract. Adding one new variant is minimal and type-safe.

**Alternatives considered**:
- **Reuse `updateSettings` message**: Rejected — tick multiplier is not a user setting; it's debug-only transient state.

## R-004: x10tick Failure Root Cause

**Decision**: The legacy `debugTick` command calls `engine.tick()` 10 times synchronously. This applies deterioration correctly but does not advance the timer display (which is client-side interpolation based on real elapsed wall-clock time via `Date.now()` - `lastMaintenanceTimestamp`). The result: tank state jumps but the focus timer shows no change, creating the appearance that "nothing happened."

**Rationale**: The fix is not to batch ticks but to actually change the tick frequency, so both deterioration AND timer display advance proportionally.

## R-005: GameStateSnapshot Extension for Multiplier

**Decision**: Add `tickMultiplier: number` to `GameStateSnapshot` so the webview can display the current multiplier value and keep the debug UI in sync.

**Rationale**: The webview needs to know the current multiplier to pre-populate the input field and display the active speed. Following the existing pattern where `debugMode` is already included in the snapshot.

## R-006: Multiplier Range and Input

**Decision**: Accept integer values 1–100. Clamp out-of-range inputs. UI provides a numeric input field with preset buttons (1x, 5x, 10x, 50x) for quick access.

**Rationale**: 100x makes 1 minute tick happen every 0.6 seconds, which is fast enough to simulate 25 minutes in ~15 seconds. Values above 100x would create sub-100ms intervals that risk overwhelming the extension host with state updates.
