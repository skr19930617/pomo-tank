# Tasks: Pomotank MVP

**Input**: Design documents from `/specs/001-pomotank-mvp/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, build tooling, and extension manifest

- [x] T001 Initialize npm project with package.json including VSCode extension manifest (engine, activationEvents, contributes.views, contributes.commands, contributes.configuration) per contracts/extension-contributions.md in package.json
- [x] T002 [P] Configure TypeScript with tsconfig.json targeting ES2022, moduleResolution bundler, strict mode, outDir dist/
- [x] T003 [P] Configure esbuild build script for extension bundling (src/extension.ts entry point, external vscode) in esbuild.mjs
- [x] T004 [P] Add dev dependencies: @types/vscode, typescript, esbuild, vitest, @vscode/test-electron in package.json
- [x] T005 [P] Add npm scripts: build, watch, test:unit, test:integration, test, lint, package in package.json
- [x] T006 [P] Create .vscodeignore and .gitignore for extension packaging
- [x] T007 Create directory structure: src/game/, src/providers/, src/activity/, src/ui/, src/persistence/, media/webview/companion/, media/webview/tank-detail/, media/sprites/fish/, media/sprites/tank/, media/sprites/ui/, test/unit/, test/integration/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, persistence layer, and extension entry point skeleton that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Define all game state TypeScript types and enums (TankSizeTier, HealthState, FishSpecies catalog, Filter catalog, StoreItemType, GameState root interface, PlayerProfile, Tank, Fish, StoreItem) in src/game/state.ts
- [x] T009 Implement initial state factory function createInitialState() that returns a new GameState with Nano tank, one Guppy, Basic Sponge filter, zero pomo, and current timestamp in src/game/state.ts
- [x] T010 Implement globalState persistence wrapper with save(state), load(), and clear() methods using ExtensionContext.globalState in src/persistence/storage.ts
- [x] T011 Create extension entry point skeleton with activate() and deactivate() functions, registering commands, webview providers, and starting the game engine in src/extension.ts

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — First-Time Setup & Passive Aquarium Companion (Priority: P1) 🎯 MVP

**Goal**: Display a pixel-art aquarium in the Explorer view container with real-time tank deterioration (hunger, dirtiness, algae) that accelerates slightly during active coding.

**Independent Test**: Install extension → companion view appears in Explorer with Nano tank and one Guppy → over time, hunger/dirtiness/algae values increase → active coding increases rates slightly.

### Implementation for User Story 1

- [x] T012 [P] [US1] Implement hunger deterioration formula: per-tick hunger increase per fish based on species.hungerRate × activityMultiplier (1.0 idle, 1.15 active) in src/game/deterioration.ts
- [x] T013 [P] [US1] Implement water dirtiness deterioration formula: sum of all fish dirtinessLoad × (1 - filter.efficiency) per tick in src/game/deterioration.ts
- [x] T014 [P] [US1] Implement algae deterioration formula: baseAlgaeRate + (waterDirtiness/100) × dirtyAlgaeBonus per tick in src/game/deterioration.ts
- [x] T015 [US1] Implement applyTick(state, isActiveCoding) function that applies all three deterioration formulas, clamps values to 0–100, and returns updated state in src/game/deterioration.ts
- [x] T016 [US1] Implement offline catch-up: calculateOfflineDeteriation(state, now) that computes min(elapsed, 24h) worth of ticks and applies them in batch in src/game/engine.ts
- [x] T017 [US1] Implement game engine with start(), stop(), tick() methods: 60-second setInterval, calls applyTick, saves state via persistence, and notifies subscribers in src/game/engine.ts
- [x] T018 [US1] Implement activity tracker: listen to vscode.workspace.onDidChangeTextDocument, track rolling 2-minute window, expose isActivelyCoding() in src/activity/tracker.ts
- [x] T019 [US1] Implement WebviewViewProvider for companion view (pomotank.companionView): register in Explorer container, serve companion HTML, handle postMessage for state updates in src/providers/companion-view.ts
- [x] T020 [US1] Create companion webview HTML with Canvas element, basic CSS for pixel-art rendering at correct size in media/webview/companion/index.html and media/webview/companion/style.css
- [x] T021 [US1] Implement companion webview JS: Canvas rendering loop (requestAnimationFrame), draw tank background, fish sprites (placeholder rectangles for MVP), water tint based on dirtiness, algae overlay based on algaeLevel, listen for stateUpdate messages in media/webview/companion/main.js
- [x] T022 [US1] Wire up extension.ts: on activate, load state (or create initial), run offline catch-up, start game engine, register companion WebviewViewProvider, start activity tracker in src/extension.ts

**Checkpoint**: At this point, the extension should activate, show an aquarium in Explorer, and deterioration should tick in real time. This is the MVP.

---

## Phase 4: User Story 2 — Break-Time Maintenance Actions (Priority: P1)

**Goal**: When tank conditions are poor, fish show speech bubble cues and the status bar shows tank state. Clicking the companion opens a detailed tank panel where users can Feed Fish, Change Water, and Clean Algae.

**Independent Test**: Wait for deterioration → fish speech bubbles appear → status bar shows state → click companion → detailed view opens in editor tab → perform each action → tank state improves visually.

### Implementation for User Story 2

- [x] T023 [P] [US2] Implement three maintenance action functions: feedFish(state), changeWater(state), cleanAlgae(state) returning updated state per data-model.md action effects in src/game/engine.ts
- [x] T024 [P] [US2] Implement status bar item: create StatusBarItem showing tank state summary (emoji/text for hunger, dirtiness, algae), tooltip with details, click triggers pomotank.openTank command in src/ui/status-bar.ts
- [x] T025 [US2] Implement WebviewPanel provider for detailed tank view (pomotank.tankDetail): opens as editor tab, serves tank-detail HTML, handles bidirectional messages for maintenance actions per message protocol in contracts/ in src/providers/tank-panel.ts
- [x] T026 [US2] Create detailed tank view HTML/CSS with larger Canvas, three maintenance action buttons (Feed Fish, Change Water, Clean Algae), and tank stats display in media/webview/tank-detail/index.html and media/webview/tank-detail/style.css
- [x] T027 [US2] Implement detailed tank view JS: larger Canvas rendering (fish, tank, water, algae), speech bubble rendering when conditions are poor (hunger > 50, dirtiness > 50, algae > 60), button click handlers sending feedFish/changeWater/cleanAlgae messages, listen for stateUpdate and actionResult messages in media/webview/tank-detail/main.js
- [x] T028 [US2] Add speech bubble rendering to companion webview: draw small speech bubble icons on fish when hunger > 50 or tank conditions are poor in media/webview/companion/main.js
- [x] T029 [US2] Register maintenance action commands (pomotank.feedFish, pomotank.changeWater, pomotank.cleanAlgae, pomotank.openTank) in extension.ts, wiring each to engine action functions and state persistence in src/extension.ts
- [x] T030 [US2] Wire status bar creation on activate, update on each game tick and after maintenance actions in src/extension.ts

**Checkpoint**: Users can now see tank status, receive visual cues, open the detailed view, and perform all three maintenance actions. Core interaction loop complete.

---

## Phase 5: User Story 3 — Pomo Points & Progression Rewards (Priority: P2)

**Goal**: Maintenance actions award pomo points with timing bonuses (near 25-minute break window), streak multipliers, and daily continuity bonuses. Points are displayed and spendable.

**Independent Test**: Perform maintenance → points awarded → perform near 25min mark → bonus applied → consecutive sessions → streak multiplier increases → return next day → daily bonus.

### Implementation for User Story 3

- [x] T031 [P] [US3] Implement point calculation: calculatePoints(timeSinceLastMaintenance, currentStreak, isFirstMaintenanceToday, dailyContinuityDays) returning {points, timingBonus, streakMultiplier, dailyBonus} per data-model.md formulas in src/game/points.ts
- [x] T032 [P] [US3] Implement session timer: track sessionStartTime, reset after maintenance action, expose timeSinceLastMaintenance() and isInBreakWindow() in src/game/engine.ts
- [x] T033 [US3] Implement streak tracking: increment currentStreak on well-timed maintenance (20-30min window), reset on poor timing or neglect, update dailyContinuityDays on first daily maintenance in src/game/points.ts
- [x] T034 [US3] Integrate point awarding into maintenance action flow: after each action, calculate points, update pomoBalance and totalPomoEarned, send pointsAwarded message to webview in src/game/engine.ts
- [x] T035 [US3] Add pomo balance display and points-awarded feedback (animated +N notification) to detailed tank view in media/webview/tank-detail/main.js
- [x] T036 [US3] Add session timer and break window indicator to status bar tooltip and detailed tank view stats display in src/ui/status-bar.ts and media/webview/tank-detail/main.js

**Checkpoint**: Points system functional. Users earn pomo with bonuses, see their balance, and get feedback on timing.

---

## Phase 6: User Story 4 — Fish Health Deterioration & Consequences (Priority: P2)

**Goal**: Fish health transitions through Healthy → Warning → Sick → Dead based on sustained poor conditions. Death breaks streaks. Visual cues show health state.

**Independent Test**: Let conditions deteriorate → after ~2-3h fish show Warning → continued neglect → Sick → further neglect → Dead → streak resets.

### Implementation for User Story 4

- [x] T037 [US4] Implement fish health state machine: evaluateHealth(fish, tankConditions) that tracks sicknessTick counter, transitions Healthy→Warning (~2-3h poor), Warning→Sick (~3-4h more), Sick→Dead (~4-6h more), and recovery Warning→Healthy, Sick→Warning when conditions improve in src/game/health.ts
- [x] T038 [US4] Integrate health evaluation into game tick: call evaluateHealth for each fish after deterioration, handle dead fish removal, trigger streak reset on death in src/game/engine.ts
- [x] T039 [US4] Implement all-fish-dead recovery: when last fish dies, auto-grant a new starter Guppy, preserve tank upgrades and pomo balance per FR-024 in src/game/engine.ts
- [x] T040 [US4] Add health state visual indicators to companion and detailed webviews: Warning (subdued color/expression), Sick (grey tint, slow movement), Dead (float to top, fade out) in media/webview/companion/main.js and media/webview/tank-detail/main.js
- [x] T041 [US4] Add health state to status bar tooltip showing per-fish health summary in src/ui/status-bar.ts

**Checkpoint**: Health system complete. Fish visually deteriorate, die after sustained neglect, and users can recover.

---

## Phase 7: User Story 5 — Tank Upgrades & Fish Collection (Priority: P3)

**Goal**: Users spend pomo points in a store to upgrade tank sizes (Nano→XL), unlock filters, and buy new fish species (5 total). Tank size affects capacity and species eligibility.

**Independent Test**: Open store → see available items with prices → purchase tank upgrade → capacity increases → purchase new fish species → fish appears → purchase filter → dirtiness slows.

### Implementation for User Story 5

- [x] T042 [P] [US5] Define full store catalog: all 5 tank upgrades (Nano→Small→Medium→Large→XL with pomo costs), 4 filters (Basic Sponge free, Hang-On-Back, Canister, Premium Canister), 5 fish species (Guppy free, Neon Tetra, Corydoras, Betta, Angelfish) with costs and prerequisites in src/game/store.ts
- [x] T043 [P] [US5] Implement purchase validation: canPurchase(state, itemId) checking pomo balance, prerequisites (min tank size, not already owned for upgrades), tank capacity for fish, and returning {allowed, reason} in src/game/store.ts
- [x] T044 [US5] Implement purchase execution: executePurchase(state, itemId) that deducts pomo, applies upgrade (resize tank, equip filter, add fish), adds to unlockedItems, returns updated state and schooling warning if applicable in src/game/store.ts
- [x] T045 [US5] Implement tank capacity enforcement: getCurrentLoad(state), getCapacity(sizeTier), and block fish purchase when at capacity in src/game/store.ts
- [x] T046 [US5] Implement schooling warning: when purchasing a fish with schoolingMin > 1 and fewer than schoolingMin of that species in tank, return soft warning message in purchase result in src/game/store.ts
- [x] T047 [US5] Create store UI section in detailed tank view: item list grouped by type (Tanks, Filters, Fish), showing name, cost, affordable/locked state, purchase button, and prerequisite info in media/webview/tank-detail/main.js
- [x] T048 [US5] Handle purchaseItem messages from webview: validate, execute purchase, save state, send purchaseResult and stateUpdate messages back in src/providers/tank-panel.ts
- [x] T049 [US5] Register pomotank.openStore command and add store toggle button to detailed tank view in src/extension.ts and media/webview/tank-detail/main.js
- [x] T050 [US5] Add optional VSCode notification support (pomotank.enableNotifications setting): show info notification when fish are hungry or tank needs care, gated by configuration in src/extension.ts

**Checkpoint**: Full progression system. Users can browse, buy, and apply upgrades. All 5 species and tank sizes available.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T051 [P] Create placeholder pixel-art sprite sheets: 5 fish species (16×16 or 32×32 sprite frames for idle/swim), tank backgrounds for each size tier, water/algae overlays, speech bubble icons, UI button sprites in media/sprites/
- [ ] T052 [P] Replace placeholder rectangle rendering with sprite sheet rendering in both companion and detailed webviews in media/webview/companion/main.js and media/webview/tank-detail/main.js
- [x] T053 Add edge case handling: maintenance on healthy tank awards 0 points, short sessions (<5min) suppress care cues, empty pomo balance shows locked store items in src/game/points.ts and media/webview/tank-detail/main.js
- [x] T054 Add configuration settings support: read pomotank.workSessionMinutes for break window timing, pomotank.showStatusBar for status bar visibility in src/extension.ts
- [x] T055 Run quickstart.md validation: verify build, watch, test:unit scripts work, extension activates in Extension Development Host, companion view renders

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — can start immediately after
- **US2 (Phase 4)**: Depends on Phase 3 (needs companion view and deterioration to exist)
- **US3 (Phase 5)**: Depends on Phase 4 (needs maintenance actions to award points)
- **US4 (Phase 6)**: Depends on Phase 3 (needs deterioration and game tick)
- **US5 (Phase 7)**: Depends on Phase 5 (needs pomo points to spend) and Phase 3 (needs tank/fish state)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Foundation only — no other story dependencies
- **US2 (P1)**: Depends on US1 (needs companion view, deterioration, game engine)
- **US3 (P2)**: Depends on US2 (needs maintenance actions to trigger point awards)
- **US4 (P2)**: Depends on US1 only (needs deterioration and game tick; independent of US2/US3)
- **US5 (P3)**: Depends on US3 (needs pomo balance to make purchases)

### Parallel Opportunities

**Within Phase 1**: T002, T003, T004, T005, T006 can all run in parallel after T001
**Within Phase 3**: T012, T013, T014 can run in parallel (different formulas, same file but independent functions)
**Within Phase 5**: T031, T032 can run in parallel
**Phase 4 + Phase 6**: US2 and US4 share no dependencies on each other once US1 is complete — however US2 must complete before US3
**Within Phase 7**: T042, T043 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch deterioration formulas in parallel (independent pure functions):
Task: "T012 Implement hunger deterioration formula in src/game/deterioration.ts"
Task: "T013 Implement water dirtiness formula in src/game/deterioration.ts"
Task: "T014 Implement algae formula in src/game/deterioration.ts"

# Then sequentially:
Task: "T015 Implement applyTick combining all formulas"
Task: "T016 Implement offline catch-up"
Task: "T017 Implement game engine"
# Webview can start in parallel with engine:
Task: "T019 WebviewViewProvider" + "T020 HTML/CSS" + "T021 JS rendering"
# Final wiring:
Task: "T022 Wire up extension.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Extension activates, aquarium renders, deterioration ticks
5. This alone proves the core technology works

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (passive companion) → Test → **Tech MVP**
3. US2 (maintenance actions) → Test → **Interaction MVP** (core loop complete)
4. US3 (points & progression) → Test → **Engagement MVP**
5. US4 (health consequences) → Test → **Stakes added**
6. US5 (store & upgrades) → Test → **Full MVP**
7. Polish → Test → **Release candidate**

### Critical Path

Setup → Foundation → US1 → US2 → US3 → US5 (longest chain)

US4 can be developed in parallel with US2/US3 once US1 is complete, as it only depends on the deterioration system.

---

## Notes

- [P] tasks = different files or independent functions, no dependencies
- [Story] label maps task to specific user story for traceability
- Sprite art (T051) can start at any point — it's purely visual assets
- Balancing constants (exact deterioration rates, point values, store prices) are tuning parameters; use data-model.md values as starting defaults
- All webview JS files are vanilla JavaScript (no framework) — keep rendering simple
- Game logic in src/game/ must have zero VSCode API imports for unit testability
