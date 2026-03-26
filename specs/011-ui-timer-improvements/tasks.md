# Tasks: UI & Timer Improvements

**Input**: Design documents from `/specs/011-ui-timer-improvements/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the timer theme constants file — the single source of truth for all timer colors and the overtime threshold. This is a new file with no dependencies.

- [x] T001 Create `src/shared/timer-theme.ts` with named color constants (`TIMER_COLOR_NORMAL = '#ffffff'`, `TIMER_COLOR_WARNING = '#ffcc44'`, `TIMER_COLOR_OVERTIME = '#ff4444'`, `TIMER_COLOR_BREAK = '#44dd44'`) and `OVERTIME_THRESHOLD_MINUTES = 5`. Export all as named exports.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, message contracts, persistence, and snapshot extensions that ALL user stories depend on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Add `UserSettings` interface (with `focusMinutes: number`, `breakMinutes: number`) and `TimerMode` type (`'focus' | 'break'`) to `src/shared/types.ts`. Add `DEFAULT_USER_SETTINGS` constant with defaults `{ focusMinutes: 25, breakMinutes: 5 }`. Add validation constants `FOCUS_MIN = 1, FOCUS_MAX = 120, BREAK_MIN = 0, BREAK_MAX = 60`.
- [x] T003 [P] Add `updateSettings` and `settingsUpdate` message types to `src/shared/messages.ts`. `WebviewToExtensionMessage` gains `{ type: 'updateSettings'; settings: Partial<UserSettings> }`. `ExtensionToWebviewMessage` gains `{ type: 'settingsUpdate'; settings: UserSettings }`.
- [x] T004 [P] Add `loadSettings()`, `saveSettings()`, and `withSettingsDefaults()` functions to `src/persistence/storage.ts`. Store under globalState key `pomotank.userSettings`. `withSettingsDefaults()` merges partial persisted data with `DEFAULT_USER_SETTINGS` for forward compatibility.
- [x] T005 [P] Extend `GameStateSnapshot.session` in `src/game/state.ts` with three new fields: `timerMode: TimerMode` (default `'focus'`), `breakRemainingMs: number` (default `0`), `breakMinutes: number` (default `5`).

**Checkpoint**: Foundation ready — shared types, messages, persistence, and snapshot contract are in place.

---

## Phase 3: User Story 1 - Timer Settings & Color Indicators (Priority: P1) MVP

**Goal**: Users can configure focus/break durations in a collapsible settings panel. Timer changes color based on elapsed time (white → yellow → red) and switches to green break countdown on maintenance actions.

**Independent Test**: Open tank panel → expand settings → set focus=25m/break=5m → let timer reach 25m (yellow) → 30m (red) → perform maintenance → green countdown → countdown ends → white count-up resumes.

### Implementation for User Story 1

- [x] T006 [US1] Add break timer state to `src/game/engine.ts`: add private fields `timerMode: TimerMode`, `breakStartTimestamp: number | null`, `breakDurationMs: number`. In maintenance action methods (`feedFish`, `changeWater`, `cleanAlgae`), after resetting `sessionStartTime`, set `timerMode = 'break'` and `breakStartTimestamp = Date.now()` if `breakMinutes > 0`. Add a `checkBreakExpiry()` method called in `createSnapshot()` that transitions back to focus mode when `breakRemainingMs <= 0`. Expose `timerMode` and `breakRemainingMs` in `createSnapshot()` session fields. Also handle light toggle: if in break mode and light toggled off, pause break similarly to focus pause.
- [x] T007 [US1] Update `src/providers/tank-panel.ts` to handle `updateSettings` message: validate values against min/max constants, call `saveSettings()`, update engine's `sessionMinutes` and `breakMinutes`, respond with `settingsUpdate` message. On `ready` message, also send `settingsUpdate` with current settings.
- [x] T008 [US1] Update `src/extension.ts` to load `UserSettings` via `loadSettings()` at activation. Pass `focusMinutes` as `sessionMinutes` to `GameEngine` constructor (replacing the hardcoded VSCode config read). Pass `breakMinutes` to engine as well (add constructor parameter).
- [x] T009 [US1] Extend `useTimer` hook in `src/webview/tank-panel/hooks/useTimer.ts`: accept new parameters `timerMode`, `breakRemainingMs`, `breakMinutes` from snapshot. When `timerMode === 'break'`, return countdown seconds (`breakRemainingMs / 1000`) instead of count-up. Add `timerColor` to return value: import theme constants from `timer-theme.ts`, compute color based on mode and elapsed time (normal/warning/overtime/break). Remove old inline `isOvertime` boolean — replace with the color-based approach.
- [x] T010 [P] [US1] Create `src/webview/tank-panel/hooks/useSettings.ts`: a hook that listens for `settingsUpdate` messages from the extension and exposes current `UserSettings` state + a `updateSetting(key, value)` function that sends `updateSettings` message to extension.
- [x] T011 [P] [US1] Create `src/webview/tank-panel/components/SettingsPanel.tsx`: a collapsible section with a clickable header row (e.g., "Settings" with expand/collapse chevron). When expanded, show two labeled number inputs: "Focus (min)" with value from settings.focusMinutes (min=1, max=120) and "Break (min)" with value from settings.breakMinutes (min=0, max=60). On input change, call `updateSetting()` from useSettings hook. Style with pixel-font class for consistency (will be activated in US4).
- [x] T012 [US1] Update `src/webview/tank-panel/components/HudOverlay.tsx`: replace inline color constants (`#ffffff`, `#ff4444`) with `timerColor` prop passed from TankScene. Accept new prop `timerColor: string`. Remove the internal `isOvertime ? '#ff4444' : '#ffffff'` logic.
- [x] T013 [US1] Update `src/webview/tank-panel/components/TankScene.tsx`: pass `timerColor` from useTimer to HudOverlay. Update useTimer call to include new snapshot session fields (`timerMode`, `breakRemainingMs`, `breakMinutes`).
- [x] T014 [US1] Update `src/webview/tank-panel/App.tsx`: import SettingsPanel component, render it below the Store button inside the main container. Import and use useSettings hook to provide settings state.
- [x] T015 [US1] Add settings panel styles to `media/webview/tank-detail/style.css`: collapsible header with cursor pointer, expand/collapse indicator, input fields styled for dark theme (dark background, light text, compact size), section padding and borders consistent with existing UI.

**Checkpoint**: Timer settings & color indicators fully functional. User can configure focus/break times, timer changes color at thresholds, break countdown works after maintenance actions.

---

## Phase 4: User Story 2 - Store Navigation: Back Button (Priority: P2)

**Goal**: Store overlay has a visible close/back button so users can return to the tank view.

**Independent Test**: Open store → verify back button visible in top-right → click it → store closes, tank view fully visible.

### Implementation for User Story 2

- [x] T016 [US2] Update `src/webview/tank-panel/components/Store.tsx`: add `onClose: () => void` prop. Render a close button ("X" or "← Back") in the top-right corner of the store overlay with fixed positioning within the overlay. Style with dark background, light text, hover effect, and pixel-font class.
- [x] T017 [US2] Update `src/webview/tank-panel/App.tsx`: pass `onClose={() => setStoreOpen(false)}` to the Store component.

**Checkpoint**: Store can be closed via back button with a single click.

---

## Phase 5: User Story 3 - Fish Animation Preview in Store (Priority: P3)

**Goal**: Each fish species row in the store shows a small animated sprite preview next to the species name.

**Independent Test**: Open store → scroll to fish species section → each species row shows a small animated fish sprite cycling through swim frames.

### Implementation for User Story 3

- [x] T018 [P] [US3] Create `src/webview/tank-panel/components/FishPreview.tsx`: a component that accepts `genusId` and `speciesId` props, looks up the swim sprite URI from `window.__SPRITE_URI_MAP__`, and renders a small animated preview using CSS sprite sheet animation. The sprite sheet is 6 columns × 2 rows (12 frames) at 64×64px per frame. Use a `<div>` with the sprite as `backgroundImage`, `background-size` scaled to show one frame, and a CSS `steps(12)` animation that shifts `background-position` through all 12 frames at ~8fps. Display size should be ~32×32px (half the sprite frame size).
- [x] T019 [US3] Add fish preview CSS to `media/webview/tank-detail/style.css`: define `@keyframes fish-sprite-anim` that shifts background-position horizontally through the full sprite sheet width. Add `.fish-preview` class with animation timing (`steps(12) 1.5s infinite`), overflow hidden, and display inline-block.
- [x] T020 [US3] Integrate FishPreview into `src/webview/tank-panel/components/Store.tsx`: for each store item where `item.type === StoreItemType.FishSpecies`, parse the composite `item.id` (format `genusId:speciesId`) and render a `<FishPreview>` component inline before the item name. Pass the sprite URI map from the global window object.

**Checkpoint**: Fish species in store show animated swim previews. UI remains responsive with multiple simultaneous animations.

---

## Phase 6: User Story 4 - Pixel-Style Font for UI Text (Priority: P4)

**Goal**: All HTML-based UI text (store, settings, buttons, tooltips, notifications) uses a consistent pixel/dot-style font.

**Independent Test**: Open tank panel → verify all text in store, settings, buttons, and notifications renders in pixel font with no system font fallback visible.

### Implementation for User Story 4

- [x] T021 [P] [US4] Add a pixel font .woff2 file to `media/webview/tank-detail/fonts/` (e.g., "Press Start 2P" or similar free pixel font). Ensure the font file is committed to the repository.
- [x] T022 [US4] Add `@font-face` declaration to `media/webview/tank-detail/style.css` referencing the font file via a `{{fontUri}}` placeholder (to be replaced with webview URI at runtime). Apply the pixel font to the root element and all UI text: `font-family: 'PixelFont', monospace;`. Adjust font-size where needed for legibility (pixel fonts typically need larger sizes than system fonts, e.g., 8-10px for body text).
- [x] T023 [US4] Update `src/providers/tank-panel.ts`: add `media/webview/tank-detail/fonts` to `localResourceRoots` array. In the HTML template generation, build a webview URI for the font file and inject it into the CSS (replace the `{{fontUri}}` placeholder in the style tag or link).

**Checkpoint**: All UI text uses pixel font consistently. Text remains legible at rendered sizes.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup across all user stories.

- [x] T024 Run `npm run lint` and fix any TypeScript or ESLint errors across all modified files
- [x] T025 Run `npm test` and fix any broken existing tests caused by interface changes (GameStateSnapshot, messages, etc.)
- [x] T026 Perform manual testing per quickstart.md checklist: verify all 10 test scenarios pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001) for timer-theme imports — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 completion — core MVP
- **US2 (Phase 4)**: Depends on Phase 2 completion — independent of US1
- **US3 (Phase 5)**: Depends on Phase 2 completion — independent of US1/US2
- **US4 (Phase 6)**: Depends on Phase 2 completion — independent of US1/US2/US3, but visually enhances all
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2. No dependencies on other stories. **MVP target.**
- **US2 (P2)**: Can start after Phase 2. Fully independent of US1.
- **US3 (P3)**: Can start after Phase 2. Fully independent of US1/US2. Modifies Store.tsx (coordinate with US2 if parallel).
- **US4 (P4)**: Can start after Phase 2. Fully independent. Applies font to all UI including components from US1-US3.

### Within Each User Story

- Extension host changes (engine.ts, tank-panel.ts) before webview changes (hooks, components)
- Hooks before components that consume them
- Core logic before styling

### Parallel Opportunities

- T003, T004, T005 can all run in parallel after T002 (different files)
- T010, T011 can run in parallel with each other (and with T006-T008 if different developers)
- T016 and T018 can run in parallel (different stories, different files)
- T021 can run in parallel with any other US4 task (font file addition)
- US2, US3, US4 can all start in parallel after Phase 2 if capacity allows

---

## Parallel Example: User Story 1

```text
# After Phase 2 foundation is complete:

# Sequential: Extension host changes first
Task T006: Add break timer state to engine.ts
Task T007: Add settings message handling to tank-panel.ts
Task T008: Update extension.ts to load settings

# Parallel: These two hooks are independent files
Task T010: Create useSettings hook in hooks/useSettings.ts
Task T011: Create SettingsPanel component in components/SettingsPanel.tsx

# Sequential: Depends on useTimer changes
Task T009: Extend useTimer hook with focus/break mode + color
Task T012: Update HudOverlay.tsx with timerColor prop
Task T013: Update TankScene.tsx to wire timerColor through

# Final wiring
Task T014: Update App.tsx with SettingsPanel
Task T015: Add settings CSS styles
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002-T005)
3. Complete Phase 3: User Story 1 (T006-T015)
4. **STOP and VALIDATE**: Test timer settings, color changes, and break countdown
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready
2. Add US1 (Timer Settings) → Test → Deploy (MVP!)
3. Add US2 (Store Back Button) → Test → Deploy
4. Add US3 (Fish Preview) → Test → Deploy
5. Add US4 (Pixel Font) → Test → Deploy
6. Phase 7: Polish → Final validation

### Recommended Execution Order (Single Developer)

1. T001 → T002 → T003+T004+T005 (parallel)
2. T006 → T007 → T008 → T009 → T010+T011 (parallel) → T012 → T013 → T014 → T015
3. T016 → T017
4. T018+T019 (parallel) → T020
5. T021 → T022 → T023
6. T024 → T025 → T026

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in same phase
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US2 and US3 both modify Store.tsx — if implementing in parallel, coordinate merge
