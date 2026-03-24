# Quickstart: 型安全性の改善とWebviewリファクタリング

**Date**: 2026-03-24

## Prerequisites

- Node.js
- VSCode ^1.85.0

## Setup

```bash
npm install
npm install react react-dom react-konva konva
npm install -D @types/react @types/react-dom
npm run build
```

## Development

```bash
npm run watch    # esbuild watch (extension + webview bundles)
```

F5でExtension Development Hostを起動。

## Testing

```bash
npm test         # vitest run
npm run build    # type check via esbuild
```

## Key Files to Modify (Phase順)

### Phase 2: Foundational
1. **`src/shared/types.ts`** — 全列挙型、ID型、定数を集約
2. **`src/shared/messages.ts`** — 判別共用体メッセージ型
3. **`src/game/state.ts`** — shared/types.tsからre-export、GameStateSnapshot型修正

### Phase 3: US1+US2 (型安全化)
4. **`src/game/engine.ts`** — ActionType使用、createSnapshot型修正
5. **`src/game/store.ts`** — StoreItemId型、nullチェック追加
6. **`src/game/deterioration.ts`** — FishSpeciesId型使用
7. **`src/providers/tank-panel.ts`** — メッセージ型使用
8. **`src/providers/companion-view.ts`** — メッセージ型使用
9. **`src/ui/status-bar.ts`** — HealthState import修正
10. **`src/extension.ts`** — HealthState import追加

### Phase 4: US3 (React化 - メインパネル)
11. **`esbuild.mjs`** — 3エントリポイント化
12. **`tsconfig.json`** — jsx設定追加
13. **`package.json`** — React依存追加
14. **`src/webview/tank-panel/`** — React版メインパネル
15. **`src/providers/tank-panel.ts`** — HTML更新（Reactバンドル読み込み）

### Phase 5: US4 (React化 - コンパニオン)
16. **`src/webview/companion/`** — React版コンパニオン
17. **`src/providers/companion-view.ts`** — HTML更新

## Architecture Notes

- 型定義は`src/shared/`に集約。extension bundleとwebview bundleの両方からimport
- esbuildが3バンドルを生成: extension(node/cjs), tank-panel(browser/iife), companion(browser/iife)
- React状態: `useGameState()` hookがpostMessage経由でextension状態を受信
- コンポーネント共有: `TankScene`, `Fish`, `Wall`, `Desk`, `Light`をメインパネルとコンパニオンで再利用
