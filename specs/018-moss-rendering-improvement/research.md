# Research: 苔の表現の向上

## R1: ドットパターン生成の決定論的手法

**Decision**: シード付き擬似乱数（mulberry32 等の軽量 PRNG）でドット座標を事前生成し、`algaeLevel` に応じてスライスして表示する。

**Rationale**:
- `Math.random()` は非決定論的で毎フレーム結果が変わる
- シード付き PRNG は同じ入力に対して同じ座標列を返す
- mulberry32 は軽量（数行）で外部依存なし
- `algaeLevel` 0-100 に対して最大ドット数を事前計算し、level に応じた個数だけ描画すれば累積方式を自然に実現可能

**Alternatives considered**:
- Canvas パターン fill: react-konva との統合が複雑
- Perlin noise: 過剰な複雑さ、この用途には不要
- 固定グリッド + threshold: 自然な見た目にならない

## R2: react-konva でのドット描画パフォーマンス

**Decision**: `Konva.Shape` の `sceneFunc` で Canvas API を直接使い、一括でドットを描画する。

**Rationale**:
- 個別の `<Circle>` コンポーネントを数百個レンダリングすると React reconciliation のコストが高い
- `sceneFunc` なら1つの Shape 内で `fillRect` / `arc` をループで描画できる
- Konva の Shape はキャッシュ可能で、`algaeLevel` が変わらなければ再描画不要

**Alternatives considered**:
- 個別 `<Rect>` / `<Circle>`: 数百個のノードは重い
- `<Image>` + offscreen canvas: 可能だが `sceneFunc` の方がシンプル
- Group + listening=false: ノード数の問題は解決しない

## R3: 苔レイヤーの描画順序

**Decision**: TankScene.tsx で、Fish の描画後に AlgaeOverlay コンポーネントを配置する。

**Rationale**:
- Konva は描画順序 = z-order なので、後に描画されたものが前面に来る
- 現状 Tank コンポーネント内の Rect として描画されているが、魚の前面に出すにはFish の後に描画する必要がある
- TankScene 内でFish map の後に AlgaeOverlay を配置すれば自然に前面になる

## R4: 既存の algae Rect の除去

**Decision**: Tank.tsx 内の algae strip（Rect, lines 96-105）を削除し、TankScene.tsx に新しい AlgaeOverlay コンポーネントを追加する。

**Rationale**:
- 同じ `algaeLevel` データを2箇所で描画すると混乱する
- 新しい描画はFish より前面に来る必要があるため、Tank コンポーネント内には残せない
