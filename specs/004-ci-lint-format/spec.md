# Feature Specification: CI Lint & Format Checks

**Feature Branch**: `004-ci-lint-format`
**Created**: 2026-03-24
**Status**: Draft
**Input**: User description: "CIを追加したい。GitHub ActionsでESLint, PrettierのformatをチェックするようにしてPRごとにこれに通るように編集するようにしたい"

## Clarifications

### Session 2026-03-24

- Q: Prettierの対象ファイルスコープは？ → A: `.ts`, `.tsx`, `.json`, `.yml`, `.css`（`.md`は除外）
- Q: 既存コードの準拠方法は？ → A: この機能の一部としてauto-fixし一括コミットする
- Q: CIチェックをPRマージのブロック条件にするか？ → A: Required（チェック失敗時はマージ不可）

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automated Code Quality Gate on Pull Requests (Priority: P1)

As a contributor, when I open or update a pull request, I want the CI pipeline to automatically check my code for linting errors (ESLint) and formatting issues (Prettier) so that code quality is enforced consistently without manual review effort.

**Why this priority**: This is the core value of the feature — automated enforcement of code standards on every PR prevents style inconsistencies and common errors from being merged.

**Independent Test**: Can be fully tested by opening a PR with a linting violation and verifying the CI check fails, then fixing the violation and verifying the check passes.

**Acceptance Scenarios**:

1. **Given** a PR is opened with code that passes both ESLint and Prettier checks, **When** the CI pipeline runs, **Then** the checks pass and the PR shows a green status.
2. **Given** a PR is opened with an ESLint violation, **When** the CI pipeline runs, **Then** the ESLint check fails and the PR shows a red status with a clear error message indicating the violation.
3. **Given** a PR is opened with a Prettier formatting issue, **When** the CI pipeline runs, **Then** the Prettier check fails and the PR shows a red status with a clear error message indicating the formatting issue.
4. **Given** a PR has failing checks, **When** the contributor fixes the issues and pushes again, **Then** the CI re-runs and the checks pass.

---

### User Story 2 - CI Runs on Main Branch Pushes (Priority: P2)

As a project maintainer, when code is pushed directly to the main branch (e.g., via merge), I want the same lint and format checks to run so that I am alerted if any non-compliant code enters the main branch.

**Why this priority**: Provides a safety net for the main branch, but PRs (P1) are the primary enforcement point.

**Independent Test**: Can be tested by pushing a commit to main and verifying the CI workflow triggers and reports results.

**Acceptance Scenarios**:

1. **Given** a commit is pushed to the main branch, **When** the CI pipeline runs, **Then** both ESLint and Prettier checks execute and report their results.

---

### User Story 3 - Local Development Consistency (Priority: P3)

As a developer, I want to be able to run the same lint and format checks locally before pushing so that I can catch and fix issues before CI runs.

**Why this priority**: Improves developer experience by enabling fast local feedback, but CI enforcement (P1) is the critical gate.

**Independent Test**: Can be tested by running the lint and format check commands locally and verifying they produce the same results as CI.

**Acceptance Scenarios**:

1. **Given** a developer has the project checked out, **When** they run the lint command locally, **Then** they see the same ESLint results that CI would produce.
2. **Given** a developer has the project checked out, **When** they run the format check command locally, **Then** they see the same Prettier results that CI would produce.

---

### Edge Cases

- What happens when new files are added that are not covered by lint/format rules (e.g., generated files, assets)? → Ignore patterns should exclude `dist/`, `node_modules/`, and other non-source directories.
- How does the CI handle partial failures (e.g., ESLint passes but Prettier fails)? → Each check runs as a separate step; one can fail independently of the other, and both statuses are reported.
- What happens if dependencies fail to install during the CI run? → The pipeline fails early with a clear error before lint/format steps execute.
- How are non-source files (config files, markdown, JSON) handled by Prettier? → Prettier checks `.ts`, `.tsx`, `.json`, `.yml`, `.css` only. Markdown files are excluded via ignore patterns.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The CI pipeline MUST run ESLint checks on all TypeScript and TSX source files in the repository on every pull request targeting the main branch.
- **FR-002**: The CI pipeline MUST run Prettier format checks on `.ts`, `.tsx`, `.json`, `.yml`, and `.css` files in the repository on every pull request targeting the main branch. Markdown (`.md`) files are excluded.
- **FR-003**: The CI pipeline MUST run both ESLint and Prettier checks on pushes to the main branch.
- **FR-004**: The CI pipeline MUST fail with a non-zero exit code and display clear error messages when violations are detected.
- **FR-005**: The CI pipeline MUST succeed (exit code 0) when no violations are detected.
- **FR-006**: The project MUST include ESLint configuration that defines the linting rules for TypeScript and TSX files.
- **FR-007**: The project MUST include Prettier configuration that defines the formatting rules.
- **FR-008**: The project MUST provide local commands (via package.json scripts) that developers can run to check lint and format issues locally, producing the same results as CI.
- **FR-009**: The CI pipeline MUST report ESLint and Prettier as separate, identifiable steps so contributors can quickly determine which check failed.
- **FR-010**: The CI pipeline MUST exclude non-source files (e.g., `node_modules/`, `dist/`, generated files) from lint and format checks.
- **FR-011**: Existing code MUST be auto-fixed for ESLint and Prettier compliance as part of this feature, committed in a single batch.
- **FR-012**: The CI checks MUST be configured as required status checks via GitHub Branch Protection, blocking PR merges when checks fail.

### Key Entities

- **CI Workflow**: The automated pipeline definition that triggers on PR and push events and orchestrates lint/format checks.
- **Lint Configuration**: The project-level rules defining what code patterns are acceptable.
- **Format Configuration**: The project-level rules defining how code should be formatted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every pull request targeting the main branch triggers automated lint and format checks within 3 minutes of being opened or updated.
- **SC-002**: Contributors can identify and fix lint/format issues from the CI output without needing additional context or documentation.
- **SC-003**: Developers can run lint and format checks locally using documented commands and get the same pass/fail results as CI.
- **SC-004**: The main branch maintains zero lint and format violations after CI enforcement is active.

## Assumptions

- The project will use standard, widely-adopted ESLint and Prettier configurations appropriate for a TypeScript + React codebase.
- GitHub Actions is the CI platform (the repository is hosted on GitHub).
- The CI will use Node.js to install dependencies and run checks.
- Existing code will be auto-fixed and committed as part of this feature to ensure CI passes from the start.
- Prettier will check formatting only (not auto-fix) in CI; developers fix locally.
- Prettier targets `.ts`, `.tsx`, `.json`, `.yml`, `.css` files only; `.md` files are excluded.
- GitHub Branch Protection will be configured to require passing CI checks before merge.
- ESLint and Prettier configurations will be compatible (no conflicting rules).
