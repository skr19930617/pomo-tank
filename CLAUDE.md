# pomo-tank Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-25

## Active Technologies
- TypeScript 5.3+ + @types/vscode ^1.85.0, esbuild ^0.20.0 (002-tank-growth-light)
- VSCode ExtensionContext globalState (既存) (002-tank-growth-light)
- TypeScript 5.3+ (strict mode有効) + @types/vscode ^1.85.0, esbuild ^0.20.0, React 18+, react-dom, react-konva, konva (003-type-safety-refactor)
- TypeScript 5.3+ (strict mode), Node.js 18 (CI target) + ESLint 9+, typescript-eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-config-prettier, Prettier, @eslint/js, globals (004-ci-lint-format)
- TypeScript 5.3+ (strict mode) + React 18, react-konva, konva, @types/vscode ^1.85.0 (005-tank-hud-overlay)
- TypeScript 5.3+ (strict mode) + React 18, react-konva, konva, @types/vscode ^1.85.0, esbuild ^0.20.0 (006-tank-cost-system)
- VSCode ExtensionContext globalState (key-value persistence) (006-tank-cost-system)

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
- 006-tank-cost-system: Added TypeScript 5.3+ (strict mode) + React 18, react-konva, konva, @types/vscode ^1.85.0, esbuild ^0.20.0
- 005-tank-hud-overlay: Added TypeScript 5.3+ (strict mode) + React 18, react-konva, konva, @types/vscode ^1.85.0
- 004-ci-lint-format: Added TypeScript 5.3+ (strict mode), Node.js 18 (CI target) + ESLint 9+, typescript-eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-config-prettier, Prettier, @eslint/js, globals


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
