# Tasks: インタラクティブ餌やりアニメーション

**Input**: Design documents from `/specs/017-interactive-feeding-anim/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: Not explicitly requested in spec. Test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Type definitions and shared infrastructure for the feeding mode feature

- [x] T001 Define FeedingMode, FoodParticle, FoodCan, and AttractionTarget type interfaces in `src/webview/tank-panel/hooks/useFeedingMode.ts` (types only, export for use by other modules)
- [x] T002 Define personality-to-delay mapping constant (PERSONALITY_REACTION_DELAY: Record<Personality, number>) in `src/webview/tank-panel/hooks/useFishAnimation.ts` as exported constant (active=0, social=30, calm=60, timid=90)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core state machine that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Implement `useFeedingMode` hook state machine in `src/webview/tank-panel/hooks/useFeedingMode.ts`: manage phase transitions (idle→targeting→animating→idle), expose `startTargeting()`, `confirmDrop(x, waterSurfaceY)`, `completeAnimation()`, track dropX/dropY/animStartFrame, return current phase and particle/can state
- [x] T004 Integrate `useFeedingMode` into `src/webview/tank-panel/components/TankScene.tsx`: call the hook, pass `feedingPhase` and `onFeedClick` callback down to ActionBar, wire up `sendMessage({ type: 'feedFish' })` to `completeAnimation` callback

**Checkpoint**: Foundation ready - state machine transitions work, feedFish message sends on animation complete

---

## Phase 3: User Story 1 - 餌やりモードの開始とカーソル変化 (Priority: P1) 🎯 MVP

**Goal**: 餌やりボタン押下で「餌やりモード」に遷移し、カーソルが変化。水槽クリックで投下位置確定、ESC/水槽外でキャンセル。

**Independent Test**: 餌やりボタンを押してカーソルが餌アイコンに変化することを確認。ESCキーでキャンセルしてカーソルが戻ることを確認。水槽内クリックで座標が確定されること。

### Implementation for User Story 1

- [x] T005 [US1] Modify `src/webview/tank-panel/components/ActionBar.tsx`: change feed button onClick from `sendMessage({ type: 'feedFish' })` to calling `onFeedClick()` callback prop. Add `onFeedClick` and `feedingPhase` to props interface. Add disable condition: button disabled when `feedingPhase !== 'idle'`
- [x] T006 [US1] Implement custom cursor in `src/webview/tank-panel/components/TankScene.tsx`: when feedingPhase='targeting', set Konva Stage container's `style.cursor` to a base64-encoded 16×16px feed icon with crosshair fallback. Reset to default cursor when phase changes away from targeting
- [x] T007 [US1] Add water area click handler in `src/webview/tank-panel/components/TankScene.tsx`: when feedingPhase='targeting' and user clicks inside the tank water area (within tank bounds, y >= waterTop), call `confirmDrop(clickX_in_tank_coords, waterSurfaceY)`. Convert stage click coordinates to tank-local logical coordinates using existing tankLayout
- [x] T008 [US1] Add cancel handling in `src/webview/tank-panel/components/TankScene.tsx`: listen for ESC keydown event (document.addEventListener in useEffect) during targeting phase → call `cancelTargeting()`. Also cancel if click is outside tank water area during targeting phase
- [x] T009 [US1] Update `src/webview/tank-panel/hooks/useGameState.ts`: remove the existing 1500ms feedingActive timer logic for feedFish action. The feedingActive state will now be driven by useFeedingMode's animating phase instead

**Checkpoint**: At this point, User Story 1 should be fully functional: button → cursor change → click to confirm / ESC to cancel

---

## Phase 4: User Story 2 - 缶傾きアニメーションと餌粒落下 (Priority: P1)

**Goal**: 水槽クリック後に餌缶の傾きアニメーションと粉状餌粒の落下・フェードアウトを表示。アニメーション完了でhunger減少を適用。

**Independent Test**: 餌やりモードで水槽内クリック後、缶が水面上部に表示されて傾くこと。餌粒が5-8個散布されゆっくり落下しフェードアウトすること。全粒消滅でモードがidleに戻りhungerが減少すること。

### Implementation for User Story 2

- [x] T010 [P] [US2] Create food particle system logic in `src/webview/tank-panel/hooks/useFeedingMode.ts`: add `updateParticles(frameCount)` method that generates 5-8 FoodParticle instances at animating start (x=dropX±3px random, y=waterSurfaceY, vy=0.15-0.25 random), updates y+=vy each frame, starts opacity fade after 90 frames (0.01/frame), marks alive=false when opacity<=0. Export particles array and attractionTarget (centroid of alive particles)
- [x] T011 [P] [US2] Create food can animation logic in `src/webview/tank-panel/hooks/useFeedingMode.ts`: add FoodCan state that appears at (dropX, waterSurfaceY - 10px), animates rotation 0°→45° over 30 frames with easeOutQuad, holds at 45° for 30 frames, then sets visible=false at frame 60. Particles begin spawning when can reaches ~20° tilt (frame ~15)
- [x] T012 [US2] Create `src/webview/tank-panel/components/FoodOverlay.tsx`: Konva Group component that renders the food can (Group of Rect elements as pixel art, using rotation prop) and food particles (Circle elements with fill='#d4a574', radius=1-1.5px, opacity from particle state). Accept particles array, canState, and tankBounds as props
- [x] T013 [US2] Integrate FoodOverlay into `src/webview/tank-panel/components/TankScene.tsx`: render `<FoodOverlay>` inside the tank cluster Group (after Tank, before Fish components). Pass particles, canState from useFeedingMode. Call `updateParticles(frameCount)` each animation frame using the existing frameCount from useFishAnimation
- [x] T014 [US2] Implement animation completion flow in `src/webview/tank-panel/hooks/useFeedingMode.ts`: when all particles have alive=false, automatically transition phase from 'animating' to 'idle'. In TankScene, trigger `sendMessage({ type: 'feedFish' })` when this transition occurs (via useEffect watching phase change)
- [x] T015 [US2] Wire feedingActive for existing fish feeding sprites in `src/webview/tank-panel/components/TankScene.tsx`: set `feedingActive={feedingPhase === 'animating'}` on Fish components so species with hasFeedingAnim (otocinclus, shrimp) show their feeding animation during particle phase

**Checkpoint**: Full visual feeding experience works: button → cursor → click → can tilt → particles fall → fade out → hunger decreases

---

## Phase 5: User Story 3 - 魚が餌に集まる行動 (Priority: P2)

**Goal**: 餌粒の存在中に魚が餌位置に向かって泳ぎ、性格による反応速度差を表現。群れから離脱→餌消滅後に群れ復帰。

**Independent Test**: 餌粒落下中に魚が餌方向へ泳ぎ始めること。active性格の魚が最初に反応しtimidが最後であること。餌消滅後に通常遊泳と群れ行動に戻ること。

### Implementation for User Story 3

- [x] T016 [US3] Add attractionTarget parameter to `src/webview/tank-panel/hooks/useFishAnimation.ts`: extend the hook's function signature to accept `attractionTarget: AttractionTarget | null`. Import AttractionTarget type from useFeedingMode
- [x] T017 [US3] Implement food attraction force in boids loop in `src/webview/tank-panel/hooks/useFishAnimation.ts`: inside the per-fish frame update (after existing separation/alignment/cohesion), when attractionTarget is active and fish personality delay has elapsed (currentFrame - target.startFrame >= PERSONALITY_REACTION_DELAY[personality]), add force: `dx += (target.x - fish.x) * 0.008`, `dy += (target.y - fish.y) * 0.008`. Clamp dy to keep fish within their swimLayer bounds. Skip dead fish
- [x] T018 [US3] Pass attractionTarget from TankScene to useFishAnimation in `src/webview/tank-panel/components/TankScene.tsx`: get attractionTarget from useFeedingMode, pass it to useFishAnimation hook call. Ensure attractionTarget becomes null when feedingPhase returns to idle
- [x] T019 [US3] Verify swim layer constraints are maintained in `src/webview/tank-panel/hooks/useFishAnimation.ts`: ensure the existing SWIM_LAYER_RANGES boundary enforcement runs AFTER the food attraction force is applied, so fish never leave their designated swim layer even when attracted to food

**Checkpoint**: All user stories should now be independently functional - fish gather toward food with personality-based timing and return to schooling after food disappears

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, button state management, and integration refinements

- [x] T020 [P] Handle edge case: feeding mode auto-cancel on timer end in `src/webview/tank-panel/hooks/useFeedingMode.ts`: if a stateUpdate message arrives indicating session end while phase !== 'idle', reset to idle without sending feedFish
- [x] T021 [P] Disable other maintenance buttons during animation in `src/webview/tank-panel/components/ActionBar.tsx`: when feedingPhase='animating', disable water/algae/light buttons in addition to feed button (FR-012)
- [x] T022 Verify existing tests pass with `npm test && npm run lint` and fix any type errors or lint issues introduced by the changes
- [ ] T023 Manual integration test (pending user verification): run full feeding flow in Extension Development Host - verify button→cursor→click→can→particles→fish gather→fade→hunger decrease→button re-enabled cycle

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 types - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 - establishes mode transitions and click flow
- **User Story 2 (Phase 4)**: Depends on Phase 3 - needs targeting→animating transition working
- **User Story 3 (Phase 5)**: Depends on Phase 4 - needs attractionTarget from particle system
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - no other story dependencies
- **User Story 2 (P1)**: Depends on US1 completion (needs targeting phase and click confirmation flow)
- **User Story 3 (P2)**: Depends on US2 completion (needs attractionTarget from particle system)

### Within Each User Story

- T010 and T011 can run in parallel (particle system and can animation are separate state in same file but independent logic)
- T012 depends on T010+T011 (renders their output)
- T013 depends on T012 (integrates component)
- T014 depends on T013 (completion flow)

### Parallel Opportunities

- Phase 1: T001 and T002 can run in parallel (different files)
- Phase 4: T010 and T011 can run in parallel (independent logic within same hook)
- Phase 6: T020 and T021 can run in parallel (different files)

---

## Parallel Example: User Story 2

```bash
# Launch particle system and can animation logic in parallel:
Task: T010 "Food particle system logic in useFeedingMode.ts"
Task: T011 "Food can animation logic in useFeedingMode.ts"

# Then sequentially:
Task: T012 "Create FoodOverlay.tsx component"
Task: T013 "Integrate FoodOverlay into TankScene.tsx"
Task: T014 "Animation completion flow"
Task: T015 "Wire feedingActive for fish sprites"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types)
2. Complete Phase 2: Foundational (state machine)
3. Complete Phase 3: User Story 1 (mode + cursor + click + cancel)
4. **STOP and VALIDATE**: Test feeding mode transitions independently
5. This alone transforms "instant button" into "interactive targeting"

### Incremental Delivery

1. Setup + Foundational → State machine ready
2. Add User Story 1 → Test targeting mode → Validate (MVP!)
3. Add User Story 2 → Test can + particles → Validate (full visual experience)
4. Add User Story 3 → Test fish behavior → Validate (complete feature)
5. Polish → Edge cases + button states → Final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1→US2→US3 is sequential due to data flow dependencies (targeting→particles→attractionTarget)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The existing `feedingActive` in useGameState.ts (1500ms timer) is replaced by useFeedingMode's animating phase
