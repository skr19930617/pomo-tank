# Research: 水槽HUDオーバーレイ

**Feature**: 005-tank-hud-overlay
**Date**: 2026-03-25

## R1: ドット絵フォントのKonvaレンダリング方式

**Decision**: Konva `<Rect>` でピクセル単位に文字を描画するカスタムコンポーネント (`PixelText`)

**Rationale**: 既存のTankScene内コンポーネント（Light, Tank, Fish等）は全てKonva Shape要素で描画しており、2xスケーリングでドット絵調を実現している。同じ方式でフォントを描画すれば:
- 既存のピクセルスケーリング（S=2）をそのまま活用できる
- テキストが水槽シーンと統一されたビジュアルになる
- Webフォントの読み込み遅延やアンチエイリアス問題を回避できる

**Alternatives considered**:
- Konva `<Text>` + ピクセルフォント: Konvaのテキストレンダリングはアンチエイリアスがかかり、ドット絵調にならない
- HTML overlayでWebフォント: StatsBarと同じHTML方式だが、Konvaキャンバスとの座標統合が困難で、ドット絵調の統一感が損なわれる
- ビットマップスプライトシート: 有効だが、外部アセット管理が必要。今回はシンプルな数字・記号のみなのでRect描画で十分

## R2: タイマーのリアルタイム更新方式

**Decision**: カスタムフック `useTimer` で `requestAnimationFrame` ベースの毎秒更新を実装

**Rationale**: 既存のstate更新はゲームティック（60秒間隔）で行われるが、タイマーは1秒精度が必要。`state.session.timeSinceLastMaintenance` はstateUpdate時点のスナップショット値なので、クライアントサイドで補間する:
- stateUpdateの `timeSinceLastMaintenance` を基準値として保持
- `Date.now()` との差分で毎秒更新
- stateUpdateを受信するたびに基準値をリセット（ドリフト補正）

**Alternatives considered**:
- ゲームティック間隔を1秒に短縮: エンジン全体に影響し、不要な計算負荷が増加
- `setInterval(1000)`: タブ非アクティブ時に精度が落ちるが、VSCodeウェブビューでは許容範囲。ただしuseFishAnimationがRAFを使っているのでRAFに統合する方が一貫性がある

## R3: コンパニオンビューのアクションメッセージハンドリング

**Decision**: 既存の `companion-view.ts` プロバイダーに全アクションメッセージ（feedFish, changeWater, cleanAlgae, toggleLight）のハンドリングを追加

**Rationale**: 現在のcompanion-view.tsは `'ready'` と `'openTank'` のみ処理している。tank-panel.tsのメッセージハンドリングパターンをそのまま踏襲し、GameEngineのメソッドを呼び出す。メッセージ型は `WebviewToExtensionMessage` として既に定義済みなので、新規型定義は不要。

**Alternatives considered**:
- 共通メッセージハンドラーの抽出: 将来的には有効だが、現時点では2箇所（tank-panel, companion-view）のみでコード量も少ないため、DRY化のコストに見合わない

## R4: HUDオーバーレイの配置とレイアウト

**Decision**: TankSceneのKonva Layer内に、水槽シーン上部（y=0〜HUD_HEIGHT）にHUDバーを描画。アクションボタンはシーン下部（desk領域の上）に配置。

**Rationale**:
- HUDは半透明背景のバーとして最前面（Konva描画順で最後）に追加
- 座標系は既存のsceneWidth/sceneHeightに基づくため、コンパニオンビュー（220×180）とフルパネル（480×380）の両方で自動的にスケーリングされる
- アクションボタンは水槽の外（desk上部エリア）に配置し、水槽内の魚やアルゴリズムと干渉しない

**Layout (logical pixels)**:
- HUD Bar: y=0, height=16, full width
  - Timer: left-aligned (x=4)
  - Coin + Balance: right-aligned (x=sceneWidth-4, right anchor)
- Action Bar: y=sceneHeight-DESK_HEIGHT, height=DESK_HEIGHT
  - 5 buttons (Feed, Water, Algae, Light, Expand) evenly spaced

## R5: アクションフィードバックとポモアニメーション

**Decision**: ボタン発光（色変化0.5秒）＋ポモ獲得テキストの浮遊アニメーション（1秒）

**Rationale**:
- ボタンフィードバック: 押下時に色を明るく変化させ、0.5秒で元に戻すトゥイーン。Konva Rectの`fill`プロパティを状態管理で切り替える
- ポモ獲得アニメーション: `+N` テキストがコイン表示付近から上方に浮遊しながらフェードアウト。PixelTextコンポーネントのy座標とopacityをRAFで更新

**Alternatives considered**:
- Konva Tween API: 利用可能だが、React状態管理との統合が複雑。useState + RAFの方がReact wayに合致

## R6: フルパネルのStatsBar置換戦略

**Decision**: StatsBarを完全に削除し、HudOverlayをTankScene内に統合。Actionsも同様にActionBarに置換。

**Rationale**:
- StatsBarの情報（hunger%, water%, algae%, pomo, streak, timer）のうち、HUDに統合するのはtimer + pomo
- 残りのステータス（hunger, water, algae, streak）はフルパネルのHUDでは追加行または拡張エリアで表示
- コンパニオンビューではスペース制約のためtimer + pomoのみ表示
- HudOverlayコンポーネントに `compact` propを持たせ、コンパニオン（compact=true: timer+pomo only）とフルパネル（compact=false: 全情報表示）を出し分ける
