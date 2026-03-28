# Quickstart: CI改善

## What Changed

1. `.github/workflows/lint.yml` → `.github/workflows/ci.yml` (renamed + expanded)
2. `package.json` — added `npm run ci` script
3. `CLAUDE.md` — updated Commands section with CI check instructions

## Local Development

Run all CI checks locally before pushing:

```bash
npm run ci
```

This runs: lint → format check → unit tests → production build (stops on first failure).

## CI Pipeline

The `ci.yml` workflow runs automatically on:
- Push to `main`
- Pull requests targeting `main`

Steps: checkout → setup Node.js 18 → npm ci → ESLint → Prettier → Vitest → esbuild build
