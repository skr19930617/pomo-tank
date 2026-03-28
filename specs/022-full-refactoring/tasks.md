# Tasks: 全体のリファクタリング

**Input**: Design documents from `/specs/022-full-refactoring/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: テスト追加が spec で要求されているため、リグレッションテストタスクを含む。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 共有モジュールとユーティリティの新規作成

- [x] T001 Create game constants file extracting magic numbers from src/game/health.ts, src/game/deterioration.ts, src/game/points.ts → src/game/constants.ts
- [x] T002 [P] Create shared sprite utilities extracting buildSpriteUriMap() and SpriteUriMap type → src/shared/sprite-utils.ts
- [x] T003 [P] Create SpriteUriMap React Context Provider → src/webview/tank-panel/contexts/sprite-context.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 型安全性の基盤整備（他の全ストーリーの前提）

**⚠️ CRITICAL**: 型の厳密化は他の変更の前提となるため先に完了する

- [x] T004 Refactor migrateState() to use `unknown` instead of `any` with type guards in src/game/state.ts
- [x] T005 [P] Remove all `(window as any).__SPRITE_URI_MAP__` references in src/webview/tank-panel/hooks/useGameState.ts, src/webview/tank-panel/components/FishManager.tsx, src/webview/tank-panel/components/Store.tsx — replace with useSpriteUriMap() hook from Context
- [x] T006 [P] Remove `type SpriteUriMap` duplicate definitions from src/providers/tank-panel.ts and inline definitions in webview files — import from src/shared/sprite-utils.ts
- [x] T007 Update src/providers/tank-panel.ts to import buildSpriteUriMap from src/shared/sprite-utils.ts, remove local definition, remove window.__SPRITE_URI_MAP__ HTML script injection
- [x] T008 [P] Update src/providers/companion-view.ts to import buildSpriteUriMap from src/shared/sprite-utils.ts, remove local definition
- [x] T009 Add spriteUriMap to the init/stateUpdate message in src/shared/messages.ts and update src/providers/tank-panel.ts to include it

**Checkpoint**: Foundation ready — `any` 型排除、重複型/関数統合完了

---

## Phase 3: User Story 1 — 命名規則の統一と型の厳密化 (Priority: P1) 🎯 MVP

**Goal**: 全コードの命名規則を統一し、残存する any 型を排除

**Independent Test**: `grep -rn "as any\|: any\|<any>" src/` が許容例外（eslint-disable 付き）以外 0 件

### Implementation for User Story 1

- [x] T010 [US1] Audit all remaining `any` types across src/ and replace with proper types or `unknown` + type guards (excluding acquireVsCodeApi which gets eslint-disable + comment)
- [x] T011 [P] [US1] Review and unify variable naming across src/game/ — replace abbreviations (msg, f, s) with descriptive names in public exports
- [x] T012 [P] [US1] Review and unify variable naming across src/webview/ — ensure consistent naming patterns
- [x] T013 [P] [US1] Review and unify variable naming across src/providers/ and src/shared/ — ensure consistent naming patterns
- [x] T014 [US1] Review file naming across entire src/ — ensure all files follow kebab-case, exports follow camelCase/PascalCase

**Checkpoint**: 命名規則統一・型厳密化完了

---

## Phase 4: User Story 2 — プロジェクト構造と責務の整理 (Priority: P1)

**Goal**: 重複コード排除、マジックナンバー定数化、ディレクトリ構造の再編成、不要ファイルの削除

**Independent Test**: `grep -rn "buildSpriteUriMap" src/` が src/shared/sprite-utils.ts のみ。重複定義 0 件。

### Implementation for User Story 2

- [x] T015 [US2] Update src/game/health.ts to import thresholds (WARNING_THRESHOLD, SICK_THRESHOLD, DEAD_THRESHOLD) from src/game/constants.ts
- [x] T016 [P] [US2] Update src/game/deterioration.ts to import decay rates from src/game/constants.ts
- [x] T017 [P] [US2] Update src/game/points.ts to import bonus multipliers and streak values from src/game/constants.ts
- [x] T018 [US2] Extract shared Accordion sx styles to src/webview/tank-panel/theme.ts and update importing components (TankManager.tsx, FishManager.tsx, Store-related components)
- [x] T019 [US2] Audit src/ directory structure — identify and delete unused/redundant files, consolidate where appropriate
- [x] T020 [US2] Reorganize directory structure if needed — move files to more logical locations, update all imports

**Checkpoint**: 構造整理・重複排除完了

---

## Phase 5: User Story 3 — データ管理の一元化 (Priority: P2)

**Goal**: グローバル変数排除、React Context によるデータ一元管理

**Independent Test**: `grep -rn "window\.__" src/` が 0 件。全コンポーネントが Context/Hook 経由でデータアクセス。

### Implementation for User Story 3

- [x] T021 [US3] Wrap webview tank-panel App component with SpriteUriMapProvider in src/webview/tank-panel/ entry point
- [x] T022 [P] [US3] Wrap webview companion App component with SpriteUriMapProvider (if applicable) in src/webview/companion/
- [x] T023 [US3] Update SpriteUriMapProvider to receive data from extension init message and populate Context
- [x] T024 [US3] Verify all webview components access sprite data and game state exclusively through Context/Hooks — no direct window or global variable access

**Checkpoint**: データ管理一元化完了

---

## Phase 6: User Story 4 — 過剰な複雑性のシンプル化 (Priority: P3)

**Goal**: 水質フリーズ簡素化、重複スタイル共有化

**Independent Test**: 水質フリーズが Set ベースで動作し、既存テストがパスすること

### Implementation for User Story 4

- [x] T025 [US4] Refactor water freeze mechanism in src/game/engine.ts — replace waterQualityFrozen boolean + waterChangeOwnerId with Set<string> waterFreezers
- [x] T026 [US4] Update all callers of setWaterQualityFrozen() to pass ownerId consistently (src/providers/tank-panel.ts, etc.)
- [x] T027 [P] [US4] Verify GameStateSnapshot still correctly reports water freeze state after refactor

**Checkpoint**: 簡素化完了

---

## Phase 7: リグレッションテスト追加

**Purpose**: 主要フローのテストカバレッジ確保

- [x] T028 [P] Add regression tests for timer/pomodoro flow in test/
- [x] T029 [P] Add regression tests for fish management (add, rename, remove, health) in test/
- [x] T030 [P] Add regression tests for store purchase flow in test/
- [x] T031 [P] Add regression tests for moss cleaning action in test/
- [x] T032 [P] Add regression tests for persistence/migration (globalState save/load, key rename migration) in test/

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 最終検証とクリーンアップ

- [x] T033 Run full test suite: `npm test`
- [x] T034 [P] Run lint check: `npm run lint` — fix any remaining issues
- [x] T035 [P] Run build: `npm run compile` — verify esbuild bundles correctly
- [x] T036 Verify `any` count: `grep -rn "as any\|: any\|<any>" src/` — only eslint-disable exceptions allowed
- [x] T037 Verify no duplicate definitions: check buildSpriteUriMap, SpriteUriMap, Accordion styles
- [x] T038 Verify no window globals: `grep -rn "window\.__" src/` — must be 0
- [x] T039 Run quickstart.md validation steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T003) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2), can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2), specifically T005/T009 for Context setup
- **User Story 4 (Phase 6)**: Depends on Foundational (Phase 2), independent of US1-US3
- **Regression Tests (Phase 7)**: Can start after Phase 2, incrementally added as stories complete
- **Polish (Phase 8)**: Depends on all stories complete

### User Story Dependencies

- **US1 (命名・型)**: Independent after Phase 2
- **US2 (構造・責務)**: Independent after Phase 2, parallel with US1
- **US3 (データ管理)**: Depends on Phase 2 T005/T009 (Context + message setup)
- **US4 (簡素化)**: Independent after Phase 2

### Parallel Opportunities

- T002, T003 can run in parallel with T001 (different files)
- T005, T006, T008 can run in parallel (different files)
- T011, T012, T013 can run in parallel (different directories)
- T015, T016, T017 can run in parallel (different game files)
- T028-T032 can all run in parallel (separate test files)

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Setup (新規共有ファイル作成)
2. Complete Phase 2: Foundational (型統合・重複排除の基盤)
3. Complete Phase 3: US1 (命名・型の統一)
4. Complete Phase 4: US2 (構造・責務の整理)
5. **STOP and VALIDATE**: ビルド・テスト・lint パス確認

### Full Delivery

6. Complete Phase 5: US3 (データ管理一元化)
7. Complete Phase 6: US4 (簡素化)
8. Complete Phase 7: リグレッションテスト追加
9. Complete Phase 8: Polish & 最終検証

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Commit after each phase checkpoint
- 全フェーズで `npm test && npm run lint` を随時確認
- globalState キーやメッセージ type を変更した場合はマイグレーション関数を更新
