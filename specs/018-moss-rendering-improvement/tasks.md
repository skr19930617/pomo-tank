# Tasks: 苔の表現の向上

**Input**: Design documents from `/specs/018-moss-rendering-improvement/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: Not explicitly requested. Existing tests must pass (`npm test`, `npm run lint`).

**Organization**: This feature is a single user story (visual rendering change). Tasks are organized by implementation phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Branch and project structure confirmation

- [x] T001 Confirm feature branch `018-moss-rendering-improvement` is active and clean

**Checkpoint**: Branch ready for development

---

## Phase 2: User Story 1 - ドットパターン苔オーバーレイの実装 (Priority: P1) 🎯 MVP

**Goal**: 水槽の苔描画を底部矩形から全面ドットパターンに変更し、`algaeLevel` に応じて5段階でドット密度が増加、魚の前面に描画される

**Independent Test**: Debug mode で `algaeLevel` を 0, 20, 40, 60, 80, 100 に設定し、各段階のドット密度と魚の視認性を確認

### Implementation for User Story 1

- [x] T002 [US1] Create AlgaeOverlay component with PRNG dot generation in `src/webview/tank-panel/components/AlgaeOverlay.tsx`
  - mulberry32 PRNG implementation (fixed seed)
  - Generate MAX_DOTS (850) dot positions with x, y, size, threshold
  - Konva Shape `sceneFunc` for Canvas API direct rendering
  - useMemo for dot coordinate caching (tankWidth/tankHeight dependent)
  - 5-stage opacity interpolation (0.3→0.7)
  - Dots only render when `threshold <= algaeLevel`
- [x] T003 [US1] Remove existing algae Rect strip from `src/webview/tank-panel/components/Tank.tsx`
  - Delete the algae Rect element (lines 95-105)
  - Remove `algaeLevel` from TankProps interface and component parameters (no longer needed in Tank)
- [x] T004 [US1] Integrate AlgaeOverlay into TankScene after Fish rendering in `src/webview/tank-panel/components/TankScene.tsx`
  - Import AlgaeOverlay component
  - Place AlgaeOverlay after fish map and before fish tooltip, inside the tank Group
  - Pass `algaeLevel`, `tankWidth` (rawTankW), `tankHeight` (rawTankH) props
  - Remove `algaeLevel` prop from Tank component usage (if removed from Tank interface in T003)

**Checkpoint**: Algae renders as dots across tank, density increases with algaeLevel, fish obscured at high levels

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Validation and cleanup

- [x] T005 Run `npm run lint` and fix any lint errors (pre-existing Wall.tsx error only, no new issues)
- [x] T006 Run `npm test` and fix any test failures (no test files exist — pre-existing)
- [ ] T007 Visual verification: confirm 5 stages are visually distinct at algaeLevel 10, 30, 50, 70, 90

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **User Story 1 (Phase 2)**: T002 can start immediately. T003 is independent of T002 (different file). T004 depends on T002 and T003.
- **Polish (Phase 3)**: Depends on Phase 2 completion

### Parallel Opportunities

- T002 and T003 can run in parallel (different files, no dependencies)
- T005 and T006 can run in parallel

---

## Implementation Strategy

### MVP (Phase 1 + Phase 2)

1. T001: Confirm branch
2. T002 + T003 in parallel: Create AlgaeOverlay + Remove old algae Rect
3. T004: Integrate into TankScene
4. **VALIDATE**: Visual check at each algaeLevel stage
5. T005 + T006: Lint + Test

### Key Design Decisions (from research.md)

- **PRNG**: mulberry32 for deterministic dot positions (no external dependency)
- **Rendering**: Konva Shape sceneFunc for Canvas API direct draw (avoids 850+ React nodes)
- **Layer order**: AlgaeOverlay placed after Fish in TankScene JSX = rendered in front of fish

---

## Notes

- Existing game logic (deterioration.ts, health.ts, engine.ts, maintenance-quality.ts) must NOT be modified
- ActionBar and status bar algae displays remain unchanged
- Dot pattern must be stable across frames (same algaeLevel = same visual)
- algaeLevel 0 = no dots visible
