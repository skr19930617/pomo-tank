# Data Model: CI Lint & Format Checks

**Feature**: 004-ci-lint-format | **Date**: 2026-03-24

## Overview

This feature does not introduce application data entities. It adds configuration and CI infrastructure only.

## Configuration Entities

### ESLint Configuration (`eslint.config.mjs`)

- **Purpose**: Defines lint rules for TypeScript and TSX files
- **Scope**: `src/**/*.ts`, `src/**/*.tsx`
- **Key properties**: Language parser (typescript-eslint), rule sets (recommended + react + react-hooks), Prettier conflict resolution (eslint-config-prettier as last config)

### Prettier Configuration (`.prettierrc.json`)

- **Purpose**: Defines formatting rules for source and config files
- **Scope**: `.ts`, `.tsx`, `.json`, `.yml`, `.css` (excludes `.md`)
- **Key properties**: Standard formatting options (semi, singleQuote, tabWidth, trailingComma, printWidth)

### Prettier Ignore (`.prettierignore`)

- **Purpose**: Excludes paths from Prettier checks
- **Entries**: `node_modules/`, `dist/`, `*.md`, coverage output, build artifacts

### GitHub Actions Workflow (`.github/workflows/lint.yml`)

- **Purpose**: CI pipeline definition
- **Triggers**: `pull_request` (targeting main), `push` (to main)
- **Steps**: Checkout → Setup Node 18 (with npm cache) → `npm ci` → ESLint → Prettier check
- **Required status check**: Must pass for PR merge (branch protection)
