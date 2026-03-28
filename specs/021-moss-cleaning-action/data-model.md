# Data Model: 苔掃除アクション化

## Entities

### MossCleaningState（新規: useMossCleaningMode内部状態）

| Field | Type | Description |
|-------|------|-------------|
| phase | `'idle' \| 'active' \| 'completing'` | モードフェーズ |
| isDragging | `boolean` | マウスドラッグ中か |
| lastMousePos | `{ x: number, y: number } \| null` | 前フレームのマウス位置（距離計算用） |
| dragStartTime | `number \| null` | 現在のドラッグ開始タイムスタンプ |

**フェーズ遷移**:
```
idle → active: 苔掃除ボタン押下（algaeLevel >= 10）
active → completing: algaeLevel が 0 に到達
completing → idle: キラキラエフェクト完了（500-1000ms後）
active → idle: キャンセル（ボタン再押下）
```

### Tank（既存: 変更なし）

| Field | Type | Description |
|-------|------|-------------|
| algaeLevel | `number` (float) | 0-100, 既にfloat互換。変更不要 |

### 新規メッセージ型

**Webview → Extension**:

| Type | Payload | Description |
|------|---------|-------------|
| `mossCleaningStart` | なし | 苔掃除モード開始通知 |
| `mossCleaningProgress` | `{ reduction: number }` | 苔レベル低下量（バッチ送信） |
| `mossCleaningComplete` | なし | 苔掃除完了（苔レベル0到達） |
| `mossCleaningCancel` | なし | 苔掃除キャンセル |

**Extension → Webview**:
- 既存の`stateUpdate`メッセージで苔レベルの変更を反映（追加メッセージ不要）

### ActionBar ボタン状態拡張

| State | algaeボタン表示 |
|-------|----------------|
| 通常 (algae >= 10) | 有効、通常色 `#2a4a3a` |
| 通常 (algae < 10) | 無効 |
| 苔掃除モード active | アクティブ色 `#44cc66` でハイライト |
| 水換え draining/filling | 無効 |

## 計算モデル定数

| Constant | Value | Description |
|----------|-------|-------------|
| DISTANCE_COEFFICIENT | 0.05 | 1px移動あたりの苔低下量 |
| TIME_COEFFICIENT | 0.5 | ドラッグ中の毎秒低下量 |
| CLICK_FIXED_REDUCTION | 0.5 | クリックのみ時の固定低下量 |
| COMPLETION_EFFECT_DURATION | 800 | キラキラエフェクト表示時間(ms) |
| ALGAE_CLEAN_THRESHOLD | 10 | 苔掃除ボタン有効化閾値 |
