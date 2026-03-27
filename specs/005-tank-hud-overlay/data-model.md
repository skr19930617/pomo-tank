# Data Model: 水槽HUDオーバーレイ

**Feature**: 005-tank-hud-overlay
**Date**: 2026-03-25

## Existing Entities (unchanged)

### GameStateSnapshot
既存のスナップショット構造は変更不要。HUDが必要とするデータは全て既存フィールドに含まれている:
- `session.timeSinceLastMaintenance` → タイマー表示
- `player.pomoBalance` → ポモ残高表示
- `player.currentStreak` → ストリーク表示（フルパネルのみ）
- `tank.waterDirtiness` → 水質表示（フルパネルのみ）
- `tank.algaeLevel` → 苔レベル表示（フルパネルのみ）
- `fish[].hungerLevel` → 平均空腹度表示（フルパネルのみ）
- `lightOn` → ライト状態・タイマー一時停止判定

### WebviewToExtensionMessage
既存のメッセージ型は変更不要。コンパニオンビューから送信するメッセージは全て既存型でカバー:
- `feedFish`, `changeWater`, `cleanAlgae`, `toggleLight`, `openTank`

### ExtensionToWebviewMessage
既存のレスポンス型は変更不要:
- `actionResult` → ボタンフィードバックのトリガー
- `stateUpdate` → HUD表示の更新

## New Entities

### PixelFont (定数データ)
ドット絵調フォントのビットマップ定義。各文字を5×7ピクセルのグリッドで表現。

**文字セット**: `0-9`, `:`, `+`, `K`
**属性**:
- `charWidth`: 5px (文字幅)
- `charHeight`: 7px (文字高さ)
- `charGap`: 1px (文字間スペース)
- `bitmap`: Record<string, number[][]> — 各文字の0/1ビットマップ

### HudState (UIローカル状態)
HUDコンポーネントのローカル状態。永続化不要。

**属性**:
- `displayTime`: number — 表示用経過時間（秒、クライアントサイド補間）
- `isOvertime`: boolean — 20分超過フラグ
- `isPaused`: boolean — ライトオフによるタイマー一時停止
- `feedbackButtons`: Map<string, number> — ボタンID → フィードバック開始タイムスタンプ（アニメーション制御）
- `pomoAnimation`: { amount: number, startTime: number } | null — 浮遊アニメーション状態

### ActionButtonConfig (定数データ)
各アクションボタンの定義。

**属性**:
- `id`: string — `'feed'` | `'water'` | `'algae'` | `'light'` | `'expand'`
- `icon`: number[][] — ドット絵アイコンのビットマップ (8×8 または 10×10)
- `messageType`: string — 対応するWebviewToExtensionMessageのtype
- `color`: string — 通常時のカラー
- `activeColor`: string — フィードバック時のカラー

## State Transitions

### タイマー表示状態
```
Normal (白色)
  ↓ [経過時間 >= 20分]
Overtime (赤色)
  ↓ [メンテナンスアクション実行]
Normal (白色, 00:00リセット)

Normal/Overtime
  ↓ [ライトOFF]
Paused (一時停止表示)
  ↓ [ライトON]
Normal/Overtime (継続)
```

### ボタンフィードバック状態
```
Idle (通常色)
  ↓ [クリック + actionResult success]
Active (発光色, 0.5秒)
  ↓ [0.5秒経過]
Idle (通常色)
```

### ポモ獲得アニメーション
```
Hidden
  ↓ [actionResult success + pomoBalance増加]
Animating (+N浮遊テキスト, 1秒)
  ↓ [1秒経過]
Hidden
```
