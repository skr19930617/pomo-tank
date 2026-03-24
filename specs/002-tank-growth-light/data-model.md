# Data Model: 水槽の成長システムとライトスイッチ機能

**Date**: 2026-03-24 | **Plan**: [plan.md](plan.md)

## Entity Changes

### GameState (既存 — 変更)

| Field | Type | Change | Description |
|-------|------|--------|-------------|
| `lightOn` | `boolean` | **NEW** | ライトのオン・オフ状態。デフォルト: `true` |
| `lightOffTimestamp` | `number \| null` | **NEW** | ライトオフ時刻（Unix ms）。オン時は`null` |

### Tank (既存 — 変更なし)

`sizeTier: TankSizeTier` は既存。描画サイズとのマッピングは新定数で管理。

### GameStateSnapshot (既存 — 変更)

| Field | Type | Change | Description |
|-------|------|--------|-------------|
| `tank.sizeTier` | `TankSizeTier` | existing | 既存（Webview側で描画サイズを決定するために使用） |
| `lightOn` | `boolean` | **NEW** | Webviewへライト状態を通知 |

### PlayerProfile (既存 — 変更なし)

`lastTickTimestamp`と`sessionStartTime`は既存。ライトオフ/オン復帰時にタイムスタンプ調整を行うが、フィールド追加は不要。

## New Constants

### TANK_RENDER_SIZES (新規定数)

`state.ts`に追加。タンクサイズ→Canvas描画寸法のマッピング。

```
TANK_RENDER_SIZES: Record<TankSizeTier, { width: number, height: number }>
  Nano:   { width: 200, height: 150 }
  Small:  { width: 260, height: 195 }
  Medium: { width: 320, height: 240 }
  Large:  { width: 370, height: 278 }
  XL:     { width: 400, height: 300 }
```

### DESK_HEIGHT (新規定数)

机の天板の描画高さ。Canvas実効高さ = TANK_HEIGHT + DESK_HEIGHT。

```
DESK_HEIGHT: 30  (pixels)
```

### LIGHT_BAR_HEIGHT (新規定数)

ライトバーの描画高さ。Canvas上部の予約領域。

```
LIGHT_BAR_HEIGHT: 20  (pixels)
```

## State Transitions

### ライト状態遷移

```
[Light ON] ---(ユーザーがスイッチクリック)---> [Light OFF]
  - lightOn = false
  - lightOffTimestamp = Date.now()
  - 劣化tick処理スキップ開始
  - メンテナンス間隔タイマー凍結
  - 魚速度50%低下
  - 暗いオーバーレイ表示

[Light OFF] ---(ユーザーがスイッチクリック)---> [Light ON]
  - lightOn = true
  - lightOffDuration = Date.now() - lightOffTimestamp
  - lastTickTimestamp += lightOffDuration
  - lightOffTimestamp = null
  - 劣化tick処理再開
  - メンテナンス間隔タイマー再開（オフ前の経過時間から）
  - 魚速度通常復帰
  - オーバーレイ除去
```

### VSCode再起動時

```
[Any State] ---(VSCode再起動)---> [Light ON]
  - lightOn = true (デフォルト)
  - lightOffTimestamp = null
```

## Validation Rules

- `lightOn`は`boolean`のみ（null不可）
- `lightOffTimestamp`はライトオフ中のみ非null。ライトオン中はnull
- `TANK_RENDER_SIZES`の全サイズでアスペクト比4:3を維持
- Canvas描画時、魚の移動境界はCanvasサイズから動的計算: x∈[20, width-20], y∈[LIGHT_BAR_HEIGHT+20, height-DESK_HEIGHT-20]
