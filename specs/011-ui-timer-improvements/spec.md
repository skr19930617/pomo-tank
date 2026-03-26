# Feature Specification: UI & Timer Improvements

**Feature Branch**: `011-ui-timer-improvements`
**Created**: 2026-03-26
**Status**: Draft
**Input**: User description: "UIをいくつか改善したい。ストアに戻るボタン、ストアの各品種に魚アニメーションプレビュー、ドット風フォント、タイマー設定機能（集中・休憩時間）、タイマー色変化（超過で黄→赤、休憩中は緑）、設定型の拡張性"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Timer Settings & Color Indicators (Priority: P1)

As a user, I want to configure my focus and break durations so that the timer reflects my personal pomodoro rhythm. When focus time expires, the timer turns yellow as a gentle warning, then red if I continue well past the limit. When I start a maintenance action (feeding, water change, etc.), the timer switches to a break countdown in green, letting me know my rest period is active.

**Why this priority**: The timer is the core interaction loop of pomo-tank. Configurable durations and visual color feedback directly impact how users engage with the pomodoro technique. Without this, the timer is purely informational with no guidance on when to take breaks.

**Independent Test**: Can be fully tested by opening the tank panel, setting focus/break times, letting the timer run past the focus duration, and triggering a maintenance action to see the break countdown. Delivers immediate value as the primary workflow improvement.

**Acceptance Scenarios**:

1. **Given** the tank panel is open, **When** the user clicks the settings header/icon below the tank view, **Then** the settings section expands to reveal inputs for focus duration and break duration with current values displayed.
2. **Given** focus duration is set to 25 minutes, **When** the elapsed time reaches 25 minutes, **Then** the timer text color transitions to yellow.
3. **Given** the timer has already turned yellow, **When** an additional threshold is exceeded (e.g., 5 minutes past focus time), **Then** the timer text color transitions to red.
4. **Given** the timer is in focus mode (normal, yellow, or red), **When** the user performs any maintenance action (feed, water change, algae clean, light adjustment), **Then** the timer resets and begins a break countdown using the configured break duration, displayed in green.
5. **Given** the break countdown is active, **When** the break countdown reaches zero, **Then** the timer resets to zero and resumes counting up in normal focus mode (white).
6. **Given** the user changes the focus or break duration in settings, **When** the settings are saved, **Then** the new values take effect immediately for the current and future sessions (persisted across reloads).

---

### User Story 2 - Store Navigation: Back Button (Priority: P2)

As a user viewing the store overlay, I want a clearly visible "back" button so I can close the store and return to my tank view without confusion.

**Why this priority**: The store currently lacks a close/back affordance. Users may feel trapped in the store overlay with no obvious way to return to the tank. This is a basic navigation gap.

**Independent Test**: Can be fully tested by opening the store, clicking the back button, and confirming the store closes and the tank view is restored.

**Acceptance Scenarios**:

1. **Given** the store overlay is open, **When** the user looks at the store UI, **Then** a "back" or "close" button is clearly visible (e.g., top-left or top-right corner).
2. **Given** the store overlay is open, **When** the user clicks the back button, **Then** the store overlay closes and the tank view is fully visible again.

---

### User Story 3 - Fish Animation Preview in Store (Priority: P3)

As a user browsing the store, I want to see an animated preview of each fish species next to its name so I can appreciate what I'm buying before spending pomos.

**Why this priority**: Visual previews make the store more engaging and help users make informed purchase decisions. This is an enhancement that improves the shopping experience but is not blocking core functionality.

**Independent Test**: Can be fully tested by opening the store, scrolling through available fish species, and verifying each species row shows a small animated fish sprite alongside the species name.

**Acceptance Scenarios**:

1. **Given** the store is open, **When** the user views the fish species section, **Then** each species row displays a small animated sprite preview of that fish.
2. **Given** a fish species has multiple visual variants, **When** the user views the store, **Then** the preview shows the default/standard variant animation.
3. **Given** the store is displaying multiple fish previews, **When** all previews are animating simultaneously, **Then** the UI remains responsive with no noticeable lag or stutter.

---

### User Story 4 - Pixel-Style Font for UI Text (Priority: P4)

As a user, I want the entire UI to use a consistent pixel/dot-style font so the visual aesthetic matches the pixel-art tank and fish sprites.

**Why this priority**: This is a visual polish improvement. The tank scene already uses a custom pixel font for the HUD, but the store and other HTML-based UI elements use system fonts, creating a visual inconsistency. Unifying the font improves the overall feel.

**Independent Test**: Can be fully tested by opening the tank panel and store, and confirming all text elements use a pixel-style font.

**Acceptance Scenarios**:

1. **Given** the tank panel is open, **When** the user views the store overlay, **Then** all text (headings, item names, prices, buttons) is rendered in a pixel-style font.
2. **Given** the tank panel is open, **When** the user views settings, buttons, tooltips, or notifications, **Then** all text is rendered in a pixel-style font.
3. **Given** the pixel font is applied, **When** the user reads any text in the UI, **Then** the text remains legible at the rendered size.

---

### Edge Cases

- What happens when the user sets a focus duration of 0 minutes? The system should enforce a minimum value (e.g., 1 minute).
- What happens when the user sets a break duration of 0 minutes? The system should allow it, meaning no break countdown occurs after maintenance.
- What happens when a maintenance action is triggered during the break countdown? The break countdown should restart from the configured break duration.
- What happens if the timer exceeds 99:59 display limit during focus mode? The existing "99:59+" cap behavior is preserved; color still reflects overtime status.
- What happens if the user resizes the panel while the store fish previews are animating? Previews should scale or remain appropriately sized.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a collapsible settings section below the tank view (not inside the store), collapsed by default, that the user can expand via a header/icon click to reveal configurable focus duration and break duration.
- **FR-002**: Settings values MUST be persisted across sessions so they survive panel close/reopen and VSCode restart.
- **FR-003**: Settings MUST be defined using an extensible type structure so new settings can be added in the future without restructuring.
- **FR-004**: Timer MUST change color to yellow when elapsed time reaches the configured focus duration.
- **FR-005**: Timer MUST change color to red when elapsed time exceeds the focus duration by an overtime threshold defined as a code constant (not user-configurable), co-located with the timer color variables.
- **FR-006**: When the user performs any maintenance action during focus mode, the timer MUST reset and display a break countdown using the configured break duration.
- **FR-007**: Break countdown timer MUST be displayed in the same location as the focus timer, in green color.
- **FR-008**: When the break countdown reaches zero, the timer MUST automatically switch back to focus mode, resetting to zero and counting up.
- **FR-009**: All timer color values (normal, yellow/warning, red/overtime, green/break) MUST be defined as named variables in a single, clearly documented location in the codebase for easy customization.
- **FR-010**: The store overlay MUST include a visible back/close button that returns the user to the tank view.
- **FR-011**: Each fish species listed in the store MUST display an animated sprite preview next to the species name.
- **FR-012**: All UI text (store, settings, buttons, tooltips, notifications) MUST use a pixel/dot-style font consistent with the tank's visual aesthetic.
- **FR-013**: Focus duration MUST have a minimum value of 1 minute and a reasonable maximum (e.g., 120 minutes).
- **FR-014**: Break duration MUST allow 0 minutes (skip break) up to a reasonable maximum (e.g., 60 minutes).

### Key Entities

- **TimerSettings**: Represents the user's timer configuration, including focus duration and break duration. Part of an extensible settings structure that can accommodate future settings.
- **TimerMode**: Represents the current timer state — focus (counting up) or break (counting down).
- **TimerColorTheme**: A named collection of color values for each timer state (normal, warning, overtime, break).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can configure focus and break durations within 10 seconds of opening settings.
- **SC-002**: Timer color changes are immediately visible when the focus duration is reached — no delay or missed transition.
- **SC-003**: Users can return from the store to the tank view with a single click.
- **SC-004**: Each fish species in the store displays an animated preview that matches the in-tank appearance.
- **SC-005**: All UI text throughout the panel uses a unified pixel-style font with no system-font fallback visible.
- **SC-006**: Settings persist correctly across panel close/reopen and VSCode restarts with 100% reliability.
- **SC-007**: Timer seamlessly transitions between focus and break modes when maintenance actions are performed.

## Clarifications

### Session 2026-03-26

- Q: How should the settings area below the tank behave (always visible, collapsible, or overlay)? → A: Collapsible section, collapsed by default, user clicks header/icon to expand.
- Q: Should the overtime threshold (yellow→red) be user-configurable in settings or a code constant? → A: Code constant only, defined alongside the color variables.

## Assumptions

- The pixel font for HTML-based UI elements will be a web font (e.g., loaded via CSS @font-face), separate from the existing bitmap PixelText used in the Konva HUD layer, since HTML elements cannot use bitmap rendering.
- The "overtime threshold" for yellow-to-red transition will default to 5 minutes past focus duration, but this can be adjusted as a constant alongside the color variables.
- "Maintenance action" refers to any of the existing ActionBar actions: feed, water change, algae clean, light adjustment.
- Settings are stored in VSCode's globalState, consistent with existing persistence patterns.
- The fish animation preview in the store will reuse existing sprite sheet assets and rendering logic.
