# Implementation Plan: 苔の表現の向上

**Branch**: `018-moss-rendering-improvement` | **Date**: 2026-03-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/018-moss-rendering-improvement/spec.md`

## Summary

水槽の苔（algae）描画を底部の矩形ストリップから、水槽全面に散らばるドットパターンに変更する。`algaeLevel` (0-100) に応じてドット密度が5段階で増加し、魚の前面に描画されることで苔が増えると魚が見えにくくなる自然な表現を実現する。

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**: React 19, react-konva 19, Konva 10
**Storage**: N/A（描画のみの変更、ゲーム状態は既存のまま）
**Testing**: npm test (既存テストが通ること)
**Target Platform**: VSCode Extension Webview
**Project Type**: VSCode Extension (desktop-app)
**Performance Goals**: 60fps 維持（苔ドット描画がフレームレートに影響しないこと）
**Constraints**: ドット数最大 ~850 個を1つの Konva Shape で描画
**Scale/Scope**: 変更ファイル 3 件（新規1 + 既存変更2）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution はプレースホルダーのため、制約なし。PASS。

## Project Structure

### Documentation (this feature)

```text
specs/018-moss-rendering-improvement/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── webview/
│   └── tank-panel/
│       └── components/
│           ├── AlgaeOverlay.tsx  # NEW: ドットパターン苔オーバーレイ
│           ├── Tank.tsx          # MODIFY: 既存 algae Rect 削除
│           └── TankScene.tsx     # MODIFY: AlgaeOverlay を Fish 後に配置
tests/
```

**Structure Decision**: 既存の webview/tank-panel/components 構造に従い、新規コンポーネント AlgaeOverlay.tsx を追加する。

## Design

### AlgaeOverlay コンポーネント

**ドット生成アルゴリズム**:
1. mulberry32 PRNG をシード値（固定定数）で初期化
2. 最大ドット数（MAX_DOTS = 850）分の座標・サイズを事前生成
3. 各ドットに threshold (1-100) を割り当て: `threshold = ceil(index / MAX_DOTS * 100)`
4. 描画時、`threshold <= algaeLevel` のドットのみ描画

**opacity 補間**:
- `algaeLevel` 1-20: opacity 0.3
- `algaeLevel` 21-40: opacity 0.4
- `algaeLevel` 41-60: opacity 0.5
- `algaeLevel` 61-80: opacity 0.6
- `algaeLevel` 81-100: opacity 0.7
- 段階間は線形補間

**パフォーマンス対策**:
- `Konva.Shape` の `sceneFunc` で Canvas API 直接描画（React ノード数削減）
- ドット座標は `useMemo` でキャッシュ（tankWidth/tankHeight 依存）
- `algaeLevel` が変わらなければ再描画なし

### TankScene 変更

```
  {/* Fish */}
  {state.fish.map(...)}

  {/* Algae overlay — after fish = in front of fish */}
  <AlgaeOverlay
    algaeLevel={state.tank.algaeLevel}
    tankWidth={rawTankW}
    tankHeight={rawTankH}
  />
```

### Tank.tsx 変更

既存の algae Rect（lines 96-105）を削除する。`algaeLevel` prop は不要になるが、他で使う可能性を考慮して prop 定義は残してもよい（不要なら削除）。

## Complexity Tracking

特になし。変更は小規模で、新規抽象化は AlgaeOverlay コンポーネントのみ。
