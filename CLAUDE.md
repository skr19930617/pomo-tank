# pomo-tank Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-29

## Active Technologies
- TypeScript 5.3+ + @types/vscode ^1.85.0, esbuild ^0.20.0 (002-tank-growth-light)
- VSCode ExtensionContext globalState (既存) (002-tank-growth-light)
- TypeScript 5.3+ (strict mode有効) + @types/vscode ^1.85.0, esbuild ^0.20.0, React 18+, react-dom, react-konva, konva (003-type-safety-refactor)
- TypeScript 5.3+ (strict mode), Node.js 18 (CI target) + ESLint 9+, typescript-eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-config-prettier, Prettier, @eslint/js, globals (004-ci-lint-format)
- TypeScript 5.3+ (strict mode) + React 18, react-konva, konva, @types/vscode ^1.85.0 (005-tank-hud-overlay)
- TypeScript 5.3+ (strict mode) + React 18, react-konva, konva, @types/vscode ^1.85.0, esbuild ^0.20.0 (006-tank-cost-system)
- VSCode ExtensionContext globalState (key-value persistence) (006-tank-cost-system)
- VSCode ExtensionContext globalState (existing) (007-fish-sprite-animation)
- TypeScript 5.3+ (strict mode) + React 18, react-konva, @types/vscode ^1.85.0, esbuild ^0.20.0 (008-debug-mode)
- TypeScript 5.3+ (strict mode) + @types/vscode ^1.85.0, esbuild ^0.20.0, React 18, react-konva, konva (010-legacy-code-cleanup)
- TypeScript 5.3+ (strict mode) + React 19, react-konva 19, Konva 10, @types/vscode ^1.85.0, esbuild ^0.20.0 (011-ui-timer-improvements)
- VSCode ExtensionContext globalState (existing pattern via `src/persistence/storage.ts`) (011-ui-timer-improvements)
- TypeScript 5.3+ (strict mode) + React 19, react-dom 19, react-konva 19, Konva 10, **NEW: @mui/material, @emotion/react, @emotion/styled** (012-mui-css-migration)
- VSCode ExtensionContext globalState (existing, unchanged) (012-mui-css-migration)
- TypeScript 5.3+ (strict mode) + React 19, react-konva 19, Konva 10, @mui/material, @emotion/reac (013-filter-config-rendering)
- TypeScript 5.3+ (strict mode) + React 19, @mui/material, @emotion/react, react-konva 19, Konva 10 (014-tank-fish-management)
- TypeScript 5.3+ (strict mode) + React 19, @mui/material, @emotion/react, react-konva 19, Konva 10, @types/vscode ^1.85.0, esbuild ^0.20.0 (015-rebuild-debug-ui)
- VSCode ExtensionContext globalState (key-value persistence via `src/persistence/storage.ts`) (015-rebuild-debug-ui)
- TypeScript 5.3+ (strict mode) + React 19, react-konva 19, Konva 10, @mui/material, @emotion/react, @types/vscode ^1.85.0, esbuild ^0.20.0 (016-tank-config-refactor)
- VSCode ExtensionContext globalState（既存、本機能では変更なし） (017-interactive-feeding-anim)
- N/A（描画のみの変更、ゲーム状態は既存のまま） (018-moss-rendering-improvement)
- VSCode ExtensionContext globalState（既存、苔レベルはfloatで管理） (021-moss-cleaning-action)
- TypeScript 5.3+ (strict mode), Node.js 18 + Vitest 1.2.0, ESLint 9.x, Prettier 3.x, esbuild 0.20.0 (023-ci-improvement)
- TypeScript 5.3 (strict mode) + React 19, react-konva 19, Konva 10, @mui/material 7, @types/vscode ^1.85.0, esbuild 0.20.0 (024-dead-fish-interaction)
- VSCode ExtensionContext globalState (existing via `src/persistence/storage.ts`) (024-dead-fish-interaction)
- TypeScript 5.3+ (strict mode) + React 19, react-konva 19, Konva 10, @types/vscode ^1.85.0, esbuild 0.20.0 (025-fix-debug-timer-display)

- TypeScript 5.x + `@types/vscode` (VSCode Extension API), esbuild (bundler) (001-pomotank-mvp)

## Project Structure

```text
src/
tests/
```

## Commands

npm run ci

This runs all CI checks locally: lint → format check → unit tests → build (stops on first failure).
After making changes, always run `npm run ci` to verify. If any step fails, fix the issue and re-run.

## Code Style

TypeScript 5.x: Follow standard conventions

## Recent Changes
- 025-fix-debug-timer-display: Added TypeScript 5.3+ (strict mode) + React 19, react-konva 19, Konva 10, @types/vscode ^1.85.0, esbuild 0.20.0
- 024-dead-fish-interaction: Added TypeScript 5.3 (strict mode) + React 19, react-konva 19, Konva 10, @mui/material 7, @types/vscode ^1.85.0, esbuild 0.20.0
- 023-ci-improvement: Added TypeScript 5.3+ (strict mode), Node.js 18 + Vitest 1.2.0, ESLint 9.x, Prettier 3.x, esbuild 0.20.0


<!-- MANUAL ADDITIONS START -->

## specflow Integration

This project uses [specflow](https://github.com/skr19930617/specflow) + speckit for issue-driven development.

### specflow Slash Command

- `/specflow <issue-url>` — GitHub issue からの全ワークフロー
- `/specflow` — issue URL をインタラクティブに入力

フロー: issue 取得 → speckit.specify → speckit.clarify (人間) → Codex review → speckit.clarify (人間) → speckit.plan → speckit.tasks → speckit.implement → Codex review

### Workflow Rules

- spec は speckit のディレクトリ構造 (`specs/<number>-<name>/spec.md`) で管理される
- Codex レビュー結果は `.specflow/state/<timestamp>/` に保存される
- 実装時は spec の acceptance criteria をすべて満たすこと
- `.specflow/` 配下のファイルは実装 diff に含めないこと
- レビュー指摘への対応時、spec の意図を変えないこと
- clarify と review 後の選択はユーザーがインタラクティブに決定する

<!-- MANUAL ADDITIONS END -->
