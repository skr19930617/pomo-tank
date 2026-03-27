# Implementation Plan: Tank & Fish Management Settings

**Branch**: `014-tank-fish-management` | **Date**: 2026-03-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/014-tank-fish-management/spec.md`

## Summary

Extend the settings panel with three new management sections: tank size switching (between unlocked sizes), filter switching (between unlocked filters), and fish management (rename + remove). Requires extending the GameStateSnapshot to include `unlockedItems` so the webview can determine available options, adding `customName` to the Fish interface, and creating new message types for management actions. Capacity validation prevents downgrades that would exceed capacity.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**: React 19, @mui/material, @emotion/react, react-konva 19, Konva 10
**Storage**: VSCode ExtensionContext globalState (existing)
**Testing**: Vitest (unit tests), manual visual testing
**Target Platform**: VSCode Extension webview, VSCode ^1.85.0
**Project Type**: VSCode extension with React/Konva webview
**Performance Goals**: Instant UI response for management actions (<100ms state update)
**Constraints**: All validation must happen extension-side (engine); webview sends requests, engine validates and applies
**Scale/Scope**: ~8 files modified, 2 new UI components, 4 new message types

## Constitution Check

No constitution principles defined. Gate passes by default.

## Project Structure

### Documentation (this feature)

```text
specs/014-tank-fish-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/           # Phase 1 output (message contracts)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── shared/
│   ├── types.ts                     # MODIFY: add customName to Fish-related types if needed
│   └── messages.ts                  # MODIFY: add switchTank, switchFilter, renameFish, removeFish messages
├── game/
│   ├── state.ts                     # MODIFY: add customName to Fish, add unlockedItems to snapshot
│   ├── engine.ts                    # MODIFY: add switchTank, switchFilter, renameFish, removeFish methods
│   └── store.ts                     # READ-ONLY: reuse calculateCurrentCost, calculateMaxCapacity
├── providers/
│   └── tank-panel.ts                # MODIFY: handle new message types
├── webview/
│   └── tank-panel/
│       ├── App.tsx                  # MODIFY: add new management panels
│       ├── components/
│       │   ├── SettingsPanel.tsx     # UNCHANGED (timer settings stay as-is)
│       │   ├── TankManager.tsx      # NEW: tank size + filter switching UI
│       │   ├── FishManager.tsx      # NEW: fish list with rename/remove
│       │   └── FishTooltip.tsx      # MODIFY: show customName if set
│       └── hooks/
│           └── useGameState.ts      # MODIFY: handle management result messages
```

**Structure Decision**: New management UI components (TankManager, FishManager) are separate from the existing SettingsPanel to maintain separation of concerns. Timer settings remain in SettingsPanel. The management panels are added as sibling Accordions in App.tsx.

## Complexity Tracking

No constitution violations to justify.
