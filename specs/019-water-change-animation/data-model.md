# Data Model: 水換えアニメーション

## Entities

### WaterChangePhase (union type)

水換えモードのフェーズ遷移を表す文字列リテラル型。

```
'idle' → 'ready' → 'draining' → 'paused' → 'filling' → 'idle'
                ↘ 'idle' (cancel)
```

| Value | Description |
|-------|-------------|
| `idle` | 通常状態。水換えモードではない |
| `ready` | 水換えモード待機中。水槽クリック待ち |
| `draining` | 排水アニメーション中（6.0秒） |
| `paused` | 排水完了後のポーズ（2.0秒） |
| `filling` | 給水アニメーション中（6.0秒） |

### WaterChangeAnimState (mutable internal state)

module-level で管理される可変アニメーション状態。React のレンダリングサイクル外で直接変更される。

| Field | Type | Description |
|-------|------|-------------|
| `phase` | `WaterChangePhase` | 現在のフェーズ |
| `startFrame` | `number` | アニメーション開始フレーム番号 |
| `snapshotDirtiness` | `number` | アニメーション開始時の waterDirtiness 値（色計算用） |
| `snapshotAlgae` | `number` | アニメーション開始時の algaeLevel 値 |

### UseWaterChangeModeResult (hook return type)

React コンポーネントに公開される hook の戻り値インターフェース。

| Field | Type | Description |
|-------|------|-------------|
| `phase` | `WaterChangePhase` | 現在のフェーズ |
| `waterLevelRatio` | `number` | 現在の水位比率（0.0〜0.9、通常時は 0.9） |
| `waterColorOverride` | `string \| null` | 色ブレンド結果（null = 通常計算に委任） |
| `startReady` | `() => void` | ready フェーズへ遷移 |
| `cancelReady` | `() => void` | ready → idle キャンセル |
| `startDraining` | `() => void` | 水槽クリック時: draining 開始 |
| `updateAnimation` | `(frameCount: number) => boolean` | フレーム更新。true = 完了 |
| `forceReset` | `() => void` | 強制リセット |

## State Transitions

```
idle ──[水換えボタン]──→ ready
ready ──[水槽クリック]──→ draining (startFrame記録, snapshot取得)
ready ──[再度ボタン/外クリック]──→ idle
draining ──[6.0s経過]──→ paused
paused ──[2.0s経過]──→ filling
filling ──[6.0s経過]──→ idle (changeWater メッセージ送信)
```

## Animation Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `DRAIN_DURATION_S` | 6.0 | 排水フェーズ時間（秒） |
| `PAUSE_DURATION_S` | 2.0 | ポーズフェーズ時間（秒） |
| `FILL_DURATION_S` | 6.0 | 給水フェーズ時間（秒） |
| `MIN_WATER_RATIO` | 0.30 | 最低水位比率（通常水位の30%） |
| `NORMAL_WATER_RATIO` | 0.90 | 通常水位比率（innerH の 90%） |

## Computed Values (per frame)

### waterLevelRatio

- `idle` / `ready`: `NORMAL_WATER_RATIO` (0.9)
- `draining`: `NORMAL_WATER_RATIO → NORMAL_WATER_RATIO * MIN_WATER_RATIO` (0.9 → 0.27) with ease-in-out
- `paused`: `NORMAL_WATER_RATIO * MIN_WATER_RATIO` (0.27)
- `filling`: `NORMAL_WATER_RATIO * MIN_WATER_RATIO → NORMAL_WATER_RATIO` (0.27 → 0.9) with ease-in-out

### waterColorOverride

- `idle` / `ready` / `draining` / `paused`: `null` (既存の waterDirtiness → 色計算を使用)
- `filling`: スナップショット dirtiness の色 → (dirtiness - 50) の色へ線形補間

### fishBounds adjustment

- `idle` / `ready`: 通常の bounds（frame=3, sand=8, waterRatio=0.9）
- アニメーション中: `bounds.height` を `waterLevelRatio / NORMAL_WATER_RATIO` で縮小

## Props Changes

### Tank component

追加 props:
- `waterLevelRatio?: number` (default: 0.9)
- `waterColorOverride?: string | null` (default: null)

### TankScene component

追加 props:
- `waterChangeMode: UseWaterChangeModeResult`

### ActionBar component

追加 props:
- `waterChangePhase?: WaterChangePhase` (default: 'idle')
