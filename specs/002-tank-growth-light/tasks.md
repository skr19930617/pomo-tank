# Tasks: 水槽の成長システムとライトスイッチ機能

**Input**: Design documents from `/specs/002-tank-growth-light/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No new project setup needed — existing project structure is maintained.

*(No tasks — project already initialized)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared state changes and constants that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Add `TANK_RENDER_SIZES` constant (mapping TankSizeTier → {width, height}) and `DESK_HEIGHT` (30), `LIGHT_BAR_HEIGHT` (20) constants to `src/game/state.ts`
- [x] T002 Add `lightOn: boolean` (default: true) and `lightOffTimestamp: number | null` (default: null) fields to `GameState` interface and `createInitialState()` in `src/game/state.ts`
- [x] T003 Add `lightOn: boolean` field to `GameStateSnapshot` interface and include it in `createSnapshot()` output in `src/game/state.ts` and `src/game/engine.ts`

**Checkpoint**: Foundation ready — state types and constants available for all user stories

---

## Phase 3: User Story 1 - 水槽サイズが段階的に成長する (Priority: P1) 🎯 MVP

**Goal**: 水槽の描画サイズがタンクサイズ（Nano〜XL）に連動して段階的に大きくなる。Nanoは小さく、XLはパネル幅いっぱい。

**Independent Test**: Nanoタンクで開始 → パネルを開き小さい水槽を確認 → debugAddPomoでポイントを貯めてストアでタンクアップグレード → 水槽描画サイズが大きくなることを確認

### Implementation for User Story 1

- [x] T004 [US1] Implement dynamic canvas sizing in `media/webview/tank-detail/main.js`: on stateUpdate, read `state.tank.sizeTier` and look up canvas width/height from a TANK_RENDER_SIZES map (Nano:200×150, Small:260×195, Medium:320×240, Large:370×278, XL:400×300), set canvas.width and canvas.height attributes accordingly
- [x] T005 [US1] Update fish boundary calculations in `media/webview/tank-detail/main.js`: change hardcoded bounds (x:[20, width-20], y:[40, height-40]) to dynamically use current canvas.width and canvas.height, and update initFishAnim() initial position ranges to use canvas dimensions instead of fixed values
- [x] T006 [P] [US1] Update companion view in `src/providers/companion-view.ts`: apply proportional canvas sizing based on sizeTier (scale factor ~0.5 of main tank dimensions), adjust fish boundaries proportionally

**Checkpoint**: 水槽サイズアップグレード時に描画サイズが変化する。魚が新しいサイズ内で正しく泳ぐ。

---

## Phase 4: User Story 3 - ライトスイッチで水槽の明暗とタイマーを制御する (Priority: P1)

**Goal**: 水槽上部のライトスイッチでオン・オフ切替。オフで水槽暗転＋劣化停止＋魚速度50%低下。オンで全て復帰。

**Independent Test**: パネルを開きライトスイッチを確認 → スイッチをオフにして暗転確認 → debugTickを複数回実行して劣化が進まないことを確認 → スイッチをオンに戻して復帰確認

### Implementation for User Story 3

- [x] T007 [US3] Implement `toggleLight()` method in `src/game/engine.ts`: toggle `state.lightOn`, record `lightOffTimestamp = Date.now()` on off, on restore calculate `lightOffDuration` and add to `lastTickTimestamp` to skip paused time, set `lightOffTimestamp = null`
- [x] T008 [US3] Add light state guard to `tick()` method in `src/game/engine.ts`: if `!state.lightOn`, skip deterioration (`applyTick`) and health evaluation, but still update webview state
- [x] T009 [US3] Update `timeSinceLastMaintenance` calculation in `src/game/points.ts`: handled via sessionStartTime adjustment in toggleLight() — no changes needed to points.ts
- [x] T010 [US3] Add light toggle UI in `src/providers/tank-panel.ts`: add "💡 Light" toggle button to actions HTML, handle `toggleLight` webview message by calling `engine.toggleLight()`, send `lightToggleResult` response back
- [x] T011 [US3] Implement light visual effects in `media/webview/tank-detail/main.js`: draw light bar (20px height) at canvas top with on/off color state, apply semi-transparent dark overlay (rgba black ~0.5 alpha) over water area when lightOn=false, reduce fish movement speed by 50% when lightOn=false
- [x] T012 [P] [US3] Update status bar in `src/ui/status-bar.ts`: show light-off indicator (e.g., prepend "⏸" or change icon) when lightOn=false, update tooltip to include "Light: ON/OFF" line
- [x] T013 [P] [US3] Reflect light state in companion view `src/providers/companion-view.ts`: apply dark overlay when lightOn=false, reduce fish speed by 50% (no switch UI in companion)

**Checkpoint**: ライトオン・オフの切替が動作し、暗転＋劣化停止＋魚減速＋ステータスバー反映が確認できる。

---

## Phase 5: User Story 2 - 水槽が机の上に置かれているデザイン (Priority: P2)

**Goal**: 水槽の下に木目調の机の天板を描画し、水槽がインテリアの一部として自然に見えるデザイン。

**Independent Test**: パネルを開いて水槽の下に机の天板が描画されていることを確認 → タンクサイズをアップグレードして机も追従することを確認

### Implementation for User Story 2

- [x] T014 [US2] Implement desk drawing in `media/webview/tank-detail/main.js`: extend canvas effective height by DESK_HEIGHT (30px), draw wooden desk surface below the tank body using pixel-art style (wood grain pattern with 2-3 brown tones), ensure desk width matches tank width and is centered
- [x] T015 [P] [US2] Add desk drawing to companion view in `src/providers/companion-view.ts`: draw proportionally scaled desk below companion tank canvas

**Checkpoint**: 水槽が机の上に載っているデザインが表示される。サイズ変更に追従する。

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Integration verification and theme compatibility

- [x] T016 Verify all features work together end-to-end: tank growth + desk + light switch combined, test full flow from Nano with light toggle through XL upgrade
- [x] T017 Verify VSCode theme compatibility in `media/webview/tank-detail/main.js` and `media/webview/tank-detail/style.css`: ensure desk colors work with both light and dark themes, ensure light bar and dark overlay are visible in both themes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: N/A — no setup needed
- **Foundational (Phase 2)**: T001 → T002 → T003 (sequential, same file changes)
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 3 (Phase 4)**: Depends on Phase 2 completion — independent of US1
- **User Story 2 (Phase 5)**: Depends on Phase 2 completion — enhanced by US1 (desk follows tank size)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **User Story 3 (P1)**: Can start after Phase 2 — no dependencies on other stories. Can be developed in parallel with US1.
- **User Story 2 (P2)**: Can start after Phase 2 — benefits from US1 (dynamic sizing) being complete first, but is independently testable with any fixed tank size

### Within Each User Story

- Core logic before UI rendering
- Engine changes before webview changes
- Main panel before companion view

### Parallel Opportunities

- **Phase 3 + Phase 4**: US1 and US3 can be developed in parallel (different concerns: sizing vs light)
- **Within Phase 3**: T006 (companion) can run in parallel with T004-T005 (main panel)
- **Within Phase 4**: T012 (status bar) and T013 (companion) can run in parallel with T010-T011 (main panel)
- **Within Phase 5**: T015 (companion) can run in parallel with T014 (main panel)

---

## Parallel Example: User Story 1 + User Story 3

```bash
# After Phase 2 (Foundational) completes, both stories can start simultaneously:

# Stream A: User Story 1 (Tank Growth)
Task: T004 "Dynamic canvas sizing in media/webview/tank-detail/main.js"
Task: T005 "Fish boundary calculations in media/webview/tank-detail/main.js"
Task: T006 "Companion view sizing in src/providers/companion-view.ts"

# Stream B: User Story 3 (Light Switch)
Task: T007 "toggleLight() in src/game/engine.ts"
Task: T008 "tick() light guard in src/game/engine.ts"
Task: T009 "Timer pause in src/game/points.ts"
Task: T010 "Light toggle UI in src/providers/tank-panel.ts"
Task: T011 "Light visuals in media/webview/tank-detail/main.js"  # ⚠️ Wait for T004-T005 if same file
Task: T012 "Status bar in src/ui/status-bar.ts"
Task: T013 "Companion light in src/providers/companion-view.ts"
```

**Note**: T011 (light visuals) and T004-T005 (dynamic sizing) both modify `main.js`. If developing in parallel, coordinate merge or implement US1 changes first in main.js.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001-T003)
2. Complete Phase 3: User Story 1 (T004-T006)
3. **STOP and VALIDATE**: Test tank size growth independently
4. Demo: 水槽サイズが段階的に大きくなる

### Incremental Delivery

1. Phase 2 → Foundation ready
2. Phase 3: US1 → 水槽サイズ成長 → Validate
3. Phase 4: US3 → ライトスイッチ → Validate
4. Phase 5: US2 → 机のデザイン → Validate
5. Phase 6 → Polish & verify all together

### Recommended Order (Single Developer)

Phase 2 → Phase 3 (US1) → Phase 5 (US2, since desk builds on dynamic sizing) → Phase 4 (US3) → Phase 6

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1 and US3 are both P1 but independent — either can be implemented first
- US2 (desk) is visually enhanced when US1 (dynamic sizing) is complete, so recommended after US1
- main.js is the most heavily modified file — coordinate changes carefully
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
