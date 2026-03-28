# Implementation Plan: 全体のリファクタリング

**Branch**: `022-full-refactoring` | **Date**: 2026-03-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/022-full-refactoring/spec.md`

## Summary

既存機能を維持しながら、コード品質・型安全性・構造の見通しを全面的に改善する。具体的には: 重複コードの統合、`any` 型の排除、マジックナンバーの定数化、`window` グローバル変数の React Context 化、ディレクトリ構造の再編成、命名規則の統一、不要ファイルの削除、水質フリーズの簡素化、リグレッションテストの追加を行う。

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**: React 19, react-konva 19, Konva 10, @mui/material, @emotion/react, @types/vscode ^1.85.0, esbuild ^0.20.0
**Storage**: VSCode ExtensionContext globalState (key-value persistence)
**Testing**: vitest (unit + integration), `npm test && npm run lint`
**Target Platform**: VSCode Extension (Node.js + Webview)
**Project Type**: desktop-app (VSCode Extension)
**Performance Goals**: N/A (ビルド・テスト通過のみ)
**Constraints**: 既存機能の振る舞い変更なし。globalState キー変更時はマイグレーション必須
**Scale/Scope**: ~73 TypeScript files, ~39 in src/

## Constitution Check

*GATE: Constitution is template-only (not configured). No gates to enforce.*

## Project Structure

### Documentation (this feature)

```text
specs/022-full-refactoring/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (current → target)

**Current structure:**
```text
src/
├── activity/tracker.ts
├── extension.ts
├── game/
│   ├── deterioration.ts
│   ├── engine.ts
│   ├── growth.ts
│   ├── health.ts
│   ├── maintenance-quality.ts
│   ├── points.ts
│   ├── state.ts
│   ├── store.ts
│   ├── filters/ (index + 4 configs)
│   ├── species/ (index + 5 configs)
│   └── tanks/ (index + 5 configs)
├── persistence/storage.ts
├── providers/
│   ├── companion-view.ts
│   └── tank-panel.ts
├── shared/
│   ├── messages.ts
│   ├── timer-theme.ts
│   └── types.ts
├── ui/status-bar.ts
└── webview/
    ├── companion/
    └── tank-panel/
        ├── components/ (19 components)
        ├── hooks/ (10 hooks)
        └── theme.ts
```

**Target structure (proposed changes):**
```text
src/
├── activity/tracker.ts
├── extension.ts
├── game/
│   ├── constants.ts          # NEW: マジックナンバー集約
│   ├── deterioration.ts
│   ├── engine.ts             # MODIFIED: 水質フリーズ簡素化
│   ├── growth.ts
│   ├── health.ts             # MODIFIED: 定数を constants.ts に移動
│   ├── maintenance-quality.ts
│   ├── points.ts
│   ├── state.ts              # MODIFIED: any 排除
│   ├── store.ts
│   ├── filters/
│   ├── species/
│   └── tanks/
├── persistence/storage.ts
├── providers/
│   ├── companion-view.ts     # MODIFIED: buildSpriteUriMap を共有モジュールから import
│   └── tank-panel.ts         # MODIFIED: 同上 + window injection 排除
├── shared/
│   ├── messages.ts
│   ├── sprite-utils.ts       # NEW: buildSpriteUriMap + SpriteUriMap 型を集約
│   ├── timer-theme.ts
│   └── types.ts
├── ui/status-bar.ts
└── webview/
    ├── companion/
    └── tank-panel/
        ├── components/        # MODIFIED: any 排除, スタイル共有化
        ├── contexts/          # NEW: SpriteUriMapContext
        │   └── sprite-context.tsx
        ├── hooks/             # MODIFIED: Context 経由のデータアクセス
        └── theme.ts           # MODIFIED: 共有 Accordion sx 定数追加
```

**Structure Decision**: 既存のディレクトリ構造は論理的に整理されているため大幅な再編成は不要。主な変更は新規ファイル追加（constants.ts, sprite-utils.ts, sprite-context.tsx）と既存ファイルの修正。不要ファイルの有無は実装時に精査する。

## Design Decisions

### D1: 重複コード統合

- `buildSpriteUriMap()` → `src/shared/sprite-utils.ts` に移動
- `SpriteUriMap` 型 → 同ファイルから export
- 両 provider は import して利用

### D2: window グローバル変数 → React Context

- `src/webview/tank-panel/contexts/sprite-context.tsx` に `SpriteUriMapProvider` + `useSpriteUriMap()` hook を作成
- extension 側は webview ready 時の初回メッセージで spriteUriMap を送信（既存の stateUpdate メッセージに含める）
- webview 側は App コンポーネントで Provider ラップし、各コンポーネントは `useSpriteUriMap()` で取得
- `<script>window.__SPRITE_URI_MAP__ = ...</script>` の HTML injection を削除

### D3: any 型排除

- `game/state.ts` の `migrateState(raw: any)` → `migrateState(raw: unknown)` + 型ガード
- webview 内の `(window as any).__SPRITE_URI_MAP__` → Context 移行で自然消滅
- 外部 API (`acquireVsCodeApi`) → eslint-disable + コメント付きで許容

### D4: マジックナンバー定数化

- `src/game/constants.ts` に集約:
  - health.ts: `WARNING_THRESHOLD`, `SICK_THRESHOLD`, `DEAD_THRESHOLD`
  - deterioration.ts: decay rates, hunger rates
  - points.ts: bonus multipliers, streak values
- UI スペーシング・アニメーション値は対象外

### D5: 水質フリーズ簡素化

- `waterQualityFrozen: boolean` + `waterChangeOwnerId: string | null` → `waterFreezers: Set<string>`
- getter: `get isWaterQualityFrozen(): boolean { return this.waterFreezers.size > 0; }`

### D6: Accordion スタイル共有化

- `theme.ts` に `accordionSummarySx` 定数を追加
- 各コンポーネントは import して利用

### D7: 命名規則統一

- ファイル名: kebab-case（現行維持）
- export: camelCase / PascalCase（現行維持）
- 内部変数: 省略形を排除し明示的な名前に統一
- globalState キー・メッセージ type・コマンド ID: 必要に応じてリネーム（マイグレーション対応）

### D8: リグレッションテスト追加

- 主要フローのテストを追加: タイマー、魚管理、店舗購入、苔掃除、永続化/マイグレーション

## Complexity Tracking

No constitution violations to justify.
