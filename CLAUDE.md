# pomo-tank Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-26

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

- TypeScript 5.x + `@types/vscode` (VSCode Extension API), esbuild (bundler) (001-pomotank-mvp)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x: Follow standard conventions

## Recent Changes
- 017-interactive-feeding-anim: Added TypeScript 5.3+ (strict mode) + React 19, react-konva 19, Konva 10, @mui/material, @emotion/react, @types/vscode ^1.85.0, esbuild ^0.20.0
- 016-tank-config-refactor: Added TypeScript 5.3+ (strict mode) + React 19, react-konva 19, Konva 10, @mui/material, @emotion/react, @types/vscode ^1.85.0, esbuild ^0.20.0
- 015-rebuild-debug-ui: Added TypeScript 5.3+ (strict mode) + React 19, @mui/material, @emotion/react, react-konva 19, Konva 10, @types/vscode ^1.85.0, esbuild ^0.20.0


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
