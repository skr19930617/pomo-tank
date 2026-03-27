# Tasks: Rebuild Debug UI

**Input**: Design documents from `/specs/015-rebuild-debug-ui/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md

**Tests**: Not explicitly requested in spec. Test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend message protocol and engine with tick multiplier support — foundation for all user stories.

- [x] T001 [P] Add `debugSetTickMultiplier` message variant (`{ type: 'debugSetTickMultiplier'; multiplier: number }`) to `WebviewToExtensionMessage` union in `src/shared/messages.ts`
- [x] T002 [P] Add `tickMultiplier: number` field to `GameStateSnapshot` interface in `src/game/state.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Engine-level tick multiplier logic that US1 and US3 depend on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Add `tickMultiplier` property (default: 1) to `GameEngine` class and implement `setTickMultiplier(n: number)` method that clamps n to [1, 100], clears the existing interval, updates the property, and restarts with `setInterval(tick, 60_000 / multiplier)` in `src/game/engine.ts`
- [x] T004 Update `createSnapshot()` in `GameEngine` to include `tickMultiplier` in the returned `GameStateSnapshot` in `src/game/engine.ts`
- [x] T005 Add `debugSetTickMultiplier` case to message handler in `src/providers/tank-panel.ts` — gate on `isDebugMode()`, call `engine.setTickMultiplier(message.multiplier)`, send state update

**Checkpoint**: Engine supports dynamic tick multiplier via message. Ready for UI work.

---

## Phase 3: User Story 1 - タイマー速度の倍率変更 (Priority: P1) MVP

**Goal**: Developer can set tick speed multiplier (1x–100x) from the debug UI, with ticks accelerating accordingly.

**Independent Test**: Set multiplier to 10x in debug UI, observe tank hunger/water/algae deteriorating ~10x faster than normal.

### Implementation for User Story 1

- [x] T006 [US1] Add tick multiplier section to `DebugPanel.tsx`: numeric input field (value 1–100), preset buttons (1x, 5x, 10x, 50x), current multiplier display. Add `tickMultiplier: number` and `onSetTickMultiplier: (n: number) => void` to `DebugPanelProps` in `src/webview/tank-panel/components/DebugPanel.tsx`
- [x] T007 [US1] Pass `tickMultiplier` from state and `onSetTickMultiplier` callback (sends `debugSetTickMultiplier` message) as props to `DebugPanel` in `src/webview/tank-panel/App.tsx`

**Checkpoint**: Tick multiplier fully functional end-to-end. Developer can accelerate time from debug UI.

---

## Phase 4: User Story 2 - Pomoコインの自由設定 (Priority: P1)

**Goal**: Developer can set Pomo coin balance to any non-negative integer from the debug UI.

**Independent Test**: Set pomo to 9999 in debug UI, confirm HUD and store both reflect the new balance.

### Implementation for User Story 2

- [x] T008 [US2] Retain and refine existing pomo editor section in `DebugPanel.tsx` — ensure input clamps negative values to 0, accepts only integers, and submits on Enter key or Set button click in `src/webview/tank-panel/components/DebugPanel.tsx`

**Checkpoint**: Pomo editing works as before with improved input validation. No new backend changes needed (existing `debugSetPomo` message handler is retained).

---

## Phase 5: User Story 3 - レガシーデバッグコマンドの削除 (Priority: P2)

**Goal**: Remove all 3 debug commands from command palette. Debug features are UI-only.

**Independent Test**: Open command palette, search "Pomotank Debug" — no results.

### Implementation for User Story 3

- [x] T009 [P] [US3] Remove `pomotank.debugTick`, `pomotank.debugReset`, `pomotank.debugAddPomo` command definitions from `contributes.commands` array in `package.json`
- [x] T010 [P] [US3] Remove the 3 `vscode.commands.registerCommand` blocks for `pomotank.debugTick`, `pomotank.debugReset`, `pomotank.debugAddPomo` in `src/extension.ts`

**Checkpoint**: No debug commands in command palette. All debug functionality is UI-only.

---

## Phase 6: User Story 4 - ステートリセット機能の維持 (Priority: P2)

**Goal**: State reset with confirmation dialog remains available in the debug UI.

**Independent Test**: Click reset in debug UI, confirm, verify game state returns to initial values.

### Implementation for User Story 4

- [x] T011 [US4] Retain existing state reset section in `DebugPanel.tsx` with confirmation workflow (confirm → 3s timeout → cancel). Ensure it still functions after the DebugPanel rebuild in T006/T008 in `src/webview/tank-panel/components/DebugPanel.tsx`

**Checkpoint**: State reset works from UI. Combined with US3, command-based reset is removed but UI-based reset is preserved.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases and safety checks across all stories.

- [x] T012 Ensure `setTickMultiplier(1)` is called when debug mode is toggled off — add listener for `pomotank.debugMode` configuration change in `src/extension.ts` or `src/providers/tank-panel.ts`
- [x] T013 Verify build succeeds with `npm run build` and lint passes with `npm run lint`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — T001, T002 run in parallel
- **Foundational (Phase 2)**: Depends on Phase 1 — T003 depends on T001+T002, T004 depends on T002, T005 depends on T001
- **US1 (Phase 3)**: Depends on Phase 2 completion
- **US2 (Phase 4)**: Depends on Phase 2 completion (only needs existing `debugSetPomo`)
- **US3 (Phase 5)**: No dependency on other user stories — can run in parallel with US1/US2
- **US4 (Phase 6)**: Depends on US1/US2 DebugPanel rebuild (T006/T008) being complete
- **Polish (Phase 7)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational (Phase 2) only. Independent of other stories.
- **US2 (P1)**: Depends on Foundational (Phase 2) only. Independent — uses existing message handler.
- **US3 (P2)**: Independent — deletion tasks in separate files from US1/US2.
- **US4 (P2)**: Depends on DebugPanel rebuild in US1/US2 being in place.

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T009 and T010 can run in parallel (different files)
- US1, US2, US3 can all start in parallel after Phase 2
- US3 (command deletion) is entirely independent and can start during Phase 1

---

## Parallel Example: Phase 1

```bash
# Launch setup tasks in parallel:
Task: "Add debugSetTickMultiplier to WebviewToExtensionMessage in src/shared/messages.ts"
Task: "Add tickMultiplier to GameStateSnapshot in src/game/state.ts"
```

## Parallel Example: User Story 3

```bash
# Launch deletion tasks in parallel:
Task: "Remove debug commands from package.json"
Task: "Remove debug command registrations from src/extension.ts"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Setup (message types)
2. Complete Phase 2: Foundational (engine multiplier)
3. Complete Phase 3: US1 — tick speed multiplier UI
4. Complete Phase 4: US2 — pomo coin editor
5. **STOP and VALIDATE**: Test multiplier and pomo editing independently

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. US1 (tick speed) → Test → Validates SC-001, SC-005
3. US2 (pomo editor) → Test → Validates SC-002
4. US3 (remove commands) → Test → Validates SC-003, SC-004
5. US4 (state reset) → Test → Validates SC-006
6. Polish → Build + lint verification

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No new files are created — all tasks modify existing files
- Total: 13 tasks across 7 phases
- DebugPanel.tsx is touched by T006, T008, T011 — these must be sequential
- Commit after each phase completion
