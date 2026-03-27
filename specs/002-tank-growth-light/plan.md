# Implementation Plan: 水槽の成長システムとライトスイッチ機能

**Branch**: `002-tank-growth-light` | **Date**: 2026-03-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-tank-growth-light/spec.md`

## Summary

水槽の描画サイズをタンクサイズ（Nano〜XL）に連動させて段階的に拡大し、机・ライトの装飾要素を追加する。ライトスイッチによる劣化タイマー一時停止機能を実装し、離席時のゲーム体験を改善する。

## Technical Context

**Language/Version**: TypeScript 5.3+
**Primary Dependencies**: @types/vscode ^1.85.0, esbuild ^0.20.0
**Storage**: VSCode ExtensionContext globalState (既存)
**Testing**: vitest ^1.2.0
**Target Platform**: VSCode Extension (^1.85.0)
**Project Type**: VSCode Extension (desktop-app)
**Performance Goals**: Canvas描画60fps維持、即座のUI応答
**Constraints**: Webview内Canvas描画、postMessageベースの状態同期
**Scale/Scope**: 単一ユーザー、1水槽、最大18匹の魚

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is a template with no defined principles — no gates to evaluate. PASS.

## Project Structure

### Documentation (this feature)

```text
specs/002-tank-growth-light/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── game/
│   ├── state.ts          # GameState, TankSizeTier, new: TANK_RENDER_SIZES, lightOn field
│   ├── engine.ts         # Tick guard for light state, light toggle action
│   ├── deterioration.ts  # No changes (guarded by engine)
│   ├── health.ts         # No changes (guarded by engine)
│   └── points.ts         # Maintenance timer pause support
├── providers/
│   ├── tank-panel.ts     # Dynamic canvas sizing, light toggle message handler
│   └── companion-view.ts # Dynamic canvas sizing, light state reflection
└── ui/
    └── status-bar.ts     # Light state indicator

media/webview/
├── tank-detail/
│   ├── main.js           # Dynamic rendering: desk, light, dark overlay, size-based canvas
│   ├── style.css         # Layout adjustments for variable tank size
│   └── index.html        # (inline in tank-panel.ts)
└── companion/
    └── main.js           # Size-based rendering, light state reflection

tests/
└── unit/
    ├── tank-render-size.test.ts  # Canvas dimension mapping tests
    ├── light-toggle.test.ts      # Light state & deterioration pause tests
    └── timer-pause.test.ts       # Maintenance timer pause/resume tests
```

**Structure Decision**: 既存の単一プロジェクト構造を維持。新ファイル作成不要、既存ファイルの修正のみ。

## Complexity Tracking

No constitution violations — table not needed.
