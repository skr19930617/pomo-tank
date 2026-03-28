# Research: 苔掃除アクション化

## R1: 苔レベル低下の計算モデル

**Decision**: 距離ベース＋時間補正のハイブリッドモデル

**Rationale**:
- 主軸: ドラッグ移動距離（ピクセル）に比例して苔レベルを低下
- 補助: ドラッグ中（mousedown状態）は16msごとに微量の時間ベース低下を加算
- クリックのみ: 固定値の微量低下（距離0でも反応）
- 目安: 苔100→0で中程度のドラッグ速度で約5秒

**計算式**:
```
distanceReduction = dragDistance * DISTANCE_COEFFICIENT
timeReduction = (ドラッグ中) ? deltaTime * TIME_COEFFICIENT : 0
clickReduction = (クリックのみ) ? CLICK_FIXED_REDUCTION : 0

totalReduction = distanceReduction + timeReduction + clickReduction
newAlgaeLevel = max(0, currentAlgaeLevel - totalReduction)
```

**チューニングパラメータ（初期値）**:
- `DISTANCE_COEFFICIENT`: 0.05（1ピクセル移動で苔0.05低下）
  - 水槽幅約400px × 往復10回 ≈ 8000px移動 → 400低下（苔100→0に十分）
  - 実際は5秒間の中速ドラッグで約2000-4000px移動を想定
- `TIME_COEFFICIENT`: 0.5/秒（ドラッグ中は毎秒0.5低下）
  - 5秒で2.5低下 — 距離の補助的な役割
- `CLICK_FIXED_REDUCTION`: 0.5（1クリックで苔0.5低下）

**Alternatives considered**:
- 純粋時間ベース: ドラッグの「擦る感覚」が失われる → 却下
- 純粋距離ベース: 操作が遅いユーザーに不親切 → 時間補正を追加

## R2: モードの排他制御パターン

**Decision**: 既存ActionBarの`getButtonState`関数内で排他制御する（水換えモードと同パターン）

**Rationale**:
- 既存パターン: ActionBar.tsx:202-218で水換えフェーズに応じてボタンの有効/無効を制御
- 苔掃除モードでも同様に、`mossCleaningPhase`が`'active'`の間は他ボタンを無効化
- 水換え`'ready'`フェーズ中に苔掃除ボタンを押した場合: 水換えモードを先にキャンセル
- 苔掃除`'active'`中に水換えボタンを押した場合: 苔掃除モードを先にキャンセル

**Alternatives considered**:
- 中央集権的なモードマネージャー: 過剰な抽象化 → 却下（2モードだけなので不要）

## R3: react-konvaでのドラッグイベントハンドリング

**Decision**: Konva Stageレベルでmousedown/mousemove/mouseupイベントをハンドル

**Rationale**:
- 既存パターン: TankScene.tsxでStageのonClickを使用（lines 198-238）
- 苔掃除モードでは同様にStage上で`onMouseDown`, `onMouseMove`, `onMouseUp`を追加
- マウス座標からタンク内判定は既存ロジック（`inTankX`, `inTankY`）を再利用
- ドラッグ距離はフレーム間のマウス位置差分から計算
- `onMouseLeave`でドラッグ状態をリセット（水槽外に出た場合）

**Alternatives considered**:
- HTML overlayでのイベント: react-konvaとの座標変換が複雑 → 却下
- Konva Rectオーバーレイ: 不要な描画要素が増える → Stageレベルで十分

## R4: 苔レベルのfloat化

**Decision**: `Tank.algaeLevel`を内部的にfloatで管理、表示はMath.ceil

**Rationale**:
- 現在`algaeLevel`は0-100のnumber型（state.ts:88）で、特に整数制約はない
- deterioration.ts:69で`Math.min(100, ...)`でクランプしているが、floatを許容している
- 既にfloat互換: 追加の型変更は不要
- UI表示のみMath.ceilで整数丸め

**Alternatives considered**:
- 整数管理: 距離ベース低下の粒度が粗くなる → 却下

## R5: キラキラエフェクト（苔レベル0到達時）

**Decision**: Konva上で短時間のパーティクルアニメーション（星形スプライト数個）

**Rationale**:
- 水換えアニメーション（useWaterChangeMode.ts）と同様のrAFベースアニメーション
- 苔レベル0到達時に3-5個の小さな星/キラキラパーティクルを水槽内にランダム配置
- 500ms-1000msでフェードアウト → 完了後にモード自動終了
- AlgaeOverlayまたはTankScene内で描画

**Alternatives considered**:
- CSS animation: Konvaキャンバス内では使えない → 却下
- 長時間エフェクト: ユーザー操作をブロックする → 短時間に限定
