# Implementation Plan: CI改善 — テスト実行とCI設定の強化

**Branch**: `023-ci-improvement` | **Date**: 2026-03-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/023-ci-improvement/spec.md`

## Summary

既存の lint.yml を ci.yml にリネーム・再構成し、ユニットテスト実行とプロダクションビルド検証を CI に追加する。ローカル用 `npm run ci` スクリプトを package.json に定義し、CLAUDE.md の Commands セクションを更新する。

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), Node.js 18
**Primary Dependencies**: Vitest 1.2.0, ESLint 9.x, Prettier 3.x, esbuild 0.20.0
**Storage**: N/A
**Testing**: Vitest (`npm run test:unit`) — 6 unit test files in `test/unit/`
**Target Platform**: GitHub Actions (ubuntu-latest), macOS (local dev)
**Project Type**: VSCode Extension
**Performance Goals**: CI workflow completes in < 5 minutes (wall-clock on ubuntu-latest)
**Constraints**: Single job workflow, npm script based local CI
**Scale/Scope**: Small project, 1 developer

## Constitution Check

Constitution is not customized (template only). No gates to check.

## Project Structure

### Documentation (this feature)

```text
specs/023-ci-improvement/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - no data entities)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (changes)

```text
.github/workflows/
├── ci.yml               # RENAMED from lint.yml, expanded with test + build steps

package.json             # Added "ci" npm script

CLAUDE.md                # Updated Commands section
```

**Structure Decision**: No new source directories. Changes are limited to CI config, package.json script, and CLAUDE.md documentation.

## Implementation Approach

### Step 1: Rename lint.yml → ci.yml and expand

The existing `.github/workflows/lint.yml` will be deleted and replaced with `.github/workflows/ci.yml`. The new workflow:

- **Name**: `CI` (was `Lint & Format`)
- **Triggers**: push to main, pull_request (default: opened, synchronize, reopened)
- **Single job** with these steps in order:
  1. Checkout
  2. Setup Node.js 18 with npm cache
  3. `npm ci` (install dependencies)
  4. `npm run lint` (ESLint)
  5. `npm run format:check` (Prettier)
  6. `npm run test:unit` (Vitest)
  7. `npm run build` (esbuild production build)

### Step 2: Add `npm run ci` script to package.json

Add a `ci` script that runs the same steps sequentially with fail-fast behavior:

```
"ci": "npm run lint && npm run format:check && npm run test:unit && npm run build"
```

This uses `&&` chaining so any failure stops execution immediately.

### Step 3: Update CLAUDE.md Commands section

Update the Commands section to include `npm run ci` as the recommended check command after making changes.
