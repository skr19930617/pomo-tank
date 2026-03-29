# Data Model: デバッグ加速時のタイマー表示修正

## Entity Changes

### GameEngine (既存エンティティの変更)

| Field | Type | New? | Description |
|-------|------|------|-------------|
| gameElapsedMs | number | Yes | フォーカスモードの累積ゲーム時間（ミリ秒） |
| lastTickClientTs | number | Yes | 最後のティック時の壁時計タイムスタンプ |
| breakGameElapsedMs | number | Yes | ブレイクモードの累積ゲーム時間（ミリ秒） |
| breakLastTickClientTs | number | Yes | ブレイクモード最後のティック時のタイムスタンプ |

### GameStateSnapshot.session (既存、型変更なし)

| Field | Type | Change | Description |
|-------|------|--------|-------------|
| timeSinceLastMaintenance | number | 意味変更 | 壁時計 → ゲーム経過時間（ms） |
| breakRemainingMs | number | 意味変更 | 壁時計ベース → ゲーム時間ベースの残り時間 |

## State Transitions

### フォーカスタイマー

```
performAction() → gameElapsedMs = 0, lastTickClientTs = now
  ↓
tick() → gameElapsedMs += 60_000, lastTickClientTs = now
  ↓
createSnapshot() → timeSinceLastMaintenance = gameElapsedMs + (now - lastTickClientTs) * multiplier
```

### ブレイクタイマー

```
performAction() (break開始) → breakGameElapsedMs = 0, breakLastTickClientTs = now
  ↓
tick() (break中) → breakGameElapsedMs += 60_000, breakLastTickClientTs = now
  ↓
getBreakRemainingMs() → max(0, breakMinutes * 60000 - (breakGameElapsedMs + (now - breakLastTickClientTs) * multiplier))
```

### ポーズ/再開

```
toggleLight() (off) → breakPausedRemainingMs を保存（既存）
toggleLight() (on) → lastTickClientTs = now, breakLastTickClientTs = now（壁時計ギャップをスキップ）
```
