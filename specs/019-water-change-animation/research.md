# Research: 水換えアニメーション

## R1: アニメーション状態管理パターン

**Decision**: `useFeedingMode` hook と同じパターン（module-level mutable state + React state for phase tracking）を採用

**Rationale**:
- 既存の `useFeedingMode` が `idle → targeting → animating` の3フェーズモデルを確立済み
- module-level mutable state で `requestAnimationFrame` ループ内のGC圧を回避
- React state は phase 変更時のみ更新し、アニメーション tick は `setTick` でバッチ再レンダリング
- 水換えモードも同じ `idle → ready → draining → paused → filling → idle` のフェーズモデルで実装可能

**Alternatives considered**:
- React state のみで管理: 毎フレーム setState が発生しGC圧が高い → 却下
- Konva の Tween API: React との統合が煩雑、既存パターンと不整合 → 却下

## R2: 水位・色の動的描画

**Decision**: Tank コンポーネントに `waterLevelRatio` (0-1) と `waterColorOverride` (string | null) props を追加

**Rationale**:
- 現在の Tank.tsx は `waterDirtiness` から色を算出し、水位は固定 `0.9` (innerH の 90%)
- `waterLevelRatio` を外部から渡すことで、アニメーション中の水位を制御可能
- `waterColorOverride` で色ブレンド結果を直接指定可能
- 非アニメーション時はデフォルト値（ratio=0.9, override=null）でそのまま動作

**Alternatives considered**:
- Tank 内部にアニメーション状態を持つ: 単一責任の原則に反する → 却下
- 別の WaterLayer コンポーネントを作成: Tank.tsx が小さいので分離メリットなし → 却下

## R3: ease-in-out 実装

**Decision**: 標準的な CSS ease-in-out に相当する cubic-bezier 相当の関数を自前で実装

**Rationale**:
- 既存コードベースに `easeOutQuad` 関数がある（useFeedingMode.ts）
- ease-in-out は `t < 0.5 ? 2*t*t : -1+(4-2*t)*t` で簡潔に実装可能
- 外部ライブラリ不要で軽量

**Alternatives considered**:
- Konva Tween: React 再レンダリングとの同期が困難 → 却下
- CSS animation: Konva Canvas 上では使えない → 不可

## R4: 魚の遊泳範囲制限

**Decision**: `useFishAnimation` に渡す `FishBounds` の `height` と `top` をアニメーション中の水位に連動して動的変更

**Rationale**:
- 現在 `fishBounds` は `useMemo` で tankId 変更時のみ再計算（App.tsx:42-55）
- 水換え中は水位が変わるため、fishBounds を水位比率に応じて動的に再計算する必要がある
- `useFishAnimation` は既に `bounds` パラメータの変更に対応（useCallback の deps に含まれている）
- 既存の `SWIM_LAYER_RANGES` による swim zone 制限は bounds 内で計算されるため、bounds を縮小すれば自動的に魚の移動範囲が制限される

**Alternatives considered**:
- useFishAnimation 内部に水位パラメータを追加: 関心の分離が崩れる → 却下
- クリッピングマスクで視覚的に隠す: 魚が水面の上を泳ぎ続けるため不自然 → 却下

## R5: 状態更新凍結メカニズム

**Decision**: `changeWater` メッセージの送信タイミングをアニメーション完了時に遅延させる（feedFish と同じパターン）

**Rationale**:
- 現在の水換えボタンは押下時に即座に `sendMessage({ type: 'changeWater' })` を送信
- アニメーション完了時に送信するよう変更すれば、extension 側の engine.ts で水質状態が変更されるのはアニメーション後になる
- ただし、アニメーション中の tick による waterDirtiness/algaeLevel の増加を防ぐため、webview 側で「アニメーション中」であることを表示に反映する必要がある
- アニメーション中は webview 側で表示用の waterDirtiness をスナップショットして使い、extension からの stateUpdate は受け取るが水質値だけ上書きしないアプローチが最もクリーン

**Alternatives considered**:
- Extension 側に `waterChangeAnimating` フラグを追加して tick を止める: webview の表示都合で backend を変更するのは避けたい → 却下
- メッセージ契約に新メッセージタイプを追加: `changeWater` の送信タイミングを変えるだけで十分 → 過剰

## R6: エサやりモードとの排他制御

**Decision**: `feedingMode.phase` と `waterChangeMode.phase` を相互参照し、一方が idle でない場合は他方の開始を抑制

**Rationale**:
- 両モードとも ActionBar のボタンから開始される
- ActionBar の `isDisabled` ロジックに水換えモードフェーズを追加するだけで実装可能
- 既に `feedingPhase === 'animating'` で water/algae ボタンを無効化するロジックがある（ActionBar.tsx:200）

**Alternatives considered**:
- グローバルな「モード」状態を追加: 現時点では2つのモードだけなので過剰 → 却下
