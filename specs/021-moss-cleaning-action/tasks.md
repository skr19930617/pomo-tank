# Tasks: 苔掃除アクション化

**Input**: Design documents from `/specs/021-moss-cleaning-action/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested — test tasks omitted.

**Organization**: Tasks grouped by user story. P1 is MVP, P2/P3 are fast-follow.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: メッセージ型定義と共有インフラ

- [x] T001 [P] Add moss cleaning message types (`mossCleaningStart`, `mossCleaningProgress`, `mossCleaningComplete`, `mossCleaningCancel`) to `src/shared/messages.ts`
- [x] T002 [P] Add moss cleaning constants (`DISTANCE_COEFFICIENT`, `TIME_COEFFICIENT`, `CLICK_FIXED_REDUCTION`, `COMPLETION_EFFECT_DURATION`, `ALGAE_CLEAN_THRESHOLD`) to a new file `src/webview/tank-panel/constants/mossCleaningConstants.ts` or inline in the hook

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extension側ハンドラ — モード開始/進捗/完了/キャンセルのメッセージ処理

**⚠️ CRITICAL**: US1のwebview側実装はこのフェーズ完了後に開始

- [x] T003 Add moss cleaning message handlers in `src/providers/tank-panel.ts` — handle `mossCleaningStart` (freeze water quality), `mossCleaningProgress` (reduce algaeLevel by payload.reduction, clamp to 0), `mossCleaningComplete` (unfreeze, set algaeLevel=0), `mossCleaningCancel` (unfreeze, keep current algaeLevel)
- [x] T004 Update `src/game/engine.ts` — modify `performAction('cleanAlgae')` to no longer instantly set algaeLevel to 0. Instead, add a `reduceAlgae(amount: number)` method that decrements algaeLevel by the given float amount (clamped to 0). Keep `setWaterQualityFrozen` pattern for moss cleaning.

**Checkpoint**: Extension側が苔掃除メッセージを処理できる状態

---

## Phase 3: User Story 1 — 苔掃除モードで水槽を擦って苔を除去する (Priority: P1) 🎯 MVP

**Goal**: ドラッグ操作で苔レベルを徐々に低下させ、0到達で自動終了する苔掃除モード

**Independent Test**: 苔レベル≥10で苔掃除ボタン押下→モード突入→水槽上でドラッグ→苔レベル減少→0で自動終了を確認

### Implementation for User Story 1

- [x] T005 [US1] Create `src/webview/tank-panel/hooks/useMossCleaningMode.ts` — implement phase state machine (`idle` → `active` → `completing` → `idle`), mutable module-level state (following `useWaterChangeMode.ts` pattern), mousedown/mousemove/mouseup/mouseleave handlers, distance-based + time-correction reduction model, click-only fixed reduction, and completion sparkle effect timer
- [x] T006 [US1] Integrate moss cleaning mode into `src/webview/tank-panel/components/TankScene.tsx` — add Stage-level mouse event handlers (onMouseDown, onMouseMove, onMouseUp, onMouseLeave) that delegate to useMossCleaningMode when phase is 'active', suppress all other tank interactions (fish click, feeding targeting) during moss cleaning mode, add sparkle effect rendering during 'completing' phase
- [x] T007 [US1] Update `src/webview/tank-panel/components/ActionBar.tsx` — modify `getButtonState` to disable all other buttons during moss cleaning 'active'/'completing' phase, highlight algae button with active color (`#44cc66`) during moss cleaning mode, wire algae button click to toggle moss cleaning mode (start if idle, cancel if active), cancel water change 'ready' phase if moss cleaning is started and vice versa
- [x] T008 [US1] Wire message flow in TankScene — send `mossCleaningStart` when entering active phase, send `mossCleaningProgress` with accumulated reduction on each animation frame (batch to avoid message flooding), send `mossCleaningComplete` when algaeLevel reaches 0, send `mossCleaningCancel` when user cancels

**Checkpoint**: P1 MVP完了 — ドラッグ苔掃除が動作し、排他制御・キャンセル・自動終了が正しく機能

---

## Phase 4: User Story 2 — スポンジカーソル表示 (Priority: P2, fast-follow)

**Goal**: 苔掃除モード中にマウスカーソルをドット絵スポンジに変更

**Independent Test**: 苔掃除モード突入時にカーソルがスポンジに変わり、終了時にデフォルトに戻ることを確認

### Implementation for User Story 2

- [x] T009 [P] [US2] Create sponge cursor pixel art as a data URI or inline bitmap in `src/webview/tank-panel/constants/mossCleaningConstants.ts` — 8x8 or 16x16 pixel art matching existing icon style
- [x] T010 [US2] Update cursor logic in `src/webview/tank-panel/components/TankScene.tsx` — set CSS cursor to sponge data URI when moss cleaning phase is 'active', restore default cursor on mode exit (idle/completing→idle)

**Checkpoint**: P2完了 — スポンジカーソルが正しく表示・復元

---

## Phase 5: User Story 3 — 擦り操作の視覚フィードバック (Priority: P3, fast-follow)

**Goal**: ドラッグ中に泡エフェクトを表示し、掃除の実感を高める

**Independent Test**: ドラッグ中に泡エフェクトが表示され、ドラッグ停止後にフェードアウトすることを確認

### Implementation for User Story 3

- [x] T011 [US3] Add bubble effect rendering to `src/webview/tank-panel/hooks/useMossCleaningMode.ts` or a new component — generate small circle particles at drag position, manage particle lifetime (spawn on drag, fade out over 300-500ms on stop), limit max concurrent particles for performance

**Checkpoint**: P3完了 — 泡エフェクトが正しく表示・フェードアウト

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T012 Run `npm test && npm run lint` and fix any issues
- [x] T013 Manual end-to-end validation: test all scenarios from spec acceptance criteria (mode entry, drag reduction, completion sparkle, cancel, mode exclusivity with water change, ESC key cancel if applicable)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — T001, T002 can run in parallel
- **Foundational (Phase 2)**: Depends on T001 (message types) — T003, T004 can run in parallel after T001
- **US1 (Phase 3)**: Depends on Phase 2 completion — T005→T006→T007→T008 sequential
- **US2 (Phase 4)**: Depends on Phase 3 (US1) — T009 parallel with T005-T008, T010 after T006
- **US3 (Phase 5)**: Depends on Phase 3 (US1) — T011 after T005
- **Polish (Phase 6)**: Depends on all desired stories

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational — no other story dependencies
- **US2 (P2)**: Depends on US1 (needs TankScene cursor integration point)
- **US3 (P3)**: Depends on US1 (needs drag event infrastructure)

### Parallel Opportunities

- T001 + T002 (different files)
- T003 + T004 (different files, after T001)
- T009 can start before US1 is complete (asset creation, no code dependencies)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T004)
3. Complete Phase 3: User Story 1 (T005-T008)
4. **STOP and VALIDATE**: Test drag cleaning end-to-end
5. Merge if ready — P2/P3 are fast-follow

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. US1 → Drag cleaning works → **MVP mergeable**
3. US2 → Sponge cursor added
4. US3 → Bubble effects added
5. Each story adds polish without breaking prior functionality

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Coefficient values (DISTANCE_COEFFICIENT etc.) are tuning targets — adjust after manual testing
- Follow `useWaterChangeMode.ts` pattern closely for consistency
- Message batching in T008 is important to avoid flooding the extension host
