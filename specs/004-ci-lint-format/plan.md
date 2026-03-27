# Implementation Plan: CI Lint & Format Checks

**Branch**: `004-ci-lint-format` | **Date**: 2026-03-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-ci-lint-format/spec.md`

## Summary

Add automated CI checks for ESLint and Prettier via GitHub Actions, triggered on PRs and main branch pushes. This includes setting up ESLint 9+ flat config for TypeScript/React, Prettier for formatting, a GitHub Actions workflow with separate lint/format steps, auto-fixing existing code to comply, and configuring branch protection to require passing checks.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), Node.js 18 (CI target)
**Primary Dependencies**: ESLint 9+, typescript-eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-config-prettier, Prettier, @eslint/js, globals
**Storage**: N/A
**Testing**: vitest (existing), CI validates lint/format via exit codes
**Target Platform**: GitHub Actions (CI), macOS/Linux/Windows (local dev)
**Project Type**: VSCode extension with React webviews
**Performance Goals**: CI completes lint + format checks in under 3 minutes
**Constraints**: Must be compatible with VSCode ^1.85.0 engine target (Node 18 baseline)
**Scale/Scope**: ~29 TypeScript/TSX source files across `src/`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is not configured (template only). No gates to enforce. Proceeding.

## Project Structure

### Documentation (this feature)

```text
specs/004-ci-lint-format/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal — no data entities)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
.github/
└── workflows/
    └── lint.yml              # GitHub Actions workflow (NEW)

eslint.config.mjs            # ESLint flat config (NEW)
.prettierrc.json             # Prettier config (NEW)
.prettierignore              # Prettier ignore patterns (NEW)

src/                         # Existing source — auto-fixed for compliance
├── activity/
├── game/
├── persistence/
├── providers/
├── shared/
├── ui/
├── webview/
│   ├── companion/
│   └── tank-panel/
│       └── components/
└── extension.ts

package.json                 # Updated: new devDependencies + scripts
```

**Structure Decision**: This feature adds configuration files at the repository root and a GitHub Actions workflow. No new source directories are created. The existing `src/` structure is unchanged; files are only auto-fixed for formatting/linting compliance.

## Complexity Tracking

No constitution violations. No complexity justifications needed.
