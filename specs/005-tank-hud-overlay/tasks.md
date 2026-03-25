# Tasks: 水槽HUDオーバーレイ

**Input**: Design documents from `/specs/005-tank-hud-overlay/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: HUD用の定数とピクセルフォントデータの準備

- [x] T001 Add HUD constants (HUD_HEIGHT=16, POMO_THRESHOLD_MS=1200000, ACTION_BAR_HEIGHT) to src/shared/types.ts
- [x] T002 [P] Create pixel font bitmap data (0-9, colon, plus, K, percent, space) as 5x7 grids in src/webview/tank-panel/components/pixel-font-data.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 全ユーザーストーリーが依存するドット絵レンダリング基盤コンポーネント

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create PixelText Konva component that renders bitmap font characters as Rect groups with configurable color, position, and scale in src/webview/tank-panel/components/PixelText.tsx. Must support: text string input, fill color prop, x/y positioning, and character spacing per pixel-font-data.ts definitions
- [x] T004 [P] Create PixelButton Konva component with configurable icon bitmap, size, fill color, active color, disabled state, and onClick handler in src/webview/tank-panel/components/PixelButton.tsx. Must render as a Group with background Rect + icon Rect grid, support hover/press visual states
- [x] T005 [P] Create useTimer hook in src/webview/tank-panel/hooks/useTimer.ts that accepts timeSinceLastMaintenance (ms) and lightOn from state, interpolates elapsed seconds client-side using Date.now() delta from last stateUpdate, pauses when lightOn=false, and returns { displaySeconds: number, isOvertime: boolean, isPaused: boolean }

**Checkpoint**: Foundation ready — PixelText, PixelButton, useTimer are independently usable

---

## Phase 3: User Story 1 — ポモドーロ経過時間の常時確認 (Priority: P1) 🎯 MVP

**Goal**: 水槽シーン上部にドット絵調タイマーを表示し、20分超過で赤色に変化させる

**Independent Test**: コンパニオンビューを開き、タイマーが毎秒カウントアップすること、20分経過で白→赤に変わることを目視確認

### Implementation for User Story 1

- [x] T006 [US1] Create HudOverlay Konva component in src/webview/tank-panel/components/HudOverlay.tsx. Render semi-transparent background bar (y=0, height=HUD_HEIGHT, full sceneWidth). Display timer using PixelText at left side (x=4, y=4) in mm:ss format. Accept props: sceneWidth, timerSeconds, isOvertime, isPaused, compact (boolean). Timer color: white (#ffffff) when normal, red (#ff4444) when isOvertime. Show blinking or dimmed text when isPaused
- [x] T007 [US1] Integrate HudOverlay into TankScene in src/webview/tank-panel/components/TankScene.tsx. Add HudOverlay as last child in Konva Layer (renders on top). Pass sceneWidth, timer data from useTimer hook. Add compact prop (default false). Wire useTimer hook with state.session.timeSinceLastMaintenance and state.lightOn
- [x] T008 [US1] Update companion App.tsx in src/webview/companion/App.tsx to pass compact={true} to TankScene. Add useTimer hook usage with state data. Ensure timer renders correctly at 220px companion width

**Checkpoint**: Timer displays in both companion and full panel views, turns red at 20 minutes, pauses when light off

---

## Phase 4: User Story 2 — コンパニオンビューでの基本操作 (Priority: P1)

**Goal**: コンパニオンビューから餌やり・水替え・苔掃除・ライト切替を直接実行可能にする

**Independent Test**: コンパニオンビューのアクションボタンをクリックして各メンテナンスアクションが実行され、水槽状態が変化することを確認

### Implementation for User Story 2

- [x] T009 [US2] Create ActionBar Konva component in src/webview/tank-panel/components/ActionBar.tsx. Render 4-5 PixelButtons (feed, water, algae, light, optionally expand) evenly spaced at bottom of scene (y=sceneHeight - DESK_HEIGHT area). Accept props: sceneWidth, sceneHeight, sendMessage callback, lightOn, showExpand (boolean), onExpandClick callback. Define 8x8 pixel art icon bitmaps for each action (fish for feed, droplet for water, leaf for algae, bulb for light)
- [x] T010 [US2] Add action message handling to companion-view.ts in src/providers/companion-view.ts. Handle feedFish, changeWater, cleanAlgae, toggleLight messages by calling corresponding GameEngine methods (following existing tank-panel.ts pattern). Send actionResult and lightToggleResult responses back to companion webview
- [x] T011 [US2] Integrate ActionBar into TankScene in src/webview/tank-panel/components/TankScene.tsx. Add ActionBar as Konva child after HudOverlay. Accept and pass through sendMessage, lightOn, showExpand, onExpandClick props. Add these props to TankSceneProps interface
- [x] T012 [US2] Update companion App.tsx in src/webview/companion/App.tsx. Remove the onClick={handleClick} div wrapper (remove click-to-open behavior). Pass sendMessage, lightOn={state.lightOn}, showExpand={true}, onExpandClick={() => sendMessage({ type: 'openTank' })} to TankScene
- [x] T013 [US2] Add button feedback animation state to ActionBar in src/webview/tank-panel/components/ActionBar.tsx. Track feedbackButtons Map<string, number> in local state. On actionResult success message (via useGameState notification), set button ID with timestamp. In render loop, apply activeColor to buttons with timestamp < 500ms ago, revert to normal color after. Add disabled visual state for buttons when action not needed (pass state data for hunger/dirtiness/algae thresholds)
- [x] T014 [US2] Create PomoAnimation component in src/webview/tank-panel/components/PomoAnimation.tsx. Render floating "+N" PixelText that animates upward (y decreases by 20px over 1 second) and fades out (opacity 1.0 → 0.0). Accept props: amount (number), x, y (start position), onComplete callback. Use RAF-based animation with startTime tracking
- [x] T015 [US2] Integrate PomoAnimation into HudOverlay in src/webview/tank-panel/components/HudOverlay.tsx. Track pomoAnimation state { amount, startTime } | null. Trigger animation when pomoBalance increases between state updates (compare previous vs current pomoBalance). Position animation near coin display area (right side of HUD)

**Checkpoint**: All 4 maintenance actions executable from companion view with visual button feedback and pomo gain animation

---

## Phase 5: User Story 3 — ポモコイン残高の常時表示 (Priority: P2)

**Goal**: HUD右側にドット絵風コインアイコンとポモ残高を常時表示

**Independent Test**: コンパニオンビューでコインアイコンと数字が表示され、アクション後に数値が更新されることを確認

### Implementation for User Story 3

- [x] T016 [US3] Add coin icon and pomo balance display to HudOverlay in src/webview/tank-panel/components/HudOverlay.tsx. Create 7x7 pixel coin icon bitmap (circle with P or $ symbol). Render coin icon + PixelText with pomoBalance at right side of HUD bar (x=sceneWidth - calculated width - 4). Accept pomoBalance prop. Handle edge case: display "9999+" when pomoBalance >= 10000
- [x] T017 [US3] Pass pomoBalance from state.player.pomoBalance through TankScene to HudOverlay in src/webview/tank-panel/components/TankScene.tsx and src/webview/companion/App.tsx

**Checkpoint**: Coin icon and balance visible in HUD, updates in real-time with state changes

---

## Phase 6: User Story 4 — 拡大表示ボタン (Priority: P2)

**Goal**: ドット絵調拡大ボタンでフルパネルを開く。水槽全体クリックでの遷移を廃止

**Independent Test**: 拡大ボタンクリックでフルパネルが開き、シーンの他の部分をクリックしてもパネルが開かないことを確認

### Implementation for User Story 4

- [x] T018 [US4] Add expand button icon bitmap (magnifying glass or arrows-out icon, 8x8) to ActionBar config in src/webview/tank-panel/components/ActionBar.tsx. Render expand button only when showExpand={true}. Wire onClick to onExpandClick callback
- [x] T019 [US4] Ensure full panel TankScene passes showExpand={false} in src/webview/tank-panel/App.tsx so expand button does not appear in the full panel view. Verify companion App.tsx passes showExpand={true} (already done in T012)

**Checkpoint**: Expand button visible only in companion view, opens full panel on click, no more full-scene click behavior

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: フルパネルStatsBar置換、既存コード削除、エッジケース対応

- [x] T020 Update full panel App.tsx in src/webview/tank-panel/App.tsx. Remove StatsBar component usage. Remove Actions component usage. Pass sendMessage, lightOn, showExpand={false} to TankScene. Add compact={false} prop. Pass full stats data (avgHunger, waterDirtiness, algaeLevel, currentStreak) for non-compact HUD display
- [x] T021 Extend HudOverlay for non-compact mode in src/webview/tank-panel/components/HudOverlay.tsx. When compact={false}, render additional stats below or beside timer: hunger%, water%, algae%, streak. Use PixelText for all values. Layout: timer left, stats center, coin right (or two-row layout if space permits)
- [x] T022 Delete src/webview/tank-panel/components/StatsBar.tsx and remove all imports referencing it
- [x] T023 Delete src/webview/tank-panel/components/Actions.tsx and remove all imports referencing it
- [x] T024 [P] Handle edge cases in HudOverlay and ActionBar: timer cap at 99:59+ display (in useTimer or HudOverlay), pomo balance 9999+ cap (in HudOverlay), light-off disables all buttons except light toggle (in ActionBar), minimum scene width guard to prevent HUD element overlap
- [x] T025 Run npm test && npm run lint and fix any type errors, lint violations, or test failures
- [x] T026 Manual validation per specs/005-tank-hud-overlay/quickstart.md: verify all 6 validation steps pass in Extension Development Host

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T001, T002 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on T003 (PixelText), T005 (useTimer)
- **US2 (Phase 4)**: Depends on T003 (PixelText), T004 (PixelButton). Can start in parallel with US1
- **US3 (Phase 5)**: Depends on T006 (HudOverlay created in US1)
- **US4 (Phase 6)**: Depends on T009 (ActionBar created in US2)
- **Polish (Phase 7)**: Depends on US1, US2, US3, US4 all complete

### User Story Dependencies

- **US1 (P1)**: After Foundational → independent, no cross-story dependencies
- **US2 (P1)**: After Foundational → independent, no cross-story dependencies. **Can run in parallel with US1**
- **US3 (P2)**: After US1 (needs HudOverlay component to extend)
- **US4 (P2)**: After US2 (needs ActionBar component to extend)

### Within Each User Story

- Component creation before integration
- Integration before animation/feedback
- Core functionality before edge cases

### Parallel Opportunities

- T002 ∥ T001 (different files)
- T003 ∥ T004 ∥ T005 (all independent foundational components)
- US1 (Phase 3) ∥ US2 (Phase 4) — completely independent file sets
- US3 (Phase 5) ∥ US4 (Phase 6) — independent after their prerequisites
- T022 ∥ T023 (independent file deletions)

---

## Parallel Example: Foundational Phase

```bash
# Launch all foundational components in parallel:
Task: "T003 Create PixelText in src/webview/tank-panel/components/PixelText.tsx"
Task: "T004 Create PixelButton in src/webview/tank-panel/components/PixelButton.tsx"
Task: "T005 Create useTimer hook in src/webview/tank-panel/hooks/useTimer.ts"
```

## Parallel Example: US1 + US2 (after Foundational)

```bash
# Both P1 stories can proceed simultaneously:
# Stream A (US1 - Timer):
Task: "T006 Create HudOverlay → T007 Integrate into TankScene → T008 Companion integration"

# Stream B (US2 - Action Buttons):
Task: "T009 Create ActionBar → T010 companion-view.ts messages → T011 TankScene integration → T012 Companion App update → T013 Button feedback → T014 PomoAnimation → T015 Pomo animation integration"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003, T005)
3. Complete Phase 3: US1 — Timer display (T006-T008)
4. **STOP and VALIDATE**: Timer visible in companion view, turns red at 20min
5. Demo-ready with core pomodoro visualization

### Incremental Delivery

1. Setup + Foundational → Pixel rendering primitives ready
2. US1 (Timer) → Pomodoro timer visible (MVP!)
3. US2 (Actions) → Companion self-contained for all maintenance
4. US3 (Coin) → Pomo balance always visible
5. US4 (Expand) → Clean navigation via explicit button
6. Polish → Full panel unified, old components removed

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No test tasks generated (not requested in spec)
- US1 and US2 are both P1 but can run in parallel — US1 focuses on HUD display, US2 on action buttons
- US3 and US4 extend components created in US1 and US2 respectively
- StatsBar and Actions deletion deferred to Polish phase to avoid breaking full panel during development
- Commit after each task or logical group
