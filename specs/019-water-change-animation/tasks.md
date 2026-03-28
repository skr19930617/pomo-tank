# Tasks: 水換えアニメーション (Water Change Animation)

**Input**: Design documents from `/specs/019-water-change-animation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No new project initialization needed. This phase is skipped as the project is already set up and we are adding to an existing codebase.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core hook and type definitions that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Create `useWaterChangeMode` hook with phase state management (idle/ready/draining/paused/filling), animation constants (DRAIN_DURATION_S=6.0, PAUSE_DURATION_S=2.0, FILL_DURATION_S=6.0, MIN_WATER_RATIO=0.30, NORMAL_WATER_RATIO=0.90), ease-in-out function, module-level mutable AnimState, and the full `UseWaterChangeModeResult` interface in `src/webview/tank-panel/hooks/useWaterChangeMode.ts`
- [x] T002 Add `waterLevelRatio?: number` (default 0.9) and `waterColorOverride?: string | null` (default null) props to Tank component; modify water height calculation to use `waterLevelRatio` instead of hardcoded 0.9; when `waterColorOverride` is non-null use it instead of dirtiness-derived color in `src/webview/tank-panel/components/Tank.tsx`
- [x] T003 Add `waterChangePhase` prop to ActionBar; update `isDisabled` to return true for ALL buttons (feed, water, algae, light) when `waterChangePhase` is 'draining', 'paused', or 'filling'; when `waterChangePhase` is 'ready', disable feed/algae/light but keep water active (as toggle) in `src/webview/tank-panel/components/ActionBar.tsx`

**Checkpoint**: Foundation ready — useWaterChangeMode hook exists, Tank accepts dynamic water props, ActionBar respects waterChangePhase

---

## Phase 3: User Story 1 & 2 — 水位変化 + 色ブレンドアニメーション (Priority: P1) 🎯 MVP

**Goal**: 水換えボタン → モード待機 → 水槽クリック → 排水(6s, ease-in-out) → ポーズ(2s) → 給水(6s, ease-in-out, 色ブレンド) → 完了(changeWater 送信) の一連のフローを実装

**Independent Test**: 水換えボタンを押して水槽をクリックし、水位が下がって戻り、色が変化するアニメーションが再生されることを目視確認

### Implementation for User Story 1 & 2

- [x] T004 [US1] Implement `updateAnimation(frameCount)` in useWaterChangeMode: calculate elapsed time per phase, compute `waterLevelRatio` with ease-in-out (draining: 0.9→0.27, filling: 0.27→0.9), compute `waterColorOverride` during filling phase (linear interpolation from snapshot dirtiness color to dirtiness-50 color using existing RGB formula from Tank.tsx), auto-transition between phases (draining→paused→filling→idle), return true on completion in `src/webview/tank-panel/hooks/useWaterChangeMode.ts`
- [x] T005 [US1] Implement `startDraining()` in useWaterChangeMode: snapshot current waterDirtiness and algaeLevel from state, record startFrame, transition to 'draining' phase in `src/webview/tank-panel/hooks/useWaterChangeMode.ts`
- [x] T006 [US1] Integrate useWaterChangeMode into App: instantiate the hook, pass `waterChangeMode` result to TankScene as a new prop in `src/webview/tank-panel/App.tsx`
- [x] T007 [US1] Add `waterChangeMode` prop to TankScene; wire water button click to call `waterChangeMode.startReady()` instead of sending 'changeWater' message; add water-change click handler: when `waterChangeMode.phase === 'ready'` and user clicks inside tank water area call `waterChangeMode.startDraining()`, clicking outside calls `waterChangeMode.cancelReady()`; add re-click on water button in ready phase to call `cancelReady()`; add animation update: call `waterChangeMode.updateAnimation(frameCount)` each frame when phase is draining/paused/filling, on completion call `sendMessage({ type: 'changeWater' })`; pass `waterChangeMode.waterLevelRatio` and `waterChangeMode.waterColorOverride` to Tank component; pass `waterChangeMode.phase` to ActionBar as `waterChangePhase` in `src/webview/tank-panel/components/TankScene.tsx`
- [x] T008 [US1] Add visual indicator for ready mode: when `waterChangeMode.phase === 'ready'`, render a semi-transparent overlay or pulsing border on the tank area to indicate clickability; set cursor to 'pointer' on stage container; add ESC key handler to cancel ready mode (similar to feeding mode pattern) in `src/webview/tank-panel/components/TankScene.tsx`
- [x] T009 [US1] Update water shimmer highlights position in Tank.tsx to follow dynamic `waterTop` (calculated from `waterLevelRatio`) instead of the fixed position in `src/webview/tank-panel/components/Tank.tsx`

**Checkpoint**: Water change animation fully functional — button→ready→click→drain→pause→fill→complete with color blending

---

## Phase 4: User Story 3 — 魚の水位追従移動 (Priority: P2)

**Goal**: 水換えアニメーション中に魚の遊泳可能範囲を水位に連動して動的に制限し、魚が水面より上に表示されないようにする

**Independent Test**: 水換え中に魚が水位に追従して移動すること、水面より上に魚が表示されないことを目視確認

### Implementation for User Story 3

- [x] T010 [US3] Make fishBounds dynamic in App.tsx: change `fishBounds` from `useMemo` (tankId only) to also depend on `waterChangeMode.waterLevelRatio`; when waterLevelRatio < NORMAL_WATER_RATIO, reduce `bounds.height` proportionally (height = baseHeight * waterLevelRatio / NORMAL_WATER_RATIO) so fish swim zone shrinks with water level in `src/webview/tank-panel/App.tsx`
- [x] T011 [US3] Verify fish clamp behavior in useFishAnimation: confirm that when bounds shrink, fish positions are clamped to new bounds in the animation loop; if fish y-position exceeds new waterTop, it should be pushed down; check the existing syncFish and animation loop handle bounds changes correctly in `src/webview/tank-panel/hooks/useFishAnimation.ts`

**Checkpoint**: Fish follow water level during water change animation, never appearing above the water surface

---

## Phase 5: User Story 4 — ポンプとホースの視覚演出 (Priority: P3 — Stretch Goal)

**Goal**: 水換えアニメーション中にマウスカーソル位置にポンプを表示し、画面上端に向かってホースを描画する

**Independent Test**: 水換え中にマウスを水槽上で動かし、ポンプとホースが追従することを確認

**注意**: この phase は stretch goal です。Phase 3 & 4 の完了で issue としては完了扱い。

### Implementation for User Story 4

- [x] T012 [P] [US4] Create WaterChangeOverlay component: render pump icon (simple pixel art similar to existing icons) at mouse position and a curved line (Konva Line) from pump to top of stage; only visible when waterChangeMode.phase is 'draining', 'paused', or 'filling' in `src/webview/tank-panel/components/WaterChangeOverlay.tsx`
- [x] T013 [US4] Track mouse position in TankScene during water change animation: add onMouseMove handler to Stage, convert to tank-local coords, pass to WaterChangeOverlay; render WaterChangeOverlay in tank group; hide when mouse is outside tank area or window is too small in `src/webview/tank-panel/components/TankScene.tsx`

**Checkpoint**: Pump and hose visual follows mouse during water change animation

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Ensure robustness across all user stories

- [x] T014 Handle feeding mode exclusion: in TankScene, prevent water change startReady when feedingMode.phase !== 'idle'; prevent feeding startTargeting when waterChangeMode.phase !== 'idle' in `src/webview/tank-panel/components/TankScene.tsx`
- [x] T015 Handle state snapshot during animation: in useWaterChangeMode, ensure waterDirtiness/algaeLevel values used for visual rendering are frozen at the snapshot values during animation, not updated from incoming stateUpdate messages; in App.tsx or TankScene, pass snapshotted dirtiness to Tank during animation in `src/webview/tank-panel/hooks/useWaterChangeMode.ts` and `src/webview/tank-panel/components/TankScene.tsx`
- [x] T016 Handle tab visibility: if tab becomes inactive during animation, on resume continue from where the animation left off (existing useVisibilityResume pattern) in `src/webview/tank-panel/components/TankScene.tsx`
- [x] T017 Run `npm test && npm run lint` and fix any type errors or lint issues across all modified files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — can start immediately
- **User Story 1 & 2 (Phase 3)**: Depends on Phase 2 completion
- **User Story 3 (Phase 4)**: Depends on Phase 3 completion (needs waterLevelRatio)
- **User Story 4 (Phase 5)**: Depends on Phase 3 completion (needs animation phases) — **STRETCH GOAL**
- **Polish (Phase 6)**: Depends on Phase 3 & 4 completion

### Within Phases

- Phase 2: T001 → T002, T003 can be parallel after T001
- Phase 3: T004, T005 parallel → T006 → T007 → T008, T009 parallel
- Phase 4: T010 → T011
- Phase 5: T012 (parallel, new file) → T013
- Phase 6: T014, T015 parallel → T016 → T017

### Parallel Opportunities

Within Phase 2:
```
T002 (Tank.tsx) and T003 (ActionBar.tsx) can run in parallel after T001
```

Within Phase 3:
```
T004 and T005 (both in useWaterChangeMode.ts) must be sequential
T008 and T009 (TankScene.tsx and Tank.tsx) can run in parallel after T007
```

---

## Implementation Strategy

### MVP First (User Story 1 & 2 Only)

1. Complete Phase 2: Foundational (T001-T003)
2. Complete Phase 3: User Story 1 & 2 (T004-T009)
3. **STOP and VALIDATE**: Test water change animation end-to-end
4. This delivers the core water change experience

### Incremental Delivery

1. Phase 2 → Foundation ready
2. Phase 3 → Water level + color animation (MVP!) ✓ Issue can be closed
3. Phase 4 → Fish follow water level ✓ Enhanced experience
4. Phase 5 → Pump & hose visual (stretch) ✓ Full experience
5. Phase 6 → Polish & edge cases

---

## Notes

- User Story 1 & 2 are combined into Phase 3 because color blending is inseparable from the water level animation (both happen in the same `updateAnimation` function)
- User Story 4 (pump/hose) is a stretch goal — skip if time constrained
- The `changeWater` message to the extension is sent ONLY on animation completion, not on button press
- During animation, visual rendering uses snapshotted waterDirtiness/algaeLevel values
