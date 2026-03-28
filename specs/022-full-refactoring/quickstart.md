# Quickstart: 全体のリファクタリング

## Build & Test

```bash
npm install
npm run compile   # esbuild bundle
npm test          # unit + integration tests
npm run lint      # ESLint + Prettier
```

## Key Files to Modify

1. **`src/shared/sprite-utils.ts`** (NEW) — `buildSpriteUriMap()` + `SpriteUriMap` 型
2. **`src/game/constants.ts`** (NEW) — ゲーム定数集約
3. **`src/webview/tank-panel/contexts/sprite-context.tsx`** (NEW) — React Context Provider
4. **`src/game/engine.ts`** — 水質フリーズ簡素化
5. **`src/game/state.ts`** — `any` → `unknown` + 型ガード
6. **`src/providers/tank-panel.ts`** — 共有モジュール import、window injection 削除
7. **`src/providers/companion-view.ts`** — 共有モジュール import
8. **`src/webview/tank-panel/theme.ts`** — Accordion sx 共有定数

## Verification

```bash
# any 型チェック
grep -rn "as any\|: any\|<any>" src/ --include="*.ts" --include="*.tsx"

# 重複チェック
grep -rn "buildSpriteUriMap" src/ --include="*.ts" --include="*.tsx"

# テスト
npm test && npm run lint
```
