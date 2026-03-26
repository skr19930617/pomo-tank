# Tasks: MUI & CSS Framework Migration

**Input**: Design documents from `/specs/012-mui-css-migration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md

**Organization**: Tasks are grouped by user story. US1 (component migration) and US2 (CSS architecture) are tightly coupled — when migrating a component to MUI, inline styles are simultaneously replaced with sx/theme. US2's dedicated phase handles the final cleanup (style.css stripping, verification).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Install MUI dependencies and create the MUI theme definition.

- [x] T001 Install MUI and Emotion dependencies: run `npm install @mui/material @emotion/react @emotion/styled` in project root (updates `package.json` and `package-lock.json`)
- [x] T002 Create MUI theme file at `src/webview/tank-panel/theme.ts`: define `createTheme()` with dark mode, custom palette mapping all current hardcoded colors (see research.md R3 palette table), typography with `fontFamily: "'PixelFont', monospace"` and base fontSize 8px, and component overrides to disable ripple effects on Button. Extend MUI's PaletteOptions type to include custom slots: `background.panel`, `text.bright`, `border.main`, `border.dark`, `debug.main`, `debug.dark`, `debug.light`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wire ThemeProvider and CssBaseline into both webview entry points so all child components can access the theme.

**CRITICAL**: No component migration can begin until this phase is complete.

- [x] T003 Update `src/webview/tank-panel/index.tsx`: wrap `<App />` with `<ThemeProvider theme={theme}>` and add `<CssBaseline />` inside it. Import theme from `./theme`. CssBaseline replaces the body styles from style.css.
- [x] T004 [P] Update `src/webview/companion/index.tsx`: wrap `<App />` with `<ThemeProvider theme={theme}>` and `<CssBaseline />`. Import theme from the tank-panel theme file (shared theme).

**Checkpoint**: Both entry points render with MUI ThemeProvider. Build succeeds. Visual appearance unchanged (CssBaseline applies body dark background from theme).

---

## Phase 3: User Story 1 - Core UI Component Migration to MUI (Priority: P1) MVP

**Goal**: Replace all HTML elements in each component with MUI equivalents, using `sx` prop with theme references instead of inline styles.

**Independent Test**: Open tank panel → navigate store, settings, debug panel → all interactive elements look and behave identically to pre-migration.

### Implementation for User Story 1

- [x] T005 [US1] Migrate `src/webview/tank-panel/App.tsx`: Replace the container `<div>` with `<Box>`, the Store `<button>` with MUI `<Button>` (variant="outlined"), the notification `<div>` with MUI `<Snackbar>` (anchorOrigin top-center, autoHideDuration=3000). Remove `notificationStyle` and `loadingStyle` const objects — replace with `sx` props referencing theme palette. Keep TankScene and Konva-related props untouched.
- [x] T006 [US1] Migrate `src/webview/tank-panel/components/Store.tsx`: Replace overlay `<div>` with MUI `<Drawer>` (anchor="top", variant="temporary", fullscreen) or `<Box>` with `sx` positioning. Replace close `<button>` with MUI `<IconButton>` or `<Button>`. Replace Buy/Locked `<button>`s with MUI `<Button>` (variant="outlined", disabled state). Replace layout `<div>`s with `<Box>`, text `<span>`s with `<Typography>`. Remove all 7 named style objects (`overlayStyle`, `sectionStyle`, `headingStyle`, `itemRowStyle`, `buyBtnStyle`, `lockedBtnStyle`, `closeBtnStyle`) and inline style objects — replace with `sx` props using `theme.palette.*` references.
- [x] T007 [US1] Migrate `src/webview/tank-panel/components/SettingsPanel.tsx`: Replace the collapsible header/body pattern with MUI `<Accordion>`, `<AccordionSummary>`, `<AccordionDetails>`. Replace `<input type="number">` with MUI `<TextField>` (type="number", size="small"). Replace `<label>` with `<Typography>`. Remove all 4 named style objects (`headerStyle`, `bodyStyle`, `rowStyle`, `inputStyle`) — replace with `sx` props.
- [x] T008 [P] [US1] Migrate `src/webview/tank-panel/components/DebugPanel.tsx`: Replace `<div>`s with `<Box>`, `<button>`s with MUI `<Button>`, `<input>` with MUI `<TextField>`. Remove all 6 named style objects (`panelStyle`, `labelStyle`, `rowStyle`, `inputStyle`, `buttonStyle`, `dangerButtonStyle`) — replace with `sx` props using `theme.palette.debug.*` for the orange accent colors.
- [x] T009 [P] [US1] Migrate `src/webview/tank-panel/components/FishPreview.tsx`: Wrap the sprite `<div>` in MUI `<Box>` with `sx` prop. Keep the `backgroundImage`, `backgroundPosition`, `backgroundSize`, and `imageRendering: 'pixelated'` CSS properties in the `sx` prop (these have no MUI equivalent). Remove the inline style object.
- [x] T010 [US1] Migrate `src/webview/companion/App.tsx`: Replace `<div>`s with `<Box>`, inline style objects with `sx` props using theme references. Ensure Konva TankScene usage is untouched.

**Checkpoint**: All HTML-based components use MUI components. All inline style objects removed. Build succeeds. Visual appearance identical.

---

## Phase 4: User Story 2 - Scalable CSS Architecture (Priority: P2)

**Goal**: Strip the raw CSS file to minimal rules, verify zero inline styles remain, confirm all colors come from theme.

**Independent Test**: Grep for `React.CSSProperties` in migrated files — zero matches. Grep for hardcoded hex colors (#) in migrated component files — only in pixel-icons.tsx (shared icon data, not styling) and timer-theme.ts (Konva colors).

### Implementation for User Story 2

- [x] T011 [US2] Strip `media/webview/tank-detail/style.css` down to only: universal reset (`* { margin: 0; padding: 0; box-sizing: border-box; }`), canvas pixelated rendering (`canvas { image-rendering: pixelated; image-rendering: crisp-edges; }`). Remove all other rules (`.action-btn`, `.store-item`, `#store-panel`, `#stats-bar`, `#actions`, `#notification`, `.light-btn`, `.store-btn`, `.store-category`, `.store-item-*` classes, and the PixelFont comment). Body styling is now handled by CssBaseline + theme.
- [x] T012 [US2] Verify no inline `React.CSSProperties` style objects remain in migrated files: audit `App.tsx`, `Store.tsx`, `SettingsPanel.tsx`, `DebugPanel.tsx`, `FishPreview.tsx`, companion `App.tsx`. If any remain, convert to `sx` props.
- [x] T013 [US2] Verify theme completeness: check that `theme.ts` contains all color values previously hardcoded. Ensure no component file contains hex color literals (except pixel-icons.tsx for icon colors and timer-theme.ts for Konva canvas colors which are outside MUI's scope).

**Checkpoint**: style.css is minimal. All styling flows through MUI theme + sx. No hardcoded colors in component files.

---

## Phase 5: User Story 3 - Konva Canvas Components Remain Unchanged (Priority: P3)

**Goal**: Verify zero modifications to Konva canvas components.

**Independent Test**: `git diff` on Konva files shows no changes. Open tank panel and verify HUD, fish, tank, action bar render correctly.

### Verification for User Story 3

- [x] T014 [US3] Verify via `git diff` that no Konva canvas component files have been modified: `TankScene.tsx`, `HudOverlay.tsx`, `ActionBar.tsx`, `Fish.tsx`, `Tank.tsx`, `Wall.tsx`, `Desk.tsx`, `Light.tsx`, `FishTooltip.tsx`, `PixelText.tsx`, `PixelButton.tsx`, `pixel-font-data.ts`, `sprite-sheet-utils.ts`. If any are modified, revert the changes.

**Checkpoint**: All Konva files unchanged. Canvas rendering verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final build validation and cleanup.

- [x] T015 Run `npm run build` and fix any TypeScript or esbuild errors across all modified files
- [x] T016 Run `npm run lint` and fix any ESLint errors introduced by MUI imports or sx prop usage
- [x] T017 Perform manual visual testing per quickstart.md checklist: verify all 12 test scenarios pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001, T002) — BLOCKS all component migration
- **US1 (Phase 3)**: Depends on Phase 2 completion — core migration
- **US2 (Phase 4)**: Depends on US1 completion — cleanup and verification
- **US3 (Phase 5)**: Can run after Phase 2 — independent verification, but best run last
- **Polish (Phase 6)**: Depends on US1 + US2 completion

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2. Core MVP — all component files migrated.
- **US2 (P2)**: Depends on US1 completion (can't strip CSS until components are migrated).
- **US3 (P3)**: Independent verification. No code changes. Best run after US1/US2.

### Within US1 (Component Migration)

- T005 (App.tsx) first — establishes the pattern for other components
- T006 (Store.tsx) and T007 (SettingsPanel.tsx) can follow in any order
- T008 (DebugPanel.tsx) and T009 (FishPreview.tsx) can run in parallel [P]
- T010 (companion App.tsx) can run in parallel with T006-T009

### Parallel Opportunities

- T003 and T004 can run in parallel (different entry point files)
- T008 and T009 can run in parallel (different component files, no shared state)
- T008/T009 and T010 can run in parallel (different webview bundles)

---

## Parallel Example: User Story 1

```text
# After Phase 2 foundation is complete:

# Sequential: Establish pattern
Task T005: Migrate App.tsx (establishes sx/theme pattern)

# Sequential: Complex components
Task T006: Migrate Store.tsx
Task T007: Migrate SettingsPanel.tsx

# Parallel: Independent components
Task T008: Migrate DebugPanel.tsx
Task T009: Migrate FishPreview.tsx

# Parallel with above: Different webview
Task T010: Migrate companion App.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T004)
3. Complete Phase 3: User Story 1 (T005-T010)
4. **STOP and VALIDATE**: Build succeeds, all components use MUI, visual appearance unchanged
5. Proceed to US2 (cleanup) and US3 (verification)

### Recommended Execution Order (Single Developer)

1. T001 → T002 → T003+T004 (parallel)
2. T005 → T006 → T007 → T008+T009 (parallel) → T010
3. T011 → T012 → T013
4. T014
5. T015 → T016 → T017

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- US1 and US2 are naturally coupled: migrating a component (US1) inherently replaces its inline styles (US2). US2's phase is for final CSS cleanup and verification.
- pixel-icons.tsx is NOT migrated (box-shadow technique has no MUI equivalent) — it remains as-is
- Konva component files must have zero git diff (US3 verification)
- Commit after each component migration for easy rollback
