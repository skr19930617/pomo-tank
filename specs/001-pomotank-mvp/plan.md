# Implementation Plan: Pomotank MVP

**Branch**: `001-pomotank-mvp` | **Date**: 2026-03-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-pomotank-mvp/spec.md`

## Summary

Build a VSCode extension that displays a pixel-art aquarium companion in the Explorer view container, with real-time tank deterioration (hunger, dirtiness, algae), three maintenance actions (feed, water change, clean algae), a fish health state machine (Healthy → Warning → Sick → Dead), a `pomo` point progression system with timing bonuses and streaks, and a store for tank upgrades, filters, and fish species. The extension host runs the authoritative game simulation on a 60-second tick; webviews handle rendering via HTML5 Canvas with sprite sheets.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: `@types/vscode` (VSCode Extension API), esbuild (bundler)
**Storage**: VSCode `ExtensionContext.globalState` (JSON key-value)
**Testing**: vitest (unit tests for game logic), @vscode/test-electron (integration tests)
**Target Platform**: VSCode 1.85+ (desktop, all OS)
**Project Type**: VSCode extension
**Performance Goals**: Game tick < 5ms CPU per 60s interval; webview animation at 30+ fps; no perceptible editor lag
**Constraints**: Single-process extension host; webview sandboxed; all state must be JSON-serializable; offline-capable (no network required)
**Scale/Scope**: Single user, single tank, ≤18 fish, 5 species, 2 webview surfaces, ~15 source files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is not yet configured (template placeholders only). No gates to evaluate. **PASS**.

**Post-Phase 1 re-check**: Design uses a single project structure, pure-function game logic, standard VSCode extension patterns. No complexity violations. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/001-pomotank-mvp/
├── plan.md              # This file
├── research.md          # Phase 0 output — technology decisions
├── data-model.md        # Phase 1 output — entities, formulas, state machines
├── quickstart.md        # Phase 1 output — setup and dev workflow
├── contracts/           # Phase 1 output — extension interface contract
│   └── extension-contributions.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── extension.ts              # Entry point: activate/deactivate
├── game/
│   ├── engine.ts             # Game loop, tick dispatch, offline catch-up
│   ├── state.ts              # Type definitions, initial state factory
│   ├── deterioration.ts      # Hunger, dirtiness, algae tick formulas
│   ├── health.ts             # Fish health state machine
│   ├── points.ts             # Pomo point calc, timing bonus, streaks
│   └── store.ts              # Store catalog, purchase validation
├── providers/
│   ├── companion-view.ts     # WebviewViewProvider (Explorer container)
│   └── tank-panel.ts         # WebviewPanel (editor tab detail view)
├── activity/
│   └── tracker.ts            # Coding activity detection
├── ui/
│   └── status-bar.ts         # Status bar item management
└── persistence/
    └── storage.ts            # GlobalState wrapper

media/
├── webview/
│   ├── companion/            # Companion view HTML/CSS/JS + Canvas
│   └── tank-detail/          # Detail panel HTML/CSS/JS + Canvas + store UI
└── sprites/
    ├── fish/                 # Per-species sprite sheets
    ├── tank/                 # Tank backgrounds, water, algae overlays
    └── ui/                   # Buttons, bubbles, icons

test/
├── unit/                     # Vitest: game logic pure-function tests
│   ├── deterioration.test.ts
│   ├── health.test.ts
│   ├── points.test.ts
│   └── store.test.ts
└── integration/              # @vscode/test-electron: extension lifecycle
    ├── extension.test.ts
    └── persistence.test.ts
```

**Structure Decision**: Single-project VSCode extension. Game logic in `src/game/` is pure functions with no VSCode dependencies, enabling fast unit testing. VSCode-specific code in `src/providers/`, `src/ui/`, `src/persistence/`. Webview content (HTML/CSS/JS) lives in `media/webview/` as static assets served by the extension host.

## Complexity Tracking

No constitution violations to justify. Design uses minimal abstractions:
- No DI framework — direct imports
- No state management library — plain objects in globalState
- No frontend framework in webviews — vanilla JS + Canvas
- No database — globalState key-value only
