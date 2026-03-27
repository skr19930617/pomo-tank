# Implementation Plan: UI & Timer Improvements

**Branch**: `011-ui-timer-improvements` | **Date**: 2026-03-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/011-ui-timer-improvements/spec.md`

## Summary

Add four UI improvements to pomo-tank: (1) configurable focus/break timer with color-coded states (yellow warning → red overtime → green break), (2) store back button, (3) animated fish previews in store, (4) pixel font for all UI text. Timer settings live in a collapsible section below the tank view, persisted via VSCode globalState. Color constants and overtime threshold are centralized in a single theme file.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**: React 19, react-konva 19, Konva 10, @types/vscode ^1.85.0, esbuild ^0.20.0
**Storage**: VSCode ExtensionContext globalState (existing pattern via `src/persistence/storage.ts`)
**Testing**: Vitest (unit tests)
**Target Platform**: VSCode Extension (webview panel), VSCode ^1.85.0
**Project Type**: VSCode extension with React/Konva webview
**Performance Goals**: 60fps canvas rendering, smooth sprite animations in store
**Constraints**: Webview sandboxing (no direct filesystem access from webview), CSP restrictions on font loading
**Scale/Scope**: Single-user local extension, ~15 source files affected

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No constitution principles defined (template-only). Gate passes by default.

## Project Structure

### Documentation (this feature)

```text
specs/011-ui-timer-improvements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (message contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── shared/
│   ├── types.ts                    # Existing shared types + new TimerMode, UserSettings
│   ├── messages.ts                 # Existing message contracts + new settings messages
│   └── timer-theme.ts              # NEW: Timer color constants & overtime threshold
├── game/
│   ├── engine.ts                   # Existing engine + break timer logic
│   ├── state.ts                    # Existing state + settings persistence fields
│   └── species/                    # Existing species configs (read-only for store previews)
├── persistence/
│   └── storage.ts                  # Existing persistence + settings load/save
├── providers/
│   └── tank-panel.ts               # Existing panel + settings message handling
├── webview/
│   └── tank-panel/
│       ├── App.tsx                  # Layout: add collapsible settings section
│       ├── hooks/
│       │   ├── useTimer.ts          # Extend: focus/break mode, color state
│       │   └── useSettings.ts       # NEW: Settings state management hook
│       └── components/
│           ├── HudOverlay.tsx       # Extend: multi-color timer, break countdown
│           ├── Store.tsx            # Extend: back button, fish sprite previews
│           ├── SettingsPanel.tsx     # NEW: Collapsible settings UI
│           ├── FishPreview.tsx       # NEW: Animated sprite preview for store
│           └── Fish.tsx             # Existing (reference for sprite rendering)
├── media/
│   └── webview/
│       └── tank-detail/
│           ├── style.css            # Extend: pixel font @font-face, settings styles
│           └── fonts/               # NEW: Pixel font file(s)
└── tests/
    └── (unit tests for timer logic, settings validation)
```

**Structure Decision**: Follows existing single-project VSCode extension structure. New files are minimal: 1 theme constants file, 1 settings hook, 1 settings component, 1 fish preview component, and font assets. All other changes are extensions to existing files.

## Complexity Tracking

No constitution violations to justify.
