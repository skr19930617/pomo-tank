# Quickstart: CI Lint & Format Checks

**Feature**: 004-ci-lint-format | **Date**: 2026-03-24

## Local Development Commands

### Check linting (same as CI)

```bash
npm run lint
```

### Check formatting (same as CI)

```bash
npm run format:check
```

### Auto-fix linting issues

```bash
npm run lint:fix
```

### Auto-fix formatting issues

```bash
npm run format
```

### Run all checks (lint + format)

```bash
npm run lint && npm run format:check
```

## Package Scripts (package.json)

```json
{
  "lint": "eslint src/",
  "lint:fix": "eslint src/ --fix",
  "format:check": "prettier --check \"src/**/*.{ts,tsx}\" \"**/*.{json,yml,css}\" --ignore-path .prettierignore",
  "format": "prettier --write \"src/**/*.{ts,tsx}\" \"**/*.{json,yml,css}\" --ignore-path .prettierignore"
}
```

## CI Behavior

- **Trigger**: PR targeting `main`, push to `main`
- **Checks**: ESLint (separate step) → Prettier (separate step)
- **On failure**: PR merge is blocked (required status check)
- **On success**: Green checkmark on PR

## GitHub Branch Protection Setup

To enforce CI checks as a merge requirement:

1. Go to **Settings → Branches** in the GitHub repository
2. Add a branch protection rule for `main`
3. Enable **Require status checks to pass before merging**
4. Search for and add the status check: `ESLint & Prettier`
5. Optionally enable **Require branches to be up to date before merging**
6. Save changes

After this, PRs targeting `main` cannot be merged unless the lint and format checks pass.

## Files Added

| File | Purpose |
|------|---------|
| `.github/workflows/lint.yml` | GitHub Actions CI workflow |
| `eslint.config.mjs` | ESLint flat config for TS + React |
| `.prettierrc.json` | Prettier formatting rules |
| `.prettierignore` | Files/dirs excluded from Prettier |
