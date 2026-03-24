# Research: CI Lint & Format Checks

**Feature**: 004-ci-lint-format | **Date**: 2026-03-24

## 1. ESLint Configuration for TypeScript + React

**Decision**: Use ESLint 9+ with flat config (`eslint.config.mjs`) and the unified `typescript-eslint` package.

**Rationale**: Flat config is the only supported format in ESLint 9+. The `typescript-eslint` package replaces the legacy `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin` two-package setup with a single unified package. The `--ext .ts` CLI flag is removed in ESLint 9; file filtering is done via `files` property in config objects.

**Alternatives considered**:
- Legacy `.eslintrc` config: Deprecated in ESLint 9+, no longer supported.
- Separate `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin`: Still functional but the unified `typescript-eslint` package is the canonical approach.

**Packages (devDependencies)**:
- `eslint` (v9+)
- `@eslint/js` (for `eslint.configs.recommended`)
- `typescript-eslint` (unified parser + plugin + configs)
- `eslint-plugin-react` (React-specific rules)
- `eslint-plugin-react-hooks` (hooks rules, flat config: `reactHooks.configs['flat/recommended']`)
- `globals` (browser/node global variable definitions)

## 2. Prettier + ESLint Integration

**Decision**: Run Prettier as a separate command from ESLint. Use `eslint-config-prettier` to disable conflicting ESLint formatting rules.

**Rationale**: The official Prettier documentation recommends running Prettier separately. `eslint-plugin-prettier` (running Prettier inside ESLint as a rule) is discouraged — it is slower, produces noisy squiggly underlines for formatting issues, and mixes concerns. `eslint-config-prettier` simply turns off ESLint rules that conflict with Prettier.

**Alternatives considered**:
- `eslint-plugin-prettier/recommended`: Integrates both plugin and config but adds complexity and noise.
- Prettier-only (no ESLint): Would miss code quality/logic rules that ESLint provides beyond formatting.

**Packages (devDependencies)**:
- `prettier`
- `eslint-config-prettier` (last in flat config array to disable conflicting rules)

## 3. GitHub Actions Workflow

**Decision**: Single workflow file with `actions/checkout@v4`, `actions/setup-node@v4` (cache: 'npm'), `npm ci`, then separate steps for lint and format check. Target Node.js 18.

**Rationale**: VS Code 1.85 bundles Node.js 18.15.0 (Electron 27), so Node 18 is the appropriate CI baseline. `npm ci` is preferred over `npm install` for CI (deterministic, faster, respects lockfile). `actions/setup-node@v4` has built-in npm caching based on `package-lock.json`.

**Alternatives considered**:
- Matrix strategy with Node 18 + 20: Overkill for a single-target VSCode extension.
- Separate jobs for lint/format: Better parallelism but adds overhead for a small project. Single job with separate steps is sufficient.
- `actions/cache` for manual caching: Unnecessary — `setup-node` built-in caching is simpler and sufficient.

## 4. Prettier CLI Usage

**Decision**: Use `prettier --check` with explicit glob patterns for CI. Use `prettier --write` for local auto-fix.

**Rationale**: `--check` exits with non-zero status if any file is unformatted (ideal for CI). Explicit glob patterns (`"src/**/*.{ts,tsx}"` + config files) give clear control over scope. `node_modules` is ignored by default.

**Alternatives considered**:
- `prettier --check .` (checks everything): Too broad, may catch unwanted files.
- Directory-only argument (`prettier --check src/`): Less explicit about targeted extensions.

## 5. Existing Code Compliance

**Decision**: Auto-fix all existing code using `eslint --fix` and `prettier --write` as part of this feature, committed in a single batch commit.

**Rationale**: Spec clarification confirmed this approach. Ensures CI passes from the moment it is enabled. A single batch commit keeps git history clean — all formatting changes are isolated in one commit.

**Alternatives considered**:
- Separate PR for existing code fixes: Adds coordination overhead for no benefit.
- Gradual migration with warnings: Delays enforcement and risks drift.

## Summary of All New Packages

| Package | Purpose |
|---------|---------|
| `eslint` (v9+) | Core linter |
| `@eslint/js` | ESLint recommended base config |
| `typescript-eslint` | TypeScript parser + plugin + configs |
| `eslint-plugin-react` | React-specific lint rules |
| `eslint-plugin-react-hooks` | React hooks lint rules |
| `eslint-config-prettier` | Disables ESLint rules that conflict with Prettier |
| `globals` | Global variable definitions (browser, node) |
| `prettier` | Code formatter |
