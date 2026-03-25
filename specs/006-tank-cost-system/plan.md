# Implementation Plan: Tank Cost System Simplification

**Branch**: `006-tank-cost-system` | **Date**: 2026-03-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-tank-cost-system/spec.md`

## Summary

Simplify the tank economy by replacing the per-fish deterioration model with tank-wide fixed rates and the fish-count capacity limit with a cost-based capacity system. Timer duration becomes fully configurable and decoupled from all tank state. The HUD gains a cost capacity display.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**: React 18, react-konva, konva, @types/vscode ^1.85.0, esbuild ^0.20.0
**Storage**: VSCode ExtensionContext globalState (key-value persistence)
**Testing**: npm test (existing test infrastructure)
**Target Platform**: VSCode Extension (desktop, all OS)
**Project Type**: VSCode Extension (desktop-app with embedded game)
**Performance Goals**: HUD renders within 1 second of panel open; 60fps tick interpolation maintained
**Constraints**: 16px HUD height, pixel-art aesthetic, single-threaded extension host
**Scale/Scope**: 5 fish species, 4 tank tiers, 4 filter tiers, single-user local state

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is a placeholder template — no gates defined. Proceeding without constraints.

**Post-Phase 1 re-check**: No violations. All changes modify existing files within established project structure. No new dependencies, no new projects, no architectural pattern changes.

## Project Structure

### Documentation (this feature)

```text
specs/006-tank-cost-system/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: research decisions
├── data-model.md        # Phase 1: entity changes
├── quickstart.md        # Phase 1: implementation guide
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── shared/
│   └── types.ts            # Type definitions (FishSpeciesData, Tank, Fish, FilterData, constants)
├── game/
│   ├── state.ts            # Catalogs (FISH_SPECIES, FILTERS, TANK_BASE_CAPACITY, STORE_ITEMS)
│   ├── engine.ts           # Game loop, action handlers, state management
│   ├── deterioration.ts    # Per-tick decay (rewrite: tank-wide fixed rates)
│   ├── health.ts           # Fish health evaluation (update: tank.hungerLevel)
│   ├── store.ts            # Purchase validation (rewrite: cost-based capacity)
│   └── points.ts           # Pomo earning (update: scale with session duration)
├── webview/tank-panel/
│   ├── components/
│   │   └── HudOverlay.tsx  # HUD display (add: cost capacity indicator)
│   └── hooks/
│       └── useTimer.ts     # Timer (update: configurable overtime threshold)
├── providers/
│   └── tank-panel.ts       # Webview provider
└── extension.ts            # Entry point (wire workSessionMinutes config)

tests/
└── (existing test files updated to match new model)
```

**Structure Decision**: No structural changes. All modifications are to existing files within the established `src/game/`, `src/shared/`, and `src/webview/` directories.

## Implementation Phases

### Phase A: Data Model & Types (Foundation)

**Goal**: Update all type definitions and catalogs to reflect the new cost-based model.

**Files**: `src/shared/types.ts`, `src/game/state.ts`

**Changes**:
1. `FishSpeciesData`: Remove `hungerRate`, `dirtinessLoad`. Add `capacityCost: number`.
2. `Fish`: Remove `hungerLevel`.
3. `Tank`: Add `hungerLevel: number` (0-100, tank-wide).
4. `FilterData`: Remove `efficiency`. Add `capacityBonus: number`.
5. `FISH_SPECIES`: Update all entries with capacityCost values (guppy:1, neon_tetra:1, corydoras:2, betta:2, angelfish:4).
6. `FILTERS`: Update all entries with capacityBonus values (basic_sponge:0, hob:3, canister:6, premium:10).
7. Replace `TANK_CAPACITY` with `TANK_BASE_CAPACITY` (Nano:4, Small:8, Medium:14, Large:22, XL:32).
8. Add `DETERIORATION_THRESHOLD = 70` constant.
9. Update `GameStateSnapshot` to include `capacity: { current, max }` and `tank.hungerLevel`.

### Phase B: Core Game Logic (Engine)

**Goal**: Rewrite deterioration, update health checks, wire configurable session duration.

**Files**: `src/game/deterioration.ts`, `src/game/health.ts`, `src/game/engine.ts`, `src/game/points.ts`

**Changes**:
1. `deterioration.ts`: Rewrite `applyTick` to use tank-wide fixed rates:
   - Hunger: `DETERIORATION_THRESHOLD / (1 × sessionMinutes)` per tick
   - Water: `DETERIORATION_THRESHOLD / (3 × sessionMinutes)` per tick
   - Algae: `DETERIORATION_THRESHOLD / (5 × sessionMinutes)` per tick + water-scaled bonus
   - Remove all per-fish iteration for hunger; remove `isActiveCoding` multiplier
   - Apply hunger to `tank.hungerLevel` instead of individual fish
2. `health.ts`: Update `isPoorConditions` to read `state.tank.hungerLevel` instead of `fish.hungerLevel`
3. `engine.ts`:
   - Accept `sessionMinutes` parameter (from VSCode config)
   - Pass to deterioration tick
   - Update `performAction('feedFish')` to reduce `tank.hungerLevel` (subtract 60, min 0) instead of per-fish
   - Scale points timing windows with sessionMinutes
4. `points.ts`: Replace hardcoded timing windows with session-relative values:
   - Perfect window: `[0.8 × sessionMs, 1.2 × sessionMs]`
   - Good window: `[0.6 × sessionMs, 1.4 × sessionMs]`
   - POMO_THRESHOLD_MS becomes derived from sessionMinutes

### Phase C: Store & Capacity (Economy)

**Goal**: Replace fish-count capacity with cost-based capacity.

**Files**: `src/game/store.ts`

**Changes**:
1. Replace `livingFish.length >= TANK_CAPACITY[sizeTier]` with cost-based check:
   - `currentTotalCost = sum of FISH_SPECIES[f.speciesId].capacityCost for living fish`
   - `maxCapacity = TANK_BASE_CAPACITY[sizeTier] + FILTERS[filterId].capacityBonus`
   - Block if `currentTotalCost + species.capacityCost > maxCapacity`
2. Update error message: "Tank is full." → "Not enough capacity (current/max)."
3. Add helper functions: `calculateCurrentCost(fish[])`, `calculateMaxCapacity(tank)`

### Phase D: HUD & Timer Display (UI)

**Goal**: Add cost display to HUD, wire configurable timer.

**Files**: `src/webview/tank-panel/components/HudOverlay.tsx`, `src/webview/tank-panel/hooks/useTimer.ts`, `src/extension.ts`, `src/providers/tank-panel.ts`

**Changes**:
1. `HudOverlay.tsx`:
   - Add props: `currentCost`, `maxCost`
   - Render cost indicator in center area: fish icon + "current/max" text
   - Color coding: white (normal), yellow (>=80% capacity), red (>=100% or over)
   - Keep existing H/W/A/S stats alongside cost display in non-compact mode
2. `useTimer.ts`: Accept `sessionMinutes` prop, use `sessionMinutes × 60 × 1000` for overtime threshold instead of hardcoded `POMO_THRESHOLD_MS`
3. `extension.ts`: Read `pomotank.workSessionMinutes` config, pass to GameEngine constructor
4. `tank-panel.ts`: Include capacity data in snapshot passed to webview

### Phase E: Migration & Edge Cases

**Goal**: Handle existing save state migration and edge cases.

**Files**: `src/game/engine.ts` (or dedicated migration module)

**Changes**:
1. State migration on load:
   - Average per-fish hungerLevel → tank.hungerLevel
   - Map old filter efficiency → new capacityBonus (by filter ID, no calculation needed)
   - Old TANK_CAPACITY no longer referenced
2. Over-capacity tolerance: If currentTotalCost > maxCapacity after migration, allow but block purchases
3. Timer bounds validation: Clamp sessionMinutes to [1, 120]

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Save state migration corrupts data | High | Migrate on load with fallback to defaults; keep old state as backup key |
| Deterioration rates feel wrong at non-default durations | Medium | Derived from session duration formula; test with 15/25/50 min sessions |
| HUD space too tight for cost display | Low | 16px height is constrained but cost format "3/10" is compact; test at smallest tank width (Nano: 200px) |
| Points system timing windows drift with custom durations | Medium | Proportional scaling ensures same relative difficulty; test edge cases |

## Complexity Tracking

No constitution violations to justify.
