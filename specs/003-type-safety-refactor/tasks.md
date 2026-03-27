# Tasks: 型安全性の改善とWebviewリファクタリング

**Input**: Design documents from `/specs/003-type-safety-refactor/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Install dependencies and configure build pipeline for React + TypeScript webview

- [x] T001 Install React dependencies: `npm install react react-dom react-konva konva` and `npm install -D @types/react @types/react-dom` in `package.json`
- [x] T002 Update `tsconfig.json`: add `"jsx": "react-jsx"` to compilerOptions, add `"src/webview/**/*"` to include array
- [x] T003 Update `esbuild.mjs`: add 2 new webview entry points (src/webview/tank-panel/index.tsx → dist/webview-tank-panel.js, src/webview/companion/index.tsx → dist/webview-companion.js) with platform=browser, format=iife, jsx=automatic, and bundle React into each

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create shared type definitions that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create `src/shared/types.ts`: move TankSizeTier, HealthState, StoreItemType enums from state.ts; define ActionType union type ("feedFish" | "changeWater" | "cleanAlgae"); define FishSpeciesId, FilterId, StoreItemId union literal types; export TANK_RENDER_SIZES, DESK_HEIGHT, LIGHT_BAR_HEIGHT, TANK_CAPACITY, TANK_SIZE_ORDER constants
- [x] T005 Create `src/shared/messages.ts`: define ExtensionToWebviewMessage discriminated union (stateUpdate, actionResult, purchaseResult, lightToggleResult) and WebviewToExtensionMessage discriminated union (ready, feedFish, changeWater, cleanAlgae, toggleLight, purchaseItem, openTank) using types from shared/types.ts
- [x] T006 Update `src/game/state.ts`: remove moved enums/constants (re-export from shared/types.ts for backward compatibility), update GameStateSnapshot to use TankSizeTier instead of string for sizeTier, HealthState instead of string for healthState, StoreItemType instead of string for store item type, update Fish.speciesId to FishSpeciesId, Tank.filterId to FilterId | null

**Checkpoint**: `npm run build` succeeds — types compile correctly, re-exports maintain backward compatibility

---

## Phase 3: User Story 1 - 全ての文字列リテラルを型安全な定数に統一する (Priority: P1) 🎯 MVP

**Goal**: 50箇所以上のハードコード文字列を列挙型/定数に置換し、タイポ不可能なコードベースにする。

**Independent Test**: ビルド成功 + 全機能が変更前と同一動作。grepでハードコード文字列が0件。

### Implementation for User Story 1

- [x] T007 [US1] Update `src/game/engine.ts`: import ActionType from shared/types, change performAction parameter type to ActionType, replace all hardcoded action strings in switch cases with ActionType values, update isTankHealthy to use ActionType
- [x] T008 [US1] Update `src/game/store.ts`: import FishSpeciesId, FilterId, StoreItemId from shared/types, type-narrow all STORE_ITEMS/FISH_SPECIES/FILTERS accesses with proper null checks, fix sizeMap Record typing to use StoreItemId keys
- [x] T009 [P] [US1] Update `src/game/deterioration.ts`: import FishSpeciesId from shared/types, add null check for FISH_SPECIES[fish.speciesId] lookups with fallback
- [x] T010 [P] [US1] Update `src/game/health.ts`: verify HealthState enum import comes from shared/types (via state.ts re-export)
- [x] T011 [P] [US1] Update `src/extension.ts`: import HealthState from shared/types, replace hardcoded "Dead" string with HealthState.Dead
- [x] T012 [P] [US1] Update `src/ui/status-bar.ts`: verify HealthState import resolves correctly from shared/types via state.ts re-export

**Checkpoint**: `npm run build` succeeds. All game logic uses typed constants. grep for hardcoded action/message/ID strings returns 0 hits in src/.

---

## Phase 4: User Story 2 - GameStateSnapshotの型を厳密化する (Priority: P1)

**Goal**: Extension↔Webview通信の全メッセージを判別共用体で型安全化。不正なメッセージ構造がコンパイルエラーになる。

**Independent Test**: GameStateSnapshotフィールドに不正な値を代入 → コンパイルエラー。メッセージハンドラのswitch文が網羅的。

### Implementation for User Story 2

- [x] T013 [US2] Update `src/game/engine.ts`: update createSnapshot() return type — ensure sizeTier returns TankSizeTier, healthState returns HealthState, store item type returns StoreItemType (matching updated GameStateSnapshot interface)
- [x] T014 [US2] Update `src/providers/tank-panel.ts`: import ExtensionToWebviewMessage and WebviewToExtensionMessage from shared/messages, type handleMessage parameter as WebviewToExtensionMessage, type all postMessage calls as ExtensionToWebviewMessage, ensure exhaustive switch with never check
- [x] T015 [P] [US2] Update `src/providers/companion-view.ts`: import message types from shared/messages, type message handler parameter as WebviewToExtensionMessage, type postMessage calls as ExtensionToWebviewMessage

**Checkpoint**: `npm run build` succeeds. Adding a new message type to shared/messages.ts without handling it causes compile errors in tank-panel.ts and companion-view.ts.

---

## Phase 5: User Story 3 - WebviewをReact + react-konvaで再構築する (Priority: P2)

**Goal**: メインタンクパネルのバニラJS Canvas描画をReact + react-konvaに完全移行。全ビジュアル要素とインタラクションが同等に動作。

**Independent Test**: F5でExtension Development Hostを起動 → 水槽パネルを開き、壁背景・机・ライト・水槽・魚・ボタン・ストアが全て動作確認。

### Implementation for User Story 3

- [x] T016 [US3] Create `src/webview/tank-panel/hooks/useGameState.ts`: custom hook that registers postMessage listener via useEffect, receives ExtensionToWebviewMessage, stores GameStateSnapshot in useState, sends "ready" message on mount, exposes sendMessage helper typed as WebviewToExtensionMessage
- [x] T017 [US3] Create `src/webview/tank-panel/hooks/useFishAnimation.ts`: custom hook that takes fish array and lightOn state, manages fish position/velocity state with useRef + requestAnimationFrame, returns animated fish positions array with dynamic bounds based on tank layout
- [x] T018 [P] [US3] Create `src/webview/tank-panel/components/Wall.tsx`: react-konva Rect components for wall background with gradient stripes and decorative shelf line, using scene constants (SCENE_W, SCENE_H)
- [x] T019 [P] [US3] Create `src/webview/tank-panel/components/Desk.tsx`: react-konva Rect components for wood desk with grain lines, highlight edge, and shadow, taking width as prop
- [x] T020 [P] [US3] Create `src/webview/tank-panel/components/Light.tsx`: react-konva Group with housing, light surface, and glow indicator, taking tankLeft, tankWidth, lightTop, and lightOn as props
- [x] T021 [US3] Create `src/webview/tank-panel/components/Tank.tsx`: react-konva Group with tank frame, water (dirtiness-tinted), sand layers, algae overlay, water surface shimmer, glass border, and dark overlay when light off — taking full tank layout and state as props
- [x] T022 [US3] Create `src/webview/tank-panel/components/Fish.tsx`: react-konva Group for single fish with body, tail, dorsal fin, belly highlight, eye, and speech bubble — taking animated position, fish data, and frameCount as props
- [x] T023 [US3] Create `src/webview/tank-panel/components/TankScene.tsx`: react-konva Stage + Layer composing Wall, Desk, Light, Tank, and Fish[] components, passing layout calculations and animated positions from hooks
- [x] T024 [P] [US3] Create `src/webview/tank-panel/components/StatsBar.tsx`: React HTML component showing hunger, water, algae, pomo, streak, timer stats from GameStateSnapshot
- [x] T025 [P] [US3] Create `src/webview/tank-panel/components/Actions.tsx`: React HTML component with Feed Fish, Change Water, Clean Algae, Light toggle, Store buttons that call sendMessage with typed messages
- [x] T026 [P] [US3] Create `src/webview/tank-panel/components/Store.tsx`: React HTML component rendering store items grouped by type (Tanks, Filters, Fish) with Buy/Locked buttons, using StoreItemType enum for grouping
- [x] T027 [US3] Create `src/webview/tank-panel/App.tsx`: main App component composing TankScene (react-konva), StatsBar, Actions, Store, and notification display — wiring useGameState and useFishAnimation hooks
- [x] T028 [US3] Create `src/webview/tank-panel/index.tsx`: React entry point — creates root via createRoot, renders App, acquires vscode API
- [x] T029 [US3] Update `src/providers/tank-panel.ts`: change getHtml() to load dist/webview-tank-panel.js bundle instead of media/webview/tank-detail/main.js, keep style.css reference, update canvas HTML to a root div for React mount

**Checkpoint**: F5でメインタンクパネルがReact版で動作。全ビジュアル要素とボタンが同等に機能。

---

## Phase 6: User Story 4 - コンパニオンビューのReact化 (Priority: P3)

**Goal**: コンパニオンビューをReact化し、メインパネルとコンポーネント共有。

**Independent Test**: サイドバーにミニ水槽が表示され、クリックでメインパネルが開く。

### Implementation for User Story 4

- [x] T030 [US4] Create `src/webview/companion/App.tsx`: React app using shared TankScene component at companion scale (SCENE_W=220, SCENE_H=180), with click handler to send openTank message, wiring useGameState hook
- [x] T031 [US4] Create `src/webview/companion/index.tsx`: React entry point — creates root, renders companion App
- [x] T032 [US4] Update `src/providers/companion-view.ts`: change getHtml() to load dist/webview-companion.js bundle, update HTML to root div for React mount

**Checkpoint**: サイドバーのコンパニオンビューがReact版で動作。クリックでメインパネルが開く。

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and verification

- [x] T033 Delete old webview JS files: `media/webview/tank-detail/main.js` and `media/webview/companion/main.js` (CSS files are kept)
- [x] T034 Verify build succeeds with `npm run build` and all 3 bundles are generated in dist/
- [x] T035 End-to-end verification: test all features (feed, water, algae, store purchase, light toggle, tank upgrade, companion click) in Extension Development Host

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (React deps installed, tsconfig updated)
- **US1 (Phase 3)**: Depends on Phase 2 (shared types must exist)
- **US2 (Phase 4)**: Depends on Phase 2 (message types must exist). Can run in parallel with US1.
- **US3 (Phase 5)**: Depends on Phase 1 (React installed), Phase 2 (types), and Phase 4 (message types used in hooks)
- **US4 (Phase 6)**: Depends on Phase 5 (shared React components from TankScene)
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — independent
- **US2 (P1)**: Can start after Phase 2 — independent, can parallel with US1
- **US3 (P2)**: Depends on US2 (message types used in React hooks/components)
- **US4 (P3)**: Depends on US3 (reuses React components)

### Parallel Opportunities

- **Phase 3**: T009, T010, T011, T012 can all run in parallel (different files)
- **Phase 3 + Phase 4**: US1 and US2 can run in parallel after Phase 2
- **Phase 5**: T018, T019, T020 (visual components) in parallel; T024, T025, T026 (HTML components) in parallel

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Phase 1: Setup (T001-T003)
2. Phase 2: Foundational types (T004-T006)
3. Phase 3: US1 — type-safe constants (T007-T012)
4. Phase 4: US2 — message type safety (T013-T015)
5. **STOP and VALIDATE**: Build passes, all strings are typed, messages are type-safe

### Incremental Delivery

1. Phase 1+2 → Foundation ready
2. US1+US2 → 型安全性100% → Validate
3. US3 → React版メインパネル → Validate
4. US4 → React版コンパニオン → Validate
5. Phase 7 → Cleanup → Final validation

### Recommended Order (Single Developer)

Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4) → Phase 7

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- US1 and US2 are both P1 and can be parallelized
- US3 is the largest phase (14 tasks) — React component creation
- Old media/webview/*.js files are deleted only in Phase 7 after React versions are verified
- Commit after each phase completion for safe rollback
