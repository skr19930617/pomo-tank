# Implementation Plan: 型安全性の改善とWebviewリファクタリング

**Branch**: `003-type-safety-refactor` | **Date**: 2026-03-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-type-safety-refactor/spec.md`

## Summary

コードベース全体の型安全性を改善し、50箇所以上のハードコード文字列を列挙型/定数に統一。WebviewをバニラJSからReact + react-konvaに移行し、Extension↔Webview通信を判別共用体で型安全化する。esbuildを3エントリポイント（extension + 2 webview）に拡張。

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode有効)
**Primary Dependencies**: @types/vscode ^1.85.0, esbuild ^0.20.0, React 18+, react-dom, react-konva, konva
**Storage**: VSCode ExtensionContext globalState (既存)
**Testing**: vitest ^1.2.0
**Target Platform**: VSCode Extension (^1.85.0) — extension: Node, webview: browser
**Project Type**: VSCode Extension (desktop-app)
**Performance Goals**: Canvas描画60fps維持
**Constraints**: Webview CSP準拠、esbuild単一ツールチェーン、バンドルサイズ最小化
**Scale/Scope**: 単一ユーザー、TypeScriptファイル約15個、Webview 2つ

## Constitution Check

Constitution is a template with no defined principles — no gates to evaluate. PASS.

## Project Structure

### Documentation (this feature)

```text
specs/003-type-safety-refactor/
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
├── shared/
│   ├── types.ts              # NEW — 全ID列挙型、GameState/Snapshot型、共通定数
│   └── messages.ts           # NEW — Extension↔Webview判別共用体メッセージ型
├── game/
│   ├── state.ts              # MODIFY — 型をshared/types.tsからre-export、ID列挙型移動
│   ├── engine.ts             # MODIFY — ActionType列挙型使用、toggleLight型安全化
│   ├── deterioration.ts      # MODIFY — 型import先変更
│   ├── health.ts             # MODIFY — 型import先変更
│   ├── points.ts             # NO CHANGE
│   └── store.ts              # MODIFY — StoreItemId型使用、nullチェック追加
├── providers/
│   ├── tank-panel.ts         # MODIFY — メッセージ型使用、React HTML生成
│   └── companion-view.ts     # MODIFY — メッセージ型使用、React HTML生成
├── ui/
│   └── status-bar.ts         # MODIFY — HealthState列挙型import修正
├── webview/
│   ├── tank-panel/
│   │   ├── index.tsx          # NEW — Reactエントリポイント
│   │   ├── App.tsx            # NEW — メインAppコンポーネント
│   │   ├── components/
│   │   │   ├── TankScene.tsx  # NEW — react-konva水槽シーン全体
│   │   │   ├── Wall.tsx       # NEW — 壁背景
│   │   │   ├── Desk.tsx       # NEW — 机
│   │   │   ├── Light.tsx      # NEW — ライトバー
│   │   │   ├── Tank.tsx       # NEW — 水槽ガラス+水+砂+藻
│   │   │   ├── Fish.tsx       # NEW — 魚個体コンポーネント
│   │   │   ├── StatsBar.tsx   # NEW — ステータスバー
│   │   │   ├── Actions.tsx    # NEW — アクションボタン群
│   │   │   └── Store.tsx      # NEW — ストアパネル
│   │   └── hooks/
│   │       ├── useGameState.ts    # NEW — postMessage受信→React state
│   │       └── useFishAnimation.ts # NEW — 魚アニメーションhook
│   └── companion/
│       ├── index.tsx          # NEW — Reactエントリポイント
│       └── App.tsx            # NEW — TankSceneを小さく再利用
├── extension.ts              # MODIFY — HealthState import修正

media/webview/
├── tank-detail/
│   ├── main.js           # DELETE — React版に置き換え
│   ├── style.css          # KEEP — CSS変数はReact版でも利用
│   └── index.html         # (inline in tank-panel.ts)
└── companion/
    ├── main.js            # DELETE — React版に置き換え
    └── style.css          # KEEP

dist/
├── extension.js           # 既存 — extension bundle
├── webview-tank-panel.js  # NEW — React webview bundle
└── webview-companion.js   # NEW — React webview bundle

esbuild.mjs               # MODIFY — 3エントリポイント化
tsconfig.json              # MODIFY — src/webview/ include追加、jsx設定追加
```

**Structure Decision**: 既存のsrc/構造を維持しつつ、src/shared/（型共有）とsrc/webview/（React UI）を追加。esbuildで3つのバンドルを生成。

## Complexity Tracking

No constitution violations — table not needed.
