# Tasks: Debug Mode

**Input**: Design documents from `/specs/008-debug-mode/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Organization**: Tasks grouped by user story. All three user stories share the same foundation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Setup

**Purpose**: Configuration and message protocol

- [x] T001 Add `pomotank.debugMode` boolean setting (default: false) to `contributes.configuration.properties` in `package.json`
- [x] T002 Add debug message types to `src/shared/messages.ts`: add `{ type: 'debugSetPomo'; amount: number }` and `{ type: 'debugResetState' }` to `WebviewToExtensionMessage` union

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wire debugMode through snapshot and handle debug messages in extension host

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add `debugMode: boolean` field to `GameStateSnapshot` in `src/game/state.ts`
- [x] T004 Update `createSnapshot()` in `src/game/engine.ts` to read `pomotank.debugMode` setting via a `debugMode` parameter passed from the caller, and include it in the snapshot
- [x] T005 Update `src/extension.ts`: read `pomotank.debugMode` from config and pass it to `engine.createSnapshot()`. Also add `engine.setPomo(amount: number)` method call for the `debugSetPomo` message.
- [x] T006 Add `setPomo(amount: number)` method to `GameEngine` in `src/game/engine.ts` that sets `player.pomoBalance` to `Math.max(0, amount)` and notifies subscribers
- [x] T007 Handle `debugSetPomo` and `debugResetState` messages in `src/providers/tank-panel.ts`: check debugMode setting before executing, call engine methods, send state update back
- [x] T008 [P] Handle `debugSetPomo` and `debugResetState` messages in `src/providers/companion-view.ts`: same as T007

**Checkpoint**: Debug mode flag flows to webview, debug messages handled by extension host

---

## Phase 3: User Story 3 - Enable/Disable Debug Mode (Priority: P1)

**Goal**: Debug panel visibility controlled by VSCode setting

**Independent Test**: Toggle `pomotank.debugMode` setting, verify debug panel appears/disappears

### Implementation for User Story 3

- [x] T009 [US3] Create `src/webview/tank-panel/components/DebugPanel.tsx`: a React component that renders a debug toolbar with a colored border (orange/red) containing a pomo input field with "Set" button and a "Reset State" button. Accept props: `pomoBalance: number`, `onSetPomo: (amount: number) => void`, `onResetState: () => void`
- [x] T010 [US3] Update `src/webview/tank-panel/App.tsx`: conditionally render `<DebugPanel>` when `state.debugMode === true`, positioned below the store button. Pass `sendMessage` wrappers for `debugSetPomo` and `debugResetState` as callbacks.

**Checkpoint**: Debug panel visible when setting enabled, hidden when disabled

---

## Phase 4: User Story 1 - Set Pomo Balance Freely (Priority: P1)

**Goal**: Developer can set pomo to any value via debug panel input

**Independent Test**: Enter a pomo value in debug panel, verify HUD and store update immediately

**Depends on**: Phase 3 (DebugPanel must exist)

### Implementation for User Story 1

- [x] T011 [US1] Implement pomo input logic in `src/webview/tank-panel/components/DebugPanel.tsx`: numeric input field with local state, "Set" button calls `onSetPomo(value)`. Clamp input to minimum 0. Parse input as integer.

**Checkpoint**: Entering a pomo value updates HUD and store affordability immediately

---

## Phase 5: User Story 2 - Reset to Initial State (Priority: P1)

**Goal**: Developer can reset entire game state to defaults with confirmation

**Independent Test**: Click Reset, confirm, verify tank returns to initial state

**Depends on**: Phase 3 (DebugPanel must exist)

### Implementation for User Story 2

- [x] T012 [US2] Implement reset with inline confirmation in `src/webview/tank-panel/components/DebugPanel.tsx`: first click shows "Confirm Reset?" text with confirm/cancel. Confirm calls `onResetState()`. Auto-dismiss confirmation after 3 seconds. The existing `debugReset` command in `extension.ts` already calls `createInitialState()` — reuse that pattern in the message handler (T007).

**Checkpoint**: Reset button with confirmation resets tank to Nano + 1 neon tetra + 0 pomo

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation

- [x] T013 Build and lint check: run `npm run build && npm run lint` and fix any type errors or lint issues
- [x] T014 Run quickstart.md verification scenarios to validate all debug mode features work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundation)**: Depends on Phase 1
- **Phase 3 (US3)**: Depends on Phase 2
- **Phase 4 (US1)**: Depends on Phase 3 (DebugPanel)
- **Phase 5 (US2)**: Depends on Phase 3 (DebugPanel), parallel with Phase 4
- **Phase 6 (Polish)**: Depends on all prior phases

### Parallel Opportunities

- T007 and T008 can run in parallel (different provider files)
- Phase 4 (US1) and Phase 5 (US2) can run in parallel after Phase 3

---

## Implementation Strategy

### MVP First (US3 + US1)

1. Complete Phase 1 + 2: Setting + message protocol + engine methods
2. Complete Phase 3: DebugPanel with visibility toggle
3. Complete Phase 4: Pomo input working
4. **STOP and VALIDATE**: Can set pomo balance via debug panel

### Incremental Delivery

1. Setup + Foundation → Debug infrastructure ready
2. US3 → Debug panel visible/hidden based on setting
3. US1 → Pomo input functional
4. US2 → Reset with confirmation
5. Polish → Build/lint clean

---

## Notes

- Existing `debugReset` and `debugAddPomo` commands in extension.ts already implement the core logic — reuse patterns
- DebugPanel is a single component handling both US1 and US2 UI
- T009 creates the component shell, T011 and T012 add the specific interaction logic
