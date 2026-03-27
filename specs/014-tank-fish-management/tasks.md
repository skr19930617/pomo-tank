# Tasks: Tank & Fish Management Settings

**Input**: Design documents from `/specs/014-tank-fish-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story. US1 (tank switching) and US2 (filter switching) share the TankManager component but are separable. US3 (fish management) is fully independent.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Extend data model and message contracts shared by all user stories.

- [x] T001 Add `customName?: string` field to the `Fish` interface in `src/game/state.ts` (line ~159). Also add `customName?: string` to the fish array type in `GameStateSnapshot` (line ~211). Add `unlockedItems: string[]` to the `GameStateSnapshot.player` type (line ~217).
- [x] T002 [P] Add 4 new webview→extension message types to `src/shared/messages.ts`: `{ type: 'switchTank'; sizeTier: TankSizeTier }`, `{ type: 'switchFilter'; filterId: FilterId }`, `{ type: 'renameFish'; fishId: string; customName: string }`, `{ type: 'removeFish'; fishId: string }`. Add 1 new extension→webview type: `{ type: 'managementResult'; action: string; success: boolean; message?: string }`. Import `TankSizeTier` and `FilterId` from types.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend engine with management methods and update snapshot to include new fields. BLOCKS all UI work.

**CRITICAL**: No UI component can be built until the engine methods and snapshot extensions are complete.

- [x] T003 Update `src/game/engine.ts` `createSnapshot()` method: add `unlockedItems: this.state.player.unlockedItems` to the `player` section of the snapshot. Add `customName: f.customName` to each fish entry in the snapshot's fish array.
- [x] T004 Add `switchTank(sizeTier: TankSizeTier)` method to `src/game/engine.ts`: validate that sizeTier is `'Nano'` or the corresponding tank item ID (e.g., `'tank_small'` for `Small`) exists in `state.player.unlockedItems`. Calculate new max capacity using `TANK_BASE_CAPACITY[sizeTier]` + current filter bonus (via `getFilter(state.tank.filterId)?.capacityBonus ?? 0`). If `calculateCurrentCost(state.fish) > newMaxCapacity`, return `{ success: false, message: 'Capacity would be exceeded' }`. Otherwise, set `state.tank.sizeTier = sizeTier` and call `notifySubscribers()`. Return `{ success: true }`. Import `TANK_BASE_CAPACITY` from state and `calculateCurrentCost` from store and `getFilter` from filters.
- [x] T005 Add `switchFilter(filterId: FilterId)` method to `src/game/engine.ts`: validate that filterId is `'basic_sponge'` or exists in `state.player.unlockedItems`. Calculate new max capacity using `TANK_BASE_CAPACITY[state.tank.sizeTier]` + `getFilter(filterId)?.capacityBonus ?? 0`. If `calculateCurrentCost(state.fish) > newMaxCapacity`, return `{ success: false, message: 'Capacity would be exceeded' }`. Otherwise, set `state.tank.filterId = filterId` and call `notifySubscribers()`. Return `{ success: true }`.
- [x] T006 Add `renameFish(fishId: string, customName: string)` method to `src/game/engine.ts`: find the fish by ID in `state.fish`. If not found, return `{ success: false, message: 'Fish not found' }`. Trim customName to max 20 characters. If trimmed name is empty, set `customName` to `undefined`. Otherwise set `fish.customName = trimmedName`. Update state and call `notifySubscribers()`. Return `{ success: true }`.
- [x] T007 Add `removeFish(fishId: string)` method to `src/game/engine.ts`: find the fish index by ID in `state.fish`. If not found, return `{ success: false, message: 'Fish not found' }`. Remove the fish from the array via `splice()`. Update state and call `notifySubscribers()`. Return `{ success: true }`.
- [x] T008 Update `src/providers/tank-panel.ts` `handleMessage()` to handle the 4 new message types: `switchTank` → call `engine.switchTank(message.sizeTier)`, `switchFilter` → call `engine.switchFilter(message.filterId)`, `renameFish` → call `engine.renameFish(message.fishId, message.customName)`, `removeFish` → call `engine.removeFish(message.fishId)`. For each, send a `managementResult` response with the action name and result, then send a `stateUpdate` with the latest snapshot.
- [x] T009 Update `src/webview/tank-panel/hooks/useGameState.ts` to handle the `managementResult` message type in the event handler switch statement: show notification with `msg.action` result (success or failure message), similar to how `actionResult` and `purchaseResult` are handled.

**Checkpoint**: Engine has all 4 management methods. Snapshot includes unlockedItems and customName. Message handling wired end-to-end. Build succeeds.

---

## Phase 3: User Story 1 - Tank Size Switching (Priority: P1) MVP

**Goal**: Users can switch between unlocked tank sizes from a new management panel. Capacity validation prevents invalid switches.

**Independent Test**: Unlock multiple tanks → open Tank & Filter section → switch sizes → visual updates. Try switching to a size that exceeds capacity → warning shown, switch blocked.

### Implementation for User Story 1

- [x] T010 [US1] Create `src/webview/tank-panel/components/TankManager.tsx`: an MUI Accordion component with the summary "Tank & Filter". In the details section, render a "Tank Size" subsection showing a list of available tank sizes. Derive available sizes from `state.player.unlockedItems` (filter for items starting with `'tank_'` and map to TankSizeTier, plus always include Nano). For each size, show the name and base capacity (`TANK_BASE_CAPACITY`). Highlight the current `state.tank.sizeTier`. On click of a different size, send a `switchTank` message via `sendMessage`. Accept props: `state: GameStateSnapshot`, `sendMessage: (msg: WebviewToExtensionMessage) => void`. Use MUI `Button` with `variant="outlined"` for each option, `variant="contained"` for the current. Disable options where `TANK_BASE_CAPACITY[size] + currentFilterBonus < state.capacity.current` and show a capacity warning text. Import `TANK_BASE_CAPACITY`, `TANK_SIZE_ORDER` from shared/types.
- [x] T011 [US1] Update `src/webview/tank-panel/App.tsx`: import TankManager, render it as a sibling Accordion below the SettingsPanel. Pass `state` and `sendMessage` as props.

**Checkpoint**: Tank switching works from settings. Capacity validation prevents invalid switches.

---

## Phase 4: User Story 2 - Filter Switching (Priority: P2)

**Goal**: Users can switch between unlocked filters from the same Tank & Filter panel.

**Independent Test**: Unlock multiple filters → open Tank & Filter section → switch filters → visual and capacity update. Invalid switches blocked.

### Implementation for User Story 2

- [x] T012 [US2] Extend `src/webview/tank-panel/components/TankManager.tsx`: add a "Filter" subsection below the tank size section. Derive available filters from `state.player.unlockedItems` (filter for known FilterId values, plus always include `'basic_sponge'`). For each filter, show the display name and capacity bonus (import `getFilter` and `getAllFilters` from game/filters). Highlight the currently equipped `state.tank.filterId`. On click, send a `switchFilter` message. Disable options where switching would cause capacity overflow. Show warning text for disabled options.

**Checkpoint**: Filter switching works alongside tank switching. Both share the same Accordion.

---

## Phase 5: User Story 3 - Fish Management: Rename & Remove (Priority: P3)

**Goal**: Users can rename and remove fish from a dedicated fish management panel.

**Independent Test**: Open Fish section → see all fish listed → rename a fish → see custom name in list and tooltip → remove a fish with confirmation → fish disappears, capacity freed.

### Implementation for User Story 3

- [x] T013 [US3] Create `src/webview/tank-panel/components/FishManager.tsx`: an MUI Accordion with summary "Fish". In the details, render a list of all fish from `state.fish`. For each fish: show an editable name field (MUI TextField, size="small") pre-filled with `fish.customName || speciesDisplayName` (look up species via `getSpecies(fish.genusId, fish.speciesId)`). On blur or Enter, send `renameFish` message if the name changed. Show health state as a colored indicator (green=Healthy, yellow=Warning, red=Sick, gray=Dead). Show a remove button (MUI IconButton or small Button with "X"). On remove click, toggle a confirmation state for that fish row (show "Confirm?" / "Cancel" buttons). On confirm, send `removeFish` message. Auto-dismiss confirmation after 3 seconds (reuse the pattern from DebugPanel). Accept props: `state: GameStateSnapshot`, `sendMessage: (msg: WebviewToExtensionMessage) => void`.
- [x] T014 [US3] Update `src/webview/tank-panel/App.tsx`: import FishManager, render it as another sibling Accordion below TankManager. Pass `state` and `sendMessage`.
- [x] T015 [US3] Update `src/webview/tank-panel/components/FishTooltip.tsx`: accept an optional `customName?: string` prop. Display `customName` instead of `speciesName` when it is set (truthy). Update the tooltip text rendering accordingly.
- [x] T016 [US3] Update `src/webview/tank-panel/components/TankScene.tsx`: when rendering FishTooltip (around line 183), pass the `customName` from the fish snapshot data: `customName={f.customName}`. The fish data `f` comes from `state.fish.find(...)`.

**Checkpoint**: Fish rename and remove both work. Custom names show in tooltips. Capacity updates on remove.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final build validation and cleanup.

- [x] T017 Run `npm run build` and fix any TypeScript or esbuild errors across all modified files
- [x] T018 Run `npm run lint` and fix any ESLint errors
- [x] T019 Perform manual visual testing per quickstart.md checklist: verify all 15 test scenarios pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all UI work
- **US1 (Phase 3)**: Depends on Phase 2 — tank switching engine methods
- **US2 (Phase 4)**: Depends on US1 (extends TankManager component)
- **US3 (Phase 5)**: Depends on Phase 2 — independent of US1/US2
- **Polish (Phase 6)**: Depends on all stories

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2. Creates the TankManager component.
- **US2 (P2)**: Depends on US1 (extends TankManager). Could start in parallel if TankManager is stubbed.
- **US3 (P3)**: Can start after Phase 2. Fully independent of US1/US2 (separate FishManager component).

### Parallel Opportunities

- T001 and T002 can run in parallel (state.ts vs messages.ts)
- T004, T005, T006, T007 are engine methods that modify the same file but are independent additions
- T010 (TankManager) and T013 (FishManager) can run in parallel after Phase 2 (different components)
- US3 can start in parallel with US1 after Phase 2

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T009)
3. Complete Phase 3: User Story 1 (T010-T011)
4. **STOP and VALIDATE**: Tank switching works, capacity validation correct

### Recommended Execution Order (Single Developer)

1. T001+T002 (parallel) → T003 → T004 → T005 → T006 → T007 → T008 → T009
2. T010 → T011 (US1 done)
3. T012 (US2 done)
4. T013 → T014 → T015 → T016 (US3 done)
5. T017 → T018 → T019

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story
- TankManager combines tank + filter switching in one Accordion (US1 creates it, US2 extends it)
- FishManager is a separate Accordion (US3, independent)
- Engine methods all return `{ success: boolean; message?: string }` for consistent result handling
- The `unlockedItems` snapshot extension is critical — without it, the webview cannot determine available tanks/filters
