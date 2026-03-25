# Implementation Plan: 水槽HUDオーバーレイ

**Branch**: `005-tank-hud-overlay` | **Date**: 2026-03-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-tank-hud-overlay/spec.md`

## Summary

水槽シーン上部にドット絵調のHUDオーバーレイ（タイマー＋ポモコイン残高）を追加し、コンパニオンビューに直接操作用のアクションボタンを配置する。既存StatsBarをHUDオーバーレイに置き換えてビジュアルを統一する。コンパニオンビューの「クリックでパネルを開く」挙動を廃止し、ドット絵調の拡大ボタンに置き換える。

技術アプローチ: HUDオーバーレイはKonvaコンポーネントとしてTankScene内に描画し、2xピクセルスケーリングを活用してドット絵調を実現する。アクションボタンもKonvaで統一し、コンパニオンビュープロバイダーにアクションメッセージハンドリングを追加する。

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**: React 18, react-konva, konva, @types/vscode ^1.85.0
**Storage**: VSCode ExtensionContext globalState (既存)
**Testing**: npm test (既存テストスイート)
**Target Platform**: VSCode Extension (webview)
**Project Type**: VSCode Extension (desktop-app)
**Performance Goals**: タイマー1秒精度更新、60fps Konvaレンダリング維持
**Constraints**: コンパニオンビュー 220×180px、2xピクセルスケール、既存メッセージプロトコル互換
**Scale/Scope**: 2つのwebview（コンパニオン＋フルパネル）、新規Konvaコンポーネント5-6個

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is unfilled template — no active gates defined. Proceeding without constraints.

**Post-Phase 1 re-check**: No violations. Design follows existing patterns (Konva components, message protocol, React hooks).

## Project Structure

### Documentation (this feature)

```text
specs/005-tank-hud-overlay/
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
│   ├── types.ts                    # HUD定数追加 (HUD_HEIGHT, POMO_THRESHOLD等)
│   └── messages.ts                 # 既存メッセージ型（変更不要）
├── providers/
│   └── companion-view.ts           # アクションメッセージハンドリング追加
└── webview/
    ├── tank-panel/
    │   ├── App.tsx                  # StatsBar → HudOverlay置換、Actions更新
    │   └── components/
    │       ├── TankScene.tsx        # HudOverlay・ActionBar統合
    │       ├── StatsBar.tsx         # 削除対象（HudOverlayに置換）
    │       ├── Actions.tsx          # 削除対象（ActionBarに置換）
    │       ├── HudOverlay.tsx       # 【新規】ドット絵調HUD (タイマー＋コイン)
    │       ├── ActionBar.tsx        # 【新規】ドット絵調アクションボタン群
    │       ├── PixelText.tsx        # 【新規】ドット絵フォントレンダラー
    │       ├── PixelButton.tsx      # 【新規】ドット絵調ボタンコンポーネント
    │       └── PomoAnimation.tsx    # 【新規】ポモ獲得浮遊アニメーション
    │   └── hooks/
    │       └── useTimer.ts          # 【新規】クライアントサイドタイマーフック
    └── companion/
        └── App.tsx                  # openTankクリック廃止、ActionBar・拡大ボタン統合

tests/
└── (既存テスト構造を踏襲)
```

**Structure Decision**: 既存のsrc/webview構造を踏襲し、新規コンポーネントはtank-panel/components/配下に追加。HudOverlay・ActionBarはTankScene内のKonvaコンポーネントとして描画し、コンパニオンビュー・フルパネル両方で共有する。

## Complexity Tracking

No constitution violations to justify.
