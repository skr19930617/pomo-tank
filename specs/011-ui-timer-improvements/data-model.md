# Data Model: UI & Timer Improvements

**Feature**: 011-ui-timer-improvements
**Date**: 2026-03-26

## New Entities

### UserSettings

Extensible settings type persisted in globalState. New fields can be added with defaults without breaking existing data.

| Field | Type | Default | Validation | Description |
|-------|------|---------|------------|-------------|
| focusMinutes | number | 25 | min: 1, max: 120 | Focus session duration in minutes |
| breakMinutes | number | 5 | min: 0, max: 60 | Break duration in minutes (0 = skip break) |

**Persistence**: Stored as a separate globalState key (e.g., `pomotank.userSettings`), independent of `GameState` to avoid migration complexity.

**Default handling**: On load, missing fields receive defaults via a `withDefaults()` function. This ensures forward compatibility when new settings are added.

### TimerMode (enum/union)

Represents the current timer operating mode.

| Value | Description |
|-------|-------------|
| `'focus'` | Counting up from 0. Normal pomodoro work session. |
| `'break'` | Counting down from breakMinutes. Rest period after maintenance. |

**State transitions**:
```
focus → break : triggered by any maintenance action (feed/water/algae/light)
break → focus : triggered when break countdown reaches 0
```

**Where tracked**: Extension host (GameEngine) — exposed in `GameStateSnapshot.session` as `timerMode` and `breakRemainingMs`.

### TimerColorState (derived, not persisted)

Computed in the webview from TimerMode + elapsed time + theme constants.

| State | Condition | Color Source |
|-------|-----------|--------------|
| normal | focus mode, elapsed < focusMinutes | `TIMER_COLOR_NORMAL` |
| warning | focus mode, elapsed >= focusMinutes | `TIMER_COLOR_WARNING` |
| overtime | focus mode, elapsed >= focusMinutes + overtimeThreshold | `TIMER_COLOR_OVERTIME` |
| break | break mode (any time) | `TIMER_COLOR_BREAK` |
| paused | light off (any mode) | normal color at 35% opacity |

## Modified Entities

### GameStateSnapshot.session (extended)

| Field | Type | Status | Description |
|-------|------|--------|-------------|
| timeSinceLastMaintenance | number | Existing | Milliseconds since last maintenance |
| isInBreakWindow | boolean | Existing | Whether in break scoring window |
| isActivelyCoding | boolean | Existing | Whether user is actively coding |
| sessionMinutes | number | Existing | Focus duration (now from UserSettings) |
| **timerMode** | `'focus' \| 'break'` | **New** | Current timer mode |
| **breakRemainingMs** | number | **New** | Milliseconds remaining in break (0 if focus mode) |
| **breakMinutes** | number | **New** | Configured break duration for webview reference |

### GameState (no change)

`GameState` itself is not modified. Break state is transient (not persisted across extension restarts). On restart, timer always starts in focus mode.

### PlayerProfile.sessionStartTime (behavior change)

- **Focus mode**: Reset to `Date.now()` when maintenance action is performed AND break countdown completes (or breakMinutes = 0).
- **Break mode**: Holds the timestamp when break started. `breakRemainingMs` is calculated as `breakMinutes * 60000 - (Date.now() - sessionStartTime)`.

## Timer Theme Constants (new file)

Located in `src/shared/timer-theme.ts`:

| Constant | Value | Description |
|----------|-------|-------------|
| TIMER_COLOR_NORMAL | `'#ffffff'` | White — normal focus timer |
| TIMER_COLOR_WARNING | `'#ffcc44'` | Yellow — focus time reached |
| TIMER_COLOR_OVERTIME | `'#ff4444'` | Red — overtime threshold exceeded |
| TIMER_COLOR_BREAK | `'#44dd44'` | Green — break countdown active |
| OVERTIME_THRESHOLD_MINUTES | `5` | Minutes past focus duration before red |

## Message Contract Changes

### New: Webview → Extension

| Message | Fields | Description |
|---------|--------|-------------|
| `updateSettings` | `settings: Partial<UserSettings>` | User changed settings in the UI |

### New: Extension → Webview

| Message | Fields | Description |
|---------|--------|-------------|
| `settingsUpdate` | `settings: UserSettings` | Confirms persisted settings (sent on ready + after update) |
