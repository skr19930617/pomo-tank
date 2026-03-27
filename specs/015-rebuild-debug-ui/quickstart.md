# Quickstart: Rebuild Debug UI

## Overview

This feature removes 3 legacy debug commands from the VSCode command palette and rebuilds the debug UI panel with two key capabilities: free-form Pomo coin editing and dynamic tick speed multiplier (1x–100x).

## Key Changes

### 1. Engine: Dynamic Tick Multiplier

**File**: `src/game/engine.ts`

Add `tickMultiplier` property and `setTickMultiplier(n)` method to `GameEngine`. The method clears the existing `setInterval`, clamps `n` to [1, 100], and restarts the interval at `60_000 / n` ms.

```
start() → setInterval(tick, 60_000 / this.tickMultiplier)
setTickMultiplier(n) → clearInterval → this.tickMultiplier = clamp(n) → start()
```

### 2. Message Protocol

**File**: `src/shared/messages.ts`

Add to `WebviewToExtensionMessage`:
```
| { type: 'debugSetTickMultiplier'; multiplier: number }
```

Add `tickMultiplier` field to `GameStateSnapshot` (in `src/game/state.ts` or wherever snapshot is defined).

### 3. Provider: Handle New Message

**File**: `src/providers/tank-panel.ts`

Add case for `debugSetTickMultiplier` in message handler — gate on `isDebugMode()`, call `engine.setTickMultiplier()`, send state update.

### 4. Debug UI Rebuild

**File**: `src/webview/tank-panel/components/DebugPanel.tsx`

Rebuild with three sections:
1. **Pomo Editor** — existing functionality (text input + Set button)
2. **Timer Speed** — numeric input + preset buttons (1x, 5x, 10x, 50x) for tick multiplier
3. **State Reset** — existing functionality (confirm dialog)

### 5. Remove Legacy Commands

**Files**: `package.json`, `src/extension.ts`

Delete `pomotank.debugTick`, `pomotank.debugReset`, `pomotank.debugAddPomo` from:
- `package.json` contributes.commands array
- `extension.ts` command registrations

### 6. App Integration

**File**: `src/webview/tank-panel/App.tsx`

Pass `tickMultiplier` and `onSetTickMultiplier` callback to `DebugPanel`.

## Build & Test

```bash
npm run watch     # Dev build with watch mode
npm run build     # Production build
npm test          # Run tests (vitest)
npm run lint      # ESLint check
```

## Debug Mode Activation

Set in VSCode settings:
```json
{ "pomotank.debugMode": true }
```
