# Tasks: デバッグ加速時のタイマー表示修正

**Input**: Design documents from `/specs/025-fix-debug-timer-display/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: 既存コードの理解と変更準備

- [x] T001 既存のタイマー関連テストを確認し、テストが通ることを検証する `npm run ci`

---

## Phase 2: Foundational — ゲーム時間追跡インフラ

**Purpose**: GameEngine にゲーム時間追跡のフィールドとヘルパーを追加する。フォーカス・ブレイク両方のインフラを一括で導入する。

**⚠️ CRITICAL**: US1/US2 の作業開始前に完了必須

- [x] T002 `src/game/engine.ts` の `GameEngine` クラスに以下の private フィールドを追加する: `gameElapsedMs: number = 0`, `lastTickClientTs: number = Date.now()`, `breakGameElapsedMs: number = 0`, `breakLastTickClientTs: number = 0`
- [x] T003 `src/game/engine.ts` に以下の2つの private ヘルパーメソッドを追加する:
  - `flushSubTick()`: `if (!this.state.lightOn || this.timerMode === 'break') return;` ガード付き。`const now = Date.now(); this.gameElapsedMs += (now - this.lastTickClientTs) * this.tickMultiplier; this.lastTickClientTs = now;`
  - `flushBreakSubTick()`: `if (!this.state.lightOn || this.timerMode !== 'break') return;` ガード付き。`const now = Date.now(); this.breakGameElapsedMs += (now - this.breakLastTickClientTs) * this.tickMultiplier; this.breakLastTickClientTs = now;`
- [x] T004 `src/game/engine.ts` の `tick()` メソッド内で、`lightOn` チェック後・deterioration 処理前に、timerMode に応じた分岐を追加する: `if (this.timerMode === 'break') { this.breakGameElapsedMs += 60_000; this.breakLastTickClientTs = Date.now(); } else { this.gameElapsedMs += 60_000; this.lastTickClientTs = Date.now(); }`
- [x] T005 `src/game/engine.ts` の `createSnapshot()` メソッドで `timeSinceLastMaintenance` の計算を変更する: `const subTickMs = this.state.lightOn ? (Date.now() - this.lastTickClientTs) * this.tickMultiplier : 0; const timeSinceLastMaintenance = this.gameElapsedMs + subTickMs;`
- [x] T006 `src/game/engine.ts` の `performAction()` メソッドで: (a) 冒頭に `const wallClockElapsed = Date.now() - this.state.player.sessionStartTime` を追加し、ポイント計算の `timeSinceLastMaintenance` ローカル変数をこの壁時計値に置き換える、(b) メソッド末尾で `this.gameElapsedMs = 0; this.lastTickClientTs = Date.now();` をリセット、(c) ブレイク開始時に `this.breakGameElapsedMs = 0; this.breakLastTickClientTs = Date.now();` をリセットする
- [x] T007 `src/game/engine.ts` の `setTickMultiplier()` メソッドで、`this.tickMultiplier = clamped` の前に `this.flushSubTick(); this.flushBreakSubTick();` を呼び出す（ガードにより現在のモードに応じたものだけが実行される。ライトOFF中は両方とも何もしない）
- [x] T008 `src/game/engine.ts` の `toggleLight()` メソッドで: (a) ライトOFF分岐の先頭に `this.flushSubTick(); this.flushBreakSubTick();` を追加しOFF直前のサブティック確定、(b) ライトON分岐で `this.lastTickClientTs = Date.now();` を追加。ブレイクモード中の場合は `this.breakLastTickClientTs = Date.now();` も追加
- [x] T009 `src/game/engine.ts` の `resetState()` メソッドで `this.gameElapsedMs = 0; this.lastTickClientTs = Date.now(); this.breakGameElapsedMs = 0; this.breakLastTickClientTs = 0; this.timerMode = 'focus'; this.breakStartTimestamp = null; this.breakPausedRemainingMs = null;` をリセットする（全状態を初期化）
- [x] T010 `src/game/engine.ts` の `checkBreakExpiry()` メソッドで、ブレイク終了時（既存の sessionStartTime リセットの隣）に `this.gameElapsedMs = 0; this.lastTickClientTs = Date.now();` を追加してフォーカスタイマーを0から再開する

**Checkpoint**: ゲーム時間追跡インフラが完成し、全遷移でサブティック分が正しく保持される

---

## Phase 3: User Story 1 — フォーカスタイマー加速表示修正 (Priority: P1) 🎯 MVP

**Goal**: 50x等の加速時にフォーカスモードのタイマー分表示が0にリセットされないようにする

**Independent Test**: デバッグパネルで50xに設定し、タイマーが00:00から連続的に正しく増加することを確認する

### Implementation for User Story 1

- [x] T011 [US1] エンジンのゲーム時間計算のユニットテストを `tests/` 配下に追加する。GameEngine をインスタンス化し、`createSnapshot().session.timeSinceLastMaintenance` を検証する形式。以下のケースを個別テストとして実装:
  - (a) 1xで `tick()` 後に `timeSinceLastMaintenance ≈ 60000ms`
  - (b) 50xで `tick()` 後にも `≈ 60000ms` — サーバーティック到着時に表示が巻き戻らないことを検証
  - (c) `performAction()` 後に `timeSinceLastMaintenance ≈ 0` にリセットされること
  - (d) `setTickMultiplier()` 呼び出し前後で `timeSinceLastMaintenance` の差分が1秒（1000ms）以内であること（FR-004）
  - (e) ブレイク終了後（`checkBreakExpiry()` 経由）にフォーカスタイマーが0からリスタートすること
  - (f) ライトOFF中に `timeSinceLastMaintenance` が増加しないこと、ON復帰後にOFF前の値から継続すること
  - (g) `formatTimer()` の 3599秒→3600秒（59:59→1:00:00）ロールオーバーが正しいこと（`HudOverlay.tsx` から関数をエクスポートするか、同じロジックをテスト内で再現）

**Checkpoint**: フォーカスモードのタイマーが加速時に正確に表示される

---

## Phase 4: User Story 2 — ブレイクタイマー加速表示修正 (Priority: P2)

**Goal**: ブレイクモードのカウントダウンも加速時に正しく動作するようにする

**Independent Test**: ブレイクモードに入り、50xでカウントダウンが正しく減少することを確認する

### Implementation for User Story 2

- [x] T012 [US2] `src/game/engine.ts` の `getBreakRemainingMs()` メソッドを修正: `breakStartTimestamp` / `breakPausedRemainingMs` を廃止し、ライトON時は `this.breakGameElapsedMs + (Date.now() - this.breakLastTickClientTs) * this.tickMultiplier`、ライトOFF時は `this.breakGameElapsedMs` で計算する。`return Math.max(0, this.breakMinutes * 60 * 1000 - gameElapsed);` に置き換える
- [x] T013 [US2] `src/game/engine.ts` の `toggleLight()` から `breakPausedRemainingMs` 関連のコード（ポーズ保存、再開計算）を削除する（T008 で追加した新しいブレイク ts 更新がこれを代替）
- [x] T014 [US2] `src/game/engine.ts` から `breakStartTimestamp` と `breakPausedRemainingMs` フィールド宣言および `performAction()` 内の旧ブレイク初期化コード（`this.breakStartTimestamp = now; this.breakPausedRemainingMs = null;`）を削除する
- [x] T015 [US2] ブレイクタイマーのユニットテストを `tests/` 配下に追加する。`createSnapshot().session.breakRemainingMs` を検証する形式。以下のケースを個別テストとして実装:
  - (a) 50xで `tick()` 後に `breakRemainingMs` が正しく減少すること（≈ breakMinutes*60000 - 60000）
  - (b) 十分なtick後に `breakRemainingMs` が0になり負にならないこと
  - (c) ライトOFF→ON を跨いだ際に、OFF前の残り時間から連続して再開すること
  - (d) `setTickMultiplier()` 前後で残り時間の差分が1秒以内であること

**Checkpoint**: ブレイクモードのタイマーも加速時に正確に表示される

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 全体検証

- [x] T016 `npm run ci` で全テスト・lint・ビルドが通ることを確認する

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Phase 1 — フォーカス・ブレイク両方のインフラを一括導入
- **US1 (Phase 3)**: Depends on Phase 2
- **US2 (Phase 4)**: Depends on Phase 2（US1と並列可）
- **Polish (Phase 5)**: Depends on Phase 3 + Phase 4

### Key Design Decisions

- `useTimer.ts` は変更不要
- `flushSubTick()` / `flushBreakSubTick()` は lightOn + timerMode ガード付き（OFF中やモード不一致時は何もしない）
- ブレイク側のフィールドとヘルパーも Phase 2 で一括導入（Phase 4 で参照するため）
- `applyOfflineCatchUp()` ではゲーム時間を累積しない（永続化しないため、リロード後は常に0から開始）
- `resetState()` はフォーカス・ブレイク両方の全ゲーム時間状態をリセットする
- ポイント計算と breakWindow 判定は壁時計時間のまま維持
- テストは public な `createSnapshot()` の戻り値を検証する形式

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup → `npm run ci` 確認
2. Phase 2: Foundational → ゲーム時間追跡インフラ一括導入
3. Phase 3: US1 → フォーカスタイマーテスト
4. **STOP and VALIDATE**: 50x でフォーカスタイマーが正しく動作することを確認
5. Phase 4: US2 → ブレイクタイマー修正 + テスト
6. Phase 5: Polish → 全体検証
