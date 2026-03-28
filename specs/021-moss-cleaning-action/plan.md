# Implementation Plan: 苔掃除アクション化

**Branch**: `021-moss-cleaning-action` | **Date**: 2026-03-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/021-moss-cleaning-action/spec.md`

## Summary

現在のボタン一発で苔レベルを0にする即時アクション（`cleanAlgae`）を、ドラッグ操作で徐々に苔を除去する「苔掃除モード」に置き換える。水換えモード（`useWaterChangeMode`）と同様のフェーズベースモードパターンを採用し、距離ベース＋時間補正の苔レベル低下モデルを実装する。

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**: React 19, react-konva 19, Konva 10, @mui/material, @emotion/react
**Storage**: VSCode ExtensionContext globalState（既存、苔レベルはfloatで管理）
**Testing**: `npm test && npm run lint`
**Target Platform**: VSCode Desktop Extension (マウス操作限定)
**Project Type**: VSCode Extension (Webview + Extension Host)
**Performance Goals**: 60fps描画維持、モード遷移0.5秒以内
**Constraints**: 苔レベル100→0で約5秒のドラッグ操作（チューニング目安）
**Scale/Scope**: 単一ユーザー、単一水槽

## Constitution Check

*Constitution未設定（テンプレートのまま）— ゲートなし、スキップ*

## Project Structure

### Documentation (this feature)

```text
specs/021-moss-cleaning-action/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── game/
│   ├── state.ts              # Tank.algaeLevel (float化)
│   └── engine.ts             # performAction('cleanAlgae') 変更
├── shared/
│   └── messages.ts           # 苔掃除モード用メッセージ追加
├── providers/
│   └── tank-panel.ts         # 苔掃除メッセージハンドラ追加
└── webview/tank-panel/
    ├── hooks/
    │   └── useMossCleaningMode.ts  # 新規: 苔掃除モードフック
    └── components/
        ├── TankScene.tsx      # モード統合、イベントハンドリング
        ├── ActionBar.tsx      # ボタン状態・排他制御更新
        └── AlgaeOverlay.tsx   # リアルタイム苔レベル反映（既存で対応済み）

tests/
└── (既存テスト構成に追加)
```

**Structure Decision**: 既存のhooksパターン（`useWaterChangeMode.ts`参照）に倣い、新規フック`useMossCleaningMode.ts`を作成。水換えモードと同じアーキテクチャで統一。
