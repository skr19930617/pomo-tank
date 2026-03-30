# Research: デバッグ加速時のタイマー表示バグ

## Root Cause Analysis

### 問題の仕組み

タイマー表示はサーバー（GameEngine）とクライアント（useTimer）の2層で計算される。

**サーバー側** (`src/game/engine.ts`):
- `createSnapshot()` で `timeSinceLastMaintenance = Date.now() - sessionStartTime` を計算
- これは **壁時計時間**（wall-clock time）であり、tickMultiplier の影響を受けない
- 50x 加速時はティック間隔が `60_000 / 50 = 1200ms` に短縮されるが、`timeSinceLastMaintenance` は依然として壁時計ベース

**クライアント側** (`src/webview/tank-panel/hooks/useTimer.ts`):
- サーバーから受け取った `timeSinceLastMaintenance` を基準値として保持
- クライアント側の経過時間に `tickMultiplier` を掛けて補間:
  ```
  elapsed = (Date.now() - base.clientTs) * tickMultiplier
  sec = Math.floor((base.serverMs + elapsed) / 1000)
  ```
- サーバーから新しい値が届くと基準値をリセット

### バグのメカニズム

50x 加速時の動作:

1. サーバーティック到着: `serverMs = 1200ms` (壁時計), `clientTs = Date.now()`
2. クライアント補間: 1.2秒後に `elapsed = 1200ms * 50 = 60000ms` → 表示: `01:00`
3. 次のサーバーティック到着: `serverMs = 2400ms` (壁時計), 基準リセット
4. リセット直後: `elapsed = 0`, `displaySeconds = floor(2400 / 1000) = 2` → 表示: `00:02`

**分が01:00から00:02に戻る** — これがバグの正体。

### 解決策

**Decision**: サーバー側でゲーム時間を追跡し、クライアントには加速済みの時間を渡す

**Rationale**:
- サーバーが権威ある時間源であるべき
- クライアント側で倍率を二重適用する現在の設計がバグの原因
- サーバーがゲーム時間を提供すれば、クライアントは倍率を適用せずに補間できる

**Alternatives considered**:
1. クライアントで倍率適用を停止 → サーバーティック間隔(1.2s)しか解像度がなく、スムーズな加速表示ができない
2. `timeSinceLastMaintenance` にスナップショット時点で倍率を掛ける → 倍率変更時にジャンプが発生する
3. エンジンに `gameElapsedMs` を追跡させる → 正確だが変更範囲が大きい

**Selected approach**: エンジンに `gameElapsedMs` を追跡させるが、最小限の変更で実現する。具体的には:
- `sessionStartTime` の代わりに `gameElapsedMs` を累積的に追跡
- ティックごとに `60_000` (1分のゲーム時間) を加算
- `createSnapshot()` でクライアント側の補間用に `gameElapsedMs + (Date.now() - lastTickTs) * tickMultiplier` を送信
- クライアント側は `tickMultiplier` を掛けずに補間

## Break Timer

ブレイクタイマーの `getBreakRemainingMs()` も同様の問題がある:
```
const elapsed = Date.now() - this.breakStartTimestamp;
const remaining = this.breakMinutes * 60 * 1000 - elapsed;
```
壁時計ベースのため、加速が反映されない。修正が必要。
