# Implementation Plan: デバッグ加速時のタイマー表示修正

**Branch**: `025-fix-debug-timer-display` | **Date**: 2026-03-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/025-fix-debug-timer-display/spec.md`

## Summary

デバッグモードで速度倍率（50x等）を設定するとタイマーの分表示が0に戻るバグを修正する。根本原因はサーバーが壁時計時間を送信し、クライアントがそれに倍率を適用して補間するが、サーバーティック到着時に壁時計ベースの値にリセットされることで表示が巻き戻ること。修正方針: サーバー（GameEngine）にゲーム経過時間の累積追跡を追加し、スナップショットでゲーム時間を提供する。クライアント（useTimer）は変更不要 — サーバーがゲーム時間を提供すれば既存の補間ロジックで正しく動作する。

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**: React 19, react-konva 19, Konva 10, @types/vscode ^1.85.0, esbuild 0.20.0
**Storage**: VSCode ExtensionContext globalState (既存)
**Testing**: Vitest 1.2.0
**Target Platform**: VSCode Extension (WebView)
**Project Type**: VSCode Extension
**Performance Goals**: タイマー表示がrequestAnimationFrameで60fps更新
**Constraints**: 既存のゲームロジック（deterioration, points, health）に影響を与えない
**Scale/Scope**: 変更ファイル3〜4個、テスト追加2〜3個

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution は未設定（テンプレートのまま）のため、ゲートチェック不要。

## Project Structure

### Documentation (this feature)

```text
specs/025-fix-debug-timer-display/
├── plan.md              # This file
├── research.md          # Root cause analysis
├── data-model.md        # Data model changes
└── tasks.md             # Implementation tasks
```

### Source Code (repository root)

```text
src/
├── game/
│   └── engine.ts         # GameEngine: ゲーム時間追跡の追加（主要変更ファイル）
├── webview/tank-panel/
│   ├── hooks/
│   │   └── useTimer.ts   # (変更なし — サーバーが正しいゲーム時間を提供すれば既存ロジックで動作)
│   └── components/
│       └── TankScene.tsx  # (変更なし、参照のみ)
tests/
└── engine-timer.test.ts   # エンジンのゲーム時間計算テスト追加
```

**Structure Decision**: 既存のファイル構造に変更なし。修正は既存ファイルの内部ロジック変更のみ。

## Design

### 変更 1: GameEngine にゲーム時間追跡を追加

**現状**: `timeSinceLastMaintenance = Date.now() - sessionStartTime`（壁時計）
**修正後**: ティックごとにゲーム時間を累積し、スナップショットでは `gameElapsedMs + clientDelta * multiplier` を提供

具体的な変更:
- `GameEngine` に `private gameElapsedMs: number = 0` フィールドを追加
- `private lastTickClientTs: number = Date.now()` フィールドを追加
- `tick()` 内で `gameElapsedMs += 60_000`（1ティック = 1分のゲーム時間）を累積し、**直後に** `lastTickClientTs = Date.now()` を更新する（再アンカー。これにより createSnapshot() のサブティック補間が次のティックからの経過のみを計算する）
- `createSnapshot()` で:
  ```
  timeSinceLastMaintenance = this.gameElapsedMs + (Date.now() - this.lastTickClientTs) * this.tickMultiplier
  ```
- `performAction()` で `gameElapsedMs = 0`, `lastTickClientTs = Date.now()` にリセット（セッション開始）

#### サブティック確定パターン（P1修正: 非ティック遷移での経過時間消失防止）

`toggleLight()`, `setTickMultiplier()` など、ティック以外のタイミングでタイムスタンプを更新する場合、**先にサブティック分を確定してからタイムスタンプを更新する**パターンを適用する:

```typescript
// flushSubTick helper — フォーカスモード＋ライトON時のみ実行
private flushSubTick(): void {
  if (!this.state.lightOn || this.timerMode === 'break') return; // ガード
  const now = Date.now();
  this.gameElapsedMs += (now - this.lastTickClientTs) * this.tickMultiplier;
  this.lastTickClientTs = now;
}

// flushBreakSubTick helper — ブレイクモード＋ライトON時のみ実行
private flushBreakSubTick(): void {
  if (!this.state.lightOn || this.timerMode !== 'break') return; // ガード
  const now = Date.now();
  this.breakGameElapsedMs += (now - this.breakLastTickClientTs) * this.tickMultiplier;
  this.breakLastTickClientTs = now;
}
```

**ガードの意図**:
- ライトOFF中に呼ばれた場合: 何もしない（OFF中の壁時計経過をゲーム時間に変換してはいけない）
- フォーカスモード中に `flushBreakSubTick()` が呼ばれた場合: 何もしない（モード不一致）
- ブレイクモード中に `flushSubTick()` が呼ばれた場合: 何もしない（フォーカス時間にブレイク経過を混入させない）

適用箇所:
- `setTickMultiplier()`: `flushSubTick()` + `flushBreakSubTick()` を呼ぶ（現在のモードに応じてどちらかのみ実行される）
- `toggleLight()` OFF時: `flushSubTick()` + `flushBreakSubTick()` を呼ぶ（OFF直前のサブティック確定）
- `checkBreakExpiry()` でブレイク終了検出時: フォーカスの `gameElapsedMs = 0`, `lastTickClientTs = now` にリセット

#### ライトOFF/ON（ポーズ/再開）時の停止仕様（P2修正）

ライトOFF中はゲーム時間が進行しないことを保証する:

1. **ライトOFF時（`toggleLight()` off）**:
   - `flushSubTick()` を呼び、OFF直前までのサブティック分を `gameElapsedMs` に確定する
   - ブレイク中の場合は `flushBreakSubTick()` も呼ぶ
   - OFF以降、`tick()` は `lightOn` チェックで早期リターンするため、ゲーム時間は自然に停止する

2. **ライトON時（`toggleLight()` on）**:
   - `lastTickClientTs = Date.now()` を設定（OFF中の壁時計経過をスキップ）
   - ブレイク中の場合は `breakLastTickClientTs = Date.now()` も設定

3. **`createSnapshot()` 内の補間**:
   - `lightOn === false` の場合は補間分 `(now - lastTickClientTs) * multiplier` を **加算しない**:
     ```typescript
     const subTickMs = this.state.lightOn ? (Date.now() - this.lastTickClientTs) * this.tickMultiplier : 0;
     timeSinceLastMaintenance = this.gameElapsedMs + subTickMs;
     ```
   - これにより OFF 中は確定済みの `gameElapsedMs` のみが返される

### 変更 2: ブレイクタイマーのゲーム時間対応

**現状**: `getBreakRemainingMs()` が壁時計で計算（`breakStartTimestamp` と `breakPausedRemainingMs` を使用）
**修正後**: ブレイクもゲーム時間で追跡。既存の `breakStartTimestamp` / `breakPausedRemainingMs` を廃止し、`breakGameElapsedMs` で一元管理する。

- `private breakGameElapsedMs: number = 0` を追加
- `private breakLastTickClientTs: number = 0` を追加
- `breakStartTimestamp` と `breakPausedRemainingMs` を **廃止**
- `tick()` でブレイク中も `breakGameElapsedMs += 60_000` を累積
- `getBreakRemainingMs()` を修正:
  ```
  if (this.timerMode !== 'break') return 0;
  const gameElapsed = this.breakGameElapsedMs + (Date.now() - this.breakLastTickClientTs) * this.tickMultiplier;
  return Math.max(0, this.breakMinutes * 60 * 1000 - gameElapsed);
  ```
- `toggleLight()` のポーズ/再開: ブレイク中のオフ時に `flushBreakSubTick()` を呼んで確定、オン復帰時に `breakLastTickClientTs = Date.now()` を更新（ポーズ中の壁時計経過をスキップ）
- `performAction()` でブレイク開始時: `breakGameElapsedMs = 0`, `breakLastTickClientTs = Date.now()`

```typescript
// flushBreakSubTick helper
private flushBreakSubTick(): void {
  const now = Date.now();
  this.breakGameElapsedMs += (now - this.breakLastTickClientTs) * this.tickMultiplier;
  this.breakLastTickClientTs = now;
}
```

### 変更 3: useTimer は変更不要

クライアント側の `useTimer` は変更不要。理由:
- サーバーティック間（50xで1.2秒間）のクライアント補間では、1.2秒の壁時計経過を50倍して60秒分のゲーム時間として補間する必要がある
- サーバーティック到着時に `serverMs` がゲーム時間（60秒進んだ値）になるため、リセット後の表示が連続する
- 既存の `elapsed = (Date.now() - base.clientTs) * tickMultiplier` はそのまま正しく機能する

### 変更 4: 時間の権威ソースの整理（P3修正）

**設計方針**: 本修正はデバッグ表示のバグ修正であり、ゲームロジックの時間体系は変更しない。

時間の用途ごとに権威ソースを明確に分離する:

| 用途 | 権威ソース | 変更 |
|------|-----------|------|
| タイマー表示（スナップショット `timeSinceLastMaintenance`） | ゲーム時間（`gameElapsedMs` + 補間） | **変更あり** |
| ポイント計算（`calculatePoints()`） | 壁時計時間（`sessionStartTime`） | 変更なし |
| ブレイクウィンドウ判定（`isInBreakWindow()`） | 壁時計時間（`sessionStartTime`） | 変更なし |
| ブレイク残り表示（スナップショット `breakRemainingMs`） | ゲーム時間（`breakGameElapsedMs` + 補間） | **変更あり** |

**理由**: デバッグ加速はUIの動作確認用途であり、ポイント計算やブレイクウィンドウ判定は実時間ベースで動作すべき。50xで25分表示されていてもポイント計算は実時間30秒分であるのが正しい挙動。

- スナップショットの `timeSinceLastMaintenance` はゲーム時間に変更（表示用）
- エンジン内部の `getTimeSinceLastMaintenance()` と `isInBreakWindow()` は壁時計時間のまま維持（ゲームロジック用）
- `performAction()` 内のポイント計算も壁時計時間のまま

### 変更 5: ブレイク終了→フォーカス再開時のリセット（P2修正）

`checkBreakExpiry()` でブレイクが終了した場合:
- 既存: `sessionStartTime = Date.now()` でフォーカスタイマーをリセット
- 追加: `gameElapsedMs = 0`, `lastTickClientTs = Date.now()` でゲーム時間もリセット
- ブレイク中の tick で `gameElapsedMs` が累積されてしまうのを防ぐため、ブレイクモード中は `gameElapsedMs` への累積をスキップする

具体的な `tick()` 内のロジック:
```typescript
if (this.timerMode === 'break') {
  this.breakGameElapsedMs += 60_000;
  this.breakLastTickClientTs = Date.now();
} else {
  this.gameElapsedMs += 60_000;
  this.lastTickClientTs = Date.now();
}
```

### 変更 6: 初期化経路の明確化（P4/P5修正）

`gameElapsedMs` と `lastTickClientTs` はエンジンの private フィールドであり、**永続化しない**。

**永続化しない理由**: 既存の `sessionStartTime` による壁時計計算でも、拡張リロード時に `sessionStartTime` を `now` にリセットしており（`applyOfflineCatchUp()` の最後で実行）、タイマー表示は0付近から再開される。新フィールドもこれと同じ挙動を維持する。

初期化経路:

| タイミング | gameElapsedMs | lastTickClientTs | break側 | 挙動 |
|-----------|--------------|-----------------|---------|------|
| コンストラクタ | 0 | Date.now() | 0, 0 | 新規セッション。タイマー0から開始 |
| `applyOfflineCatchUp()` | **変更なし（0のまま）** | Date.now() | 0, 0 | オフライン復帰時は sessionStartTime が now にリセットされるため、ゲーム時間も0から再開。既存挙動と一致 |
| `performAction()` | 0 にリセット | Date.now() | 0, Date.now() | 新セッション開始（ブレイク開始時） |
| `checkBreakExpiry()` | 0 にリセット | Date.now() | — | ブレイク終了、フォーカス再開 |
| `resetState()` | 0 にリセット | Date.now() | 0, 0 | デバッグリセット（timerMode='focus'も復元） |

**`applyOfflineCatchUp()` でゲーム時間を累積しない理由**: この関数は deterioration や health の catchup を行うが、最後に `sessionStartTime = now` をリセットする。新フィールドを永続化しないため、リロード後の初期状態は常に `gameElapsedMs = 0`。catchup でゲーム時間を累積しても `sessionStartTime` リセットとの整合性が崩れるため、累積せず0のまま維持する。

## Complexity Tracking

N/A — Constitution violations なし
