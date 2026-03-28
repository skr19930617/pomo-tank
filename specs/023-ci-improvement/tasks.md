# Tasks: CI改善 — テスト実行とCI設定の強化

**Input**: Design documents from `/specs/023-ci-improvement/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Not requested in this feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No setup tasks needed — project structure already exists.

(No tasks in this phase)

---

## Phase 2: User Story 1 - CI でユニットテストが自動実行される (Priority: P1) MVP

**Goal**: lint.yml を ci.yml にリネームし、ユニットテスト実行とビルド検証を追加した統合ワークフローを作成する。

**Independent Test**: PR を作成して、CI ワークフローで lint, format check, test, build の全 step が実行されることを確認する。

### Implementation for User Story 1

- [x] T001 [US1] Delete `.github/workflows/lint.yml` and create `.github/workflows/ci.yml` with unified CI workflow (checkout, setup-node 18 with npm cache, npm ci, lint, format:check, test:unit, build steps) triggered on push to main and pull_request (default events)

**Checkpoint**: CI ワークフローが PR および main push で lint + format + test + build を実行する。

---

## Phase 3: User Story 2 - CI でビルドが検証される (Priority: P2)

**Goal**: ビルドステップが US1 の ci.yml に含まれているため、この User Story は US1 で完了済み。

**Independent Test**: ビルドエラーを含む変更で CI が失敗ステータスになることを確認する。

(US1 の T001 でビルドステップが含まれているため、追加タスクなし)

**Checkpoint**: ビルド失敗時に CI が失敗ステータスを報告する。

---

## Phase 4: User Story 3 - ローカルで CI 相当のチェックを一括実行できる (Priority: P2)

**Goal**: `npm run ci` スクリプトを package.json に追加し、ローカルで CI 相当のチェックを一括実行可能にする。

**Independent Test**: `npm run ci` を実行して、lint → format:check → test:unit → build が順番に実行されることを確認する。

### Implementation for User Story 3

- [x] T002 [US3] Add `"ci": "npm run lint && npm run format:check && npm run test:unit && npm run build"` script to `package.json`

**Checkpoint**: `npm run ci` でローカルで全チェックが一括実行でき、失敗時は即座に停止する。

---

## Phase 5: User Story 4 - Claude が変更時に CI チェックを実行するフロー (Priority: P3)

**Goal**: CLAUDE.md の Commands セクションに `npm run ci` コマンドと、失敗時の修正フローを記載する。

**Independent Test**: CLAUDE.md の Commands セクションに `npm run ci` と失敗時の対応手順が記載されていることを確認する。

### Implementation for User Story 4

- [x] T003 [US4] Update Commands section in `CLAUDE.md` to include `npm run ci` as the CI check command with instructions to run after changes and fix failures before committing

**Checkpoint**: CLAUDE.md に CI チェックフローが明記されている。

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 最終検証

- [x] T004 Run `npm run ci` locally to verify all steps pass (lint, format, test, build)
- [x] T005 Verify `.github/workflows/lint.yml` no longer exists and `.github/workflows/ci.yml` is the only workflow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (US1)**: No dependencies — start immediately
- **Phase 4 (US3)**: No dependencies on US1 — can run in parallel
- **Phase 5 (US4)**: No dependencies on other stories — can run in parallel
- **Phase 6 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Independent — CI workflow creation
- **US2 (P2)**: Included in US1 (build step)
- **US3 (P2)**: Independent — package.json change
- **US4 (P3)**: Independent — CLAUDE.md change

### Parallel Opportunities

- T001, T002, T003 can all run in parallel (different files, no dependencies)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001: Create ci.yml
2. **STOP and VALIDATE**: Push to branch and verify CI runs

### Incremental Delivery

1. T001 → CI workflow ready (US1 + US2)
2. T002 → Local CI script ready (US3)
3. T003 → CLAUDE.md updated (US4)
4. T004-T005 → Final verification

---

## Notes

- T001, T002, T003 modify different files and can be implemented in parallel
- US2 (build verification) is inherently covered by US1's ci.yml build step
- Total: 5 tasks across 4 user stories
