# Implementation Plan: Debug Mode

**Branch**: `008-debug-mode` | **Date**: 2026-03-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/008-debug-mode/spec.md`

## Summary

Add a debug mode toggle (`pomotank.debugMode` setting) that shows an in-webview debug panel with pomo balance editor and state reset. Builds on existing debug commands (debugTick, debugReset, debugAddPomo) already registered in package.json and extension.ts.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**: React 18, react-konva, @types/vscode ^1.85.0, esbuild ^0.20.0
**Storage**: VSCode ExtensionContext globalState (existing)
**Testing**: Manual testing
**Target Platform**: VSCode Extension webview (Chromium-based)
**Project Type**: VSCode Extension (desktop-app)
**Constraints**: Webview CSP, message-based communication between extension host and webview

## Constitution Check

*GATE: No constitution defined (template only). No gates to evaluate.*

## Project Structure

### Source Code Changes

```text
src/
├── shared/
│   └── messages.ts              # Add debug message types (setPomo, resetState, debugMode flag)
├── extension.ts                 # Read debugMode setting, pass to webview via snapshot
├── game/
│   ├── engine.ts                # Add setPomo method, extend createSnapshot with debugMode
│   └── state.ts                 # Add debugMode to GameStateSnapshot
├── providers/
│   ├── tank-panel.ts            # Handle new debug messages
│   └── companion-view.ts        # Handle new debug messages
└── webview/tank-panel/
    ├── components/
    │   └── DebugPanel.tsx        # NEW: debug UI (pomo input + reset button)
    ├── App.tsx                   # Conditionally render DebugPanel
    └── hooks/
        └── useGameState.ts      # No changes needed (uses existing state flow)
package.json                      # Add pomotank.debugMode setting
```

## Key Technical Decisions

### 1. Debug Mode Toggle

Add `pomotank.debugMode` boolean setting to `package.json` contributes.configuration. Read it in `extension.ts` and include it in `GameStateSnapshot` so the webview knows whether to show debug controls.

### 2. Existing Debug Commands

The project already has 3 debug commands registered:
- `pomotank.debugTick` — apply 10 ticks
- `pomotank.debugReset` — reset to initial state
- `pomotank.debugAddPomo` — add 100 pomo

These remain as command palette actions. The new webview debug panel adds a more convenient UI for the same functionality, plus a custom pomo amount input.

### 3. Message Protocol Extension

Add new messages to the webview→extension protocol:
- `{ type: 'debugSetPomo'; amount: number }` — set pomo to exact amount
- `{ type: 'debugResetState' }` — reset to initial state

The extension handler reads the debugMode setting before executing — if debug mode is off, these messages are silently ignored (defense in depth).

### 4. Debug Panel UI

Simple HTML-style panel below the store button. Contains:
- A numeric input + "Set" button for pomo balance
- A "Reset State" button with a confirm dialog (window.confirm or inline confirm toggle)
- Styled with a distinct debug appearance (e.g., red/orange border) to make it obvious it's a dev tool

### 5. Snapshot Extension

Add `debugMode: boolean` to `GameStateSnapshot`. The extension reads `vscode.workspace.getConfiguration('pomotank').get<boolean>('debugMode', false)` each time `createSnapshot` is called, ensuring setting changes are picked up dynamically.
