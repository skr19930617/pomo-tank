# Data Model: インタラクティブ餌やりアニメーション

**Date**: 2026-03-26

## Entities

### FeedingMode（餌やりモード状態）

| Field | Type | Description |
|-------|------|-------------|
| phase | `'idle' \| 'targeting' \| 'animating'` | 現在のモードフェーズ |
| dropX | `number \| null` | 餌投下X座標（論理座標系、水面位置） |
| dropY | `number \| null` | 餌投下Y座標（水面のY座標、自動算出） |
| animStartFrame | `number \| null` | アニメーション開始時のフレームカウント |

**State Transitions**:
```
idle ─[feedボタン押下]→ targeting
targeting ─[水中クリック]→ animating
targeting ─[ESC/水槽外クリック]→ idle
animating ─[全餌粒消滅]→ idle（+ feedFishメッセージ送信）
```

### FoodParticle（餌粒パーティクル）

| Field | Type | Description |
|-------|------|-------------|
| id | `number` | パーティクルID（0-indexed） |
| x | `number` | 現在のX座標（投下位置からの微小なオフセット付き） |
| y | `number` | 現在のY座標（落下に伴い増加） |
| opacity | `number` | 透明度（1.0→0.0へフェード） |
| vy | `number` | 落下速度（px/frame、個体差あり） |
| alive | `boolean` | 生存フラグ（opacity ≤ 0 で false） |

**Lifecycle**: 生成（水面位置） → 落下（vy加算） → フェードアウト（opacity減少） → 消滅（alive=false）

**Generation Parameters**:
- 数: 5〜8個
- X散布: dropX ± 3px のランダム範囲
- 落下速度: 0.15〜0.25 px/frame（個体差）
- フェード開始: 生成後90フレーム（~1.5秒）
- フェード速度: 0.01/frame（~100フレームで完全消滅）
- 最大生存: ~190フレーム（~3.2秒）

### FoodCan（餌缶アニメーション）

| Field | Type | Description |
|-------|------|-------------|
| x | `number` | 表示X座標（dropXの上部） |
| y | `number` | 表示Y座標（水面より上、タンクフレーム付近） |
| rotation | `number` | 傾き角度（0° → 45° へアニメーション） |
| visible | `boolean` | 表示フラグ |

**Animation Sequence**:
- 出現（0フレーム目）: rotation=0°, visible=true
- 傾き（0-30フレーム）: rotation 0° → 45° （イージング付き）
- 維持（30-60フレーム）: rotation=45° のまま保持
- 消滅（60フレーム目）: visible=false

### AttractionTarget（魚の集合ターゲット）

| Field | Type | Description |
|-------|------|-------------|
| x | `number` | 生存中の餌粒群の重心X座標 |
| y | `number` | 生存中の餌粒群の重心Y座標 |
| active | `boolean` | 有効フラグ（餌粒が1つ以上生存中=true） |
| startFrame | `number` | ターゲット有効化開始フレーム |

**Update Rule**: 毎フレーム、alive=trueの餌粒の平均位置を再計算

### PersonalityReactionDelay（性格別反応遅延）

| Personality | DelayFrames | 実時間（@60fps） |
|-------------|-------------|-------------------|
| active | 0 | 即反応 |
| social | 30 | ~0.5秒 |
| calm | 60 | ~1.0秒 |
| timid | 90 | ~1.5秒 |

**Application**: `currentFrame - attractionTarget.startFrame >= delayFrames` の場合のみ餌引力を適用

## Relationships

```
FeedingMode 1 ─── 0..1 FoodCan
FeedingMode 1 ─── 0..* FoodParticle
FoodParticle * ─── 1 AttractionTarget (centroid)
AttractionTarget 1 ─── * Fish (via boids force injection)
Fish.personality ─── PersonalityReactionDelay (lookup)
```

## Integration with Existing Models

- **GameStateSnapshot.tank.hungerLevel**: 餌やり効果はアニメーション完了時（phase: animating→idle遷移時）に `feedFish` メッセージ送信で反映
- **FishAnimState (useFishAnimation)**: `dx/dy` 速度に餌引力ベクトルを追加注入
- **AnimatedFishData**: 変更なし（x, y, dx, displaySizeはそのまま）
- **ActionBar**: feedボタンのclickハンドラを変更（メッセージ送信→モード遷移コールバック）
