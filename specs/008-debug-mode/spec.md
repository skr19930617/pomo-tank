# Feature Specification: Debug Mode

**Feature Branch**: `008-debug-mode`
**Created**: 2026-03-25
**Status**: Draft
**Input**: User description: "Add debug mode with pomo point editor and state reset"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set Pomo Balance Freely (Priority: P1)

As a developer, I want to set my pomo balance to any value while in debug mode, so I can quickly test store purchases and progression without completing real pomodoro sessions.

**Why this priority**: Core debug utility — enables rapid testing of all cost-based features (store purchases, capacity system) which are the most time-consuming to test organically.

**Independent Test**: Enable debug mode, enter a pomo value, verify the balance updates immediately on the HUD and in the store.

**Acceptance Scenarios**:

1. **Given** debug mode is enabled, **When** the user enters a pomo value (e.g., 999), **Then** the pomo balance updates immediately to that value on the HUD
2. **Given** debug mode is enabled and pomo balance is set to 500, **When** the user opens the store, **Then** all items costing 500 or less show as affordable
3. **Given** debug mode is disabled, **When** the user views the tank panel, **Then** no debug controls are visible or accessible

---

### User Story 2 - Reset to Initial State (Priority: P1)

As a developer, I want to reset the entire game state to the initial default, so I can start fresh for testing without manually clearing extension data.

**Why this priority**: Equally critical — a clean slate is essential for reproducing bugs and verifying initial setup flow.

**Independent Test**: Enable debug mode, click the reset button, verify the tank returns to initial state (Nano tank, 1 neon tetra, 0 pomo, default levels).

**Acceptance Scenarios**:

1. **Given** debug mode is enabled and the user has multiple fish, upgrades, and pomo, **When** the user clicks the reset button, **Then** all state resets to default (Nano tank, 1 neon tetra, 0 pomo balance, 0 hunger/dirtiness/algae)
2. **Given** the user clicks the reset button, **When** the reset completes, **Then** the tank panel immediately reflects the initial state without requiring a reload
3. **Given** debug mode is enabled, **When** the user is about to reset, **Then** a confirmation step prevents accidental resets

---

### User Story 3 - Enable/Disable Debug Mode (Priority: P1)

As a developer, I want to toggle debug mode on and off through a VSCode setting or command, so I can keep debug tools hidden during normal use and show them only when needed.

**Why this priority**: Foundation for all debug features — without a toggle, debug controls would always be visible or never accessible.

**Independent Test**: Toggle the debug mode setting, verify debug UI elements appear/disappear in the tank panel.

**Acceptance Scenarios**:

1. **Given** debug mode is off (default), **When** the user views the tank panel, **Then** no debug controls are visible
2. **Given** the user enables debug mode via VSCode setting, **When** the tank panel renders, **Then** a debug panel/toolbar becomes visible
3. **Given** debug mode is on, **When** the user disables it, **Then** the debug controls disappear immediately

---

### Edge Cases

- What happens if the user sets pomo balance to a negative number? The system clamps to 0.
- What happens if the user sets an extremely large pomo value (e.g., 999999)? The system accepts it but the HUD displays a capped format (e.g., "9999+").
- What happens if the user resets state while the timer is running? The timer resets to default session time and pauses.
- What happens if debug mode is toggled while the store is open? The store closes and re-renders with updated state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension MUST provide a VSCode setting (`pomotank.debugMode`) to enable or disable debug mode (default: disabled)
- **FR-002**: When debug mode is enabled, a debug panel MUST appear in the tank panel UI with controls for pomo editing and state reset
- **FR-003**: The debug panel MUST include a numeric input field to set the pomo balance to any non-negative integer
- **FR-004**: Setting a pomo value in debug mode MUST immediately update the game state and refresh all UI components (HUD, store affordability)
- **FR-005**: The debug panel MUST include a reset button that restores the game to its initial default state
- **FR-006**: The reset action MUST require a confirmation step before executing (to prevent accidental data loss)
- **FR-007**: After a reset, all state MUST be immediately reflected in the UI without requiring a panel reload
- **FR-008**: Debug controls MUST NOT be visible or accessible when debug mode is disabled
- **FR-009**: The pomo balance input MUST clamp values to a minimum of 0 (no negative values allowed)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can set any pomo balance and see the change reflected in the HUD within 1 second
- **SC-002**: A full state reset completes and reflects in the UI within 1 second
- **SC-003**: Debug controls are 100% hidden when debug mode is disabled — no UI artifacts or accessible commands remain
- **SC-004**: The debug workflow (enable → set pomo → purchase item → verify) takes under 10 seconds end-to-end

## Assumptions

- Debug mode is intended for developer use only, not end users
- The debug setting is a standard VSCode configuration entry (boolean), readable at runtime
- The debug panel is part of the tank panel webview, not a separate panel
- State reset uses the existing `createInitialState()` factory — no special "debug initial state" is needed
- The debug panel is minimal — a simple set of controls, not a full devtools interface
