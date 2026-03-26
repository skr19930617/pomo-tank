# Research: Tank & Fish Management Settings

**Feature**: 014-tank-fish-management
**Date**: 2026-03-26

## R1: Snapshot Extension — unlockedItems

**Decision**: Add `player.unlockedItems: string[]` to `GameStateSnapshot` so the webview can determine which tanks and filters are available for switching.

**Rationale**:
- Currently `unlockedItems` is only in the internal `GameState.player` — NOT sent to the webview.
- The webview needs this to render the tank/filter selection lists.
- Alternative approach (sending a pre-computed "available tanks/filters" list) was considered but adds complexity. Sending the raw `unlockedItems` is simpler and the webview can derive what it needs.

**Alternatives considered**:
- Compute available options in the engine and add to snapshot (rejected: more fields, more logic in engine for a UI concern)
- Add a separate message type for availability (rejected: unnecessarily complex; snapshot is already the state sync mechanism)

## R2: Fish customName — Data Model Extension

**Decision**: Add `customName?: string` to the `Fish` interface in `GameState` and include it in the snapshot's fish array.

**Rationale**:
- The `Fish` interface in `state.ts` needs the field for persistence (survives restart).
- The snapshot's fish array (which omits `sicknessTick` and `purchasedAt`) needs to include `customName` so the webview can display it.
- The field is optional — existing persisted data without it is treated as `undefined` (no custom name). Fully backward compatible.
- Max length: 20 characters, validated engine-side.

## R3: Management Message Types

**Decision**: Add 4 new webview→extension message types and 1 new extension→webview result type.

**New Webview → Extension messages**:
| Message | Fields | Engine Method |
|---------|--------|--------------|
| `switchTank` | `sizeTier: TankSizeTier` | `switchTank(tier)` |
| `switchFilter` | `filterId: FilterId` | `switchFilter(id)` |
| `renameFish` | `fishId: string, customName: string` | `renameFish(id, name)` |
| `removeFish` | `fishId: string` | `removeFish(id)` |

**New Extension → Webview message**:
| Message | Fields | Purpose |
|---------|--------|---------|
| `managementResult` | `action: string, success: boolean, message?: string` | Result of tank/filter/fish management actions |

**Rationale**: Follows the same pattern as existing `actionResult` and `purchaseResult` messages. Each management action has a corresponding engine method that validates and applies the change.

## R4: Capacity Validation Strategy

**Decision**: Reuse existing `calculateCurrentCost()` and `calculateMaxCapacity()` from `store.ts`. Engine methods validate before applying changes.

**Tank switch validation**:
```
newMaxCapacity = TANK_BASE_CAPACITY[newSizeTier] + getFilter(currentFilterId).capacityBonus
if (currentFishCost > newMaxCapacity) → reject with message
```

**Filter switch validation**:
```
newMaxCapacity = TANK_BASE_CAPACITY[currentSizeTier] + getFilter(newFilterId).capacityBonus
if (currentFishCost > newMaxCapacity) → reject with message
```

**Rationale**: No new calculation logic needed. The existing functions already compute exactly what we need. Validation happens in the engine before state mutation.

## R5: UI Layout — Separate Accordion Sections

**Decision**: Add two new MUI Accordion components as siblings to the existing SettingsPanel (timer settings). The layout in App.tsx becomes:

1. **Settings** (existing SettingsPanel) — Focus/Break timer
2. **Tank & Filter** (new TankManager) — Tank size selector + filter selector
3. **Fish** (new FishManager) — Fish list with rename/remove

**Rationale**:
- Keeps timer settings separate from management (user's explicit requirement).
- MUI Accordion is the established pattern in this codebase.
- Each section is independently collapsible.
- TankManager combines tank + filter because they share the same capacity validation concern and are closely related.

## R6: Fish Removal — Engine Behavior

**Decision**: Remove fish by filtering the `state.fish` array. Dead fish are also removable. If all living fish are removed, the existing `handleDeadFish()` logic in the engine will auto-spawn a new starter neon tetra.

**Rationale**:
- The engine already handles the "zero living fish" case by spawning a new fish (in `handleDeadFish()` called during `tick()`).
- Removal simply removes from the array. The next tick will detect the empty state and auto-spawn.
- Confirmation happens in the webview UI before the `removeFish` message is sent.
