# Tasks: CI Lint & Format Checks

**Input**: Design documents from `/specs/004-ci-lint-format/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Not requested in feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install all new dependencies required for ESLint and Prettier

- [x] T001 Install devDependencies: eslint, @eslint/js, typescript-eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-config-prettier, globals, prettier via `npm install --save-dev` and verify package.json and package-lock.json are updated

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create ESLint and Prettier configuration files that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Create ESLint flat config at eslint.config.mjs with: typescript-eslint recommended rules for `**/*.ts` and `**/*.tsx` files, eslint-plugin-react settings (react-jsx runtime), eslint-plugin-react-hooks flat/recommended, eslint-config-prettier as last config entry, and ignores for `dist/`, `node_modules/`
- [x] T003 [P] Create Prettier config at .prettierrc.json with standard formatting options (semi, singleQuote, tabWidth, trailingComma, printWidth)
- [x] T004 [P] Create Prettier ignore file at .prettierignore excluding: node_modules/, dist/, *.md, coverage/, .specify/, specs/
- [x] T005 Update package.json scripts: change `lint` to `eslint src/` (remove `--ext .ts`), add `lint:fix` as `eslint src/ --fix`, add `format:check` as `prettier --check "src/**/*.{ts,tsx}" "**/*.{json,yml,css}" --ignore-path .prettierignore`, add `format` as `prettier --write "src/**/*.{ts,tsx}" "**/*.{json,yml,css}" --ignore-path .prettierignore`

**Checkpoint**: ESLint and Prettier configs are in place. `npm run lint` and `npm run format:check` can be run locally (may report violations in existing code).

---

## Phase 3: User Story 1 - Automated Code Quality Gate on PRs (Priority: P1) 🎯 MVP

**Goal**: CI pipeline checks ESLint and Prettier on every PR targeting main, with separate steps for each tool.

**Independent Test**: Open a PR → verify CI runs → introduce a lint violation → verify CI fails → fix it → verify CI passes.

### Implementation for User Story 1

- [x] T006 [US1] Auto-fix existing code by running `npm run lint:fix` and `npm run format` across the entire codebase, then review and commit all changes as a single batch
- [x] T007 [US1] Verify existing code passes both checks by running `npm run lint` and `npm run format:check` — both must exit 0 with no violations. Fix any remaining issues that auto-fix could not resolve.
- [x] T008 [US1] Create GitHub Actions workflow at .github/workflows/lint.yml with: trigger on `pull_request` targeting main, single job using ubuntu-latest, steps for actions/checkout@v4, actions/setup-node@v4 with node-version 18 and cache npm, `npm ci`, separate named step "ESLint" running `npm run lint`, separate named step "Prettier" running `npm run format:check`

**Checkpoint**: Push this branch → open a PR → verify the lint.yml workflow triggers and both ESLint and Prettier steps run as separate checks.

---

## Phase 4: User Story 2 - CI Runs on Main Branch Pushes (Priority: P2)

**Goal**: The same lint and format checks also run on pushes to the main branch.

**Independent Test**: Push a commit to main → verify CI workflow triggers and reports results.

### Implementation for User Story 2

- [x] T009 [US2] Update .github/workflows/lint.yml trigger to also include `push` on `branches: [main]` alongside the existing `pull_request` trigger

**Checkpoint**: Merge to main → verify CI workflow triggers on the push event.

---

## Phase 5: User Story 3 - Local Development Consistency (Priority: P3)

**Goal**: Developers can run the same lint and format checks locally and get identical results to CI.

**Independent Test**: Run `npm run lint` and `npm run format:check` locally → compare output expectations with what CI produces.

### Implementation for User Story 3

- [x] T010 [US3] Verify local commands match CI by running `npm run lint` and `npm run format:check` locally and confirming they use the same configs and produce the same pass/fail results as the GitHub Actions workflow

**Checkpoint**: Local `npm run lint && npm run format:check` produces identical pass/fail behavior to CI.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [x] T011 Run full validation: execute `npm run lint`, `npm run format:check`, and `npm test` to confirm all checks pass and no existing tests are broken
- [x] T012 Document branch protection setup: add a note in specs/004-ci-lint-format/quickstart.md with instructions for configuring GitHub Branch Protection to require the lint workflow as a required status check before merging PRs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (Phase 2) — auto-fix needs configs to exist
- **US2 (Phase 4)**: Depends on US1 (T008 creates the workflow file that T009 modifies)
- **US3 (Phase 5)**: Depends on Foundational (Phase 2) — local scripts are created in T005
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 2. Creates the workflow file.
- **User Story 2 (P2)**: Depends on US1 (modifies the workflow file created in T008)
- **User Story 3 (P3)**: Depends on Phase 2 only. Can run in parallel with US1.

### Within Each User Story

- Auto-fix (T006) before verification (T007) before workflow creation (T008)
- Each story can be validated at its checkpoint

### Parallel Opportunities

- T002, T003, T004 can all run in parallel (different files)
- US1 and US3 can proceed in parallel after Phase 2 (US3 depends only on Phase 2, not US1)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch all config file tasks together:
Task: "Create ESLint flat config at eslint.config.mjs"
Task: "Create Prettier config at .prettierrc.json"
Task: "Create Prettier ignore file at .prettierignore"
# Then sequentially:
Task: "Update package.json scripts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Install dependencies (T001)
2. Complete Phase 2: Create all config files (T002–T005)
3. Complete Phase 3: Auto-fix code, verify, create workflow (T006–T008)
4. **STOP and VALIDATE**: Open a PR and verify CI runs with separate ESLint and Prettier steps
5. This alone delivers the core value — automated code quality gate on PRs

### Incremental Delivery

1. Setup + Foundational → Configs and scripts ready
2. Add US1 → PR checks work → Deploy (MVP!)
3. Add US2 → Main branch pushes also checked (single-line workflow change)
4. Add US3 → Verify local dev parity (validation only)
5. Polish → Final validation + branch protection docs

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US2 is intentionally small (single workflow trigger change) because the workflow is created in US1
- US3 is mostly validation — the local scripts are created in the Foundational phase (T005) since CI depends on them too
- Commit after each task or logical group
- The auto-fix batch commit (T006) should be a dedicated commit separate from config changes for clean git history
