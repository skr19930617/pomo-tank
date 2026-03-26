# Message Contracts: UI & Timer Improvements

**Feature**: 011-ui-timer-improvements
**Date**: 2026-03-26

## Existing Messages (unchanged)

### Extension → Webview
- `stateUpdate` — full GameStateSnapshot (extended with new session fields)
- `actionResult` — maintenance action success/failure
- `purchaseResult` — store purchase result
- `lightToggleResult` — light toggle result

### Webview → Extension
- `ready` — webview initialized
- `feedFish` / `changeWater` / `cleanAlgae` / `toggleLight` — maintenance actions
- `purchaseItem` — store purchase
- `openTank` / `debugSetPomo` / `debugResetState` — utility/debug

## New Messages

### Webview → Extension: `updateSettings`

Sent when user changes any setting in the SettingsPanel.

```typescript
{ type: 'updateSettings'; settings: Partial<UserSettings> }
```

- `settings`: Partial object — only changed fields are sent.
- Extension merges with existing settings, validates, persists, and responds with `settingsUpdate`.

### Extension → Webview: `settingsUpdate`

Sent on webview `ready` (initial load) and after each `updateSettings` is processed.

```typescript
{ type: 'settingsUpdate'; settings: UserSettings }
```

- `settings`: Full validated UserSettings object with all fields populated.

## Extended Snapshot Fields

The `stateUpdate` message's `GameStateSnapshot.session` gains three fields:

```typescript
session: {
  // existing
  timeSinceLastMaintenance: number;
  isInBreakWindow: boolean;
  isActivelyCoding: boolean;
  sessionMinutes: number;
  // new
  timerMode: 'focus' | 'break';
  breakRemainingMs: number;
  breakMinutes: number;
}
```
