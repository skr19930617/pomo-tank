# Implementation Plan: 水換えアニメーション (Water Change Animation)

**Branch**: `019-water-change-animation` | **Date**: 2026-03-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/019-water-change-animation/spec.md`

## Summary

現在の水換えはボタン押下で即座に状態が変わるが、これを水換えモード（ボタン→水槽クリック→排水→ポーズ→給水）のアニメーション付き体験に置き換える。既存の `useFeedingMode` hook パターン（idle→targeting→animating）を踏襲し、`useWaterChangeMode` hook を新設。Tank コンポーネントの水位と色を動的に変化させ、魚の遊泳範囲もリアルタイムに制限する。

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**: React 19, react-konva 19, Konva 10, @mui/material, @emotion/react, @types/vscode ^1.85.0, esbuild ^0.20.0
**Storage**: VSCode ExtensionContext globalState（本機能では変更なし）
**Testing**: npm test (vitest)
**Target Platform**: VSCode Extension Webview
**Project Type**: VSCode Extension (desktop-app)
**Performance Goals**: 60fps アニメーション（requestAnimationFrame ベース）
**Constraints**: アニメーション中の水質状態更新凍結、14秒間の全アクションボタン無効化
**Scale/Scope**: 単一水槽ビュー、既存のタンクサイズ5種（nano〜xl）に対応

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution はテンプレート状態（未設定）のため、明示的なゲート違反なし。標準的な開発プラクティスに従う。

## Project Structure

### Documentation (this feature)

```text
specs/019-water-change-animation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── webview/tank-panel/
│   ├── hooks/
│   │   └── useWaterChangeMode.ts    # NEW: 水換えモード状態管理 hook
│   ├── components/
│   │   ├── Tank.tsx                  # MODIFY: waterLevel prop で動的水位描画
│   │   ├── TankScene.tsx             # MODIFY: 水換えモード統合、クリックハンドラ
│   │   ├── ActionBar.tsx             # MODIFY: 水換えモード中の無効化制御
│   │   └── WaterChangeOverlay.tsx    # NEW (stretch): ポンプ・ホース描画
│   └── App.tsx                       # MODIFY: useWaterChangeMode 統合
├── game/
│   └── engine.ts                     # MODIFY: 水換え効果の遅延適用対応
├── shared/
│   └── messages.ts                   # MODIFY: changeWater メッセージタイミング変更
tests/
└── (既存テストの修正が必要な場合のみ)
```

**Structure Decision**: 既存の単一プロジェクト構造を維持。`useFeedingMode` と同じパターンで `useWaterChangeMode` hook を追加し、TankScene で統合する。

## Complexity Tracking

該当なし（Constitution 違反なし）
