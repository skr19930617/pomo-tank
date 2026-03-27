# Feature Specification: MUI & CSS Framework Migration

**Feature Branch**: `012-mui-css-migration`
**Created**: 2026-03-26
**Status**: Draft
**Input**: User description: "ReactのUIフレームワークとしてMUIに置き換えたい。現在のデザインを保ったまま、MUIで置き換えられるものは置き換えて、CSSも扱いやすくスケールしやすいものにしてほしい"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Core UI Component Migration to MUI (Priority: P1)

As a developer, I want all HTML-based UI components (buttons, inputs, panels, overlays) replaced with MUI equivalents so that the codebase uses a consistent, well-maintained component library. The visual appearance must remain unchanged — users should not notice any difference in look or behavior.

**Why this priority**: This is the core migration work. Replacing raw HTML elements with MUI components is the foundation that all other improvements build upon. Without this, the CSS restructuring has no stable component base.

**Independent Test**: Can be fully tested by opening the tank panel, navigating through store, settings, and debug panel, and verifying every interactive element (buttons, inputs, overlays) looks and behaves identically to before the migration.

**Acceptance Scenarios**:

1. **Given** the tank panel is open, **When** the user clicks the Store button, **Then** the store overlay appears with the same dark semi-transparent background, layout, and close button behavior as before.
2. **Given** the store is open, **When** the user views item rows, **Then** each row displays the item name, coin icon with price, fish icon with capacity cost, and Buy/Locked button — visually identical to the pre-migration design.
3. **Given** the tank panel is open, **When** the user expands the Settings panel, **Then** the collapsible section expands to show Focus and Break duration inputs with the same dark-themed styling as before.
4. **Given** the debug panel is visible, **When** the user interacts with pomo input and reset buttons, **Then** all controls work identically and maintain the orange debug accent styling.
5. **Given** the notification toast appears, **When** the user performs an action, **Then** the toast displays with the same positioning, styling, and auto-dismiss behavior as before.

---

### User Story 2 - Scalable CSS Architecture (Priority: P2)

As a developer, I want inline styles and the raw CSS file replaced with a structured, scalable styling approach so that adding new UI components in the future is faster and more consistent. The dark pixel-art theme must be preserved as a reusable theme configuration.

**Why this priority**: The current UI uses ~20 inline style objects scattered across components and a CSS file with mixed concerns. Consolidating into a theme-based system makes the codebase maintainable and enables consistent styling for future features.

**Independent Test**: Can be fully tested by verifying that all inline style objects have been removed from component files and replaced with theme-based styling, and that the visual output remains identical.

**Acceptance Scenarios**:

1. **Given** any HTML-based component file, **When** a developer inspects the code, **Then** no inline `React.CSSProperties` style objects exist — all styling uses the CSS framework's approach.
2. **Given** the application's dark theme, **When** the developer reviews the theme configuration, **Then** all color values (backgrounds, text, borders, accents) are defined in a single theme definition that components reference.
3. **Given** the pixel font is applied, **When** the developer checks the styling configuration, **Then** the font family is set once in the theme and inherited by all components automatically.
4. **Given** a developer wants to add a new styled component, **When** they follow the established patterns, **Then** they can create it using the theme's predefined colors and spacing without defining new color hex values.

---

### User Story 3 - Konva Canvas Components Remain Unchanged (Priority: P3)

As a developer, I want to ensure that the Konva canvas-based components (HUD, ActionBar, Fish sprites, Tank rendering) are completely untouched by this migration so that pixel-art rendering continues to work correctly.

**Why this priority**: Konva components use a fundamentally different rendering pipeline (canvas). Accidentally modifying them could break the core visual experience. This story is about verification and boundary protection.

**Independent Test**: Can be fully tested by opening the tank panel and verifying that the HUD timer, action buttons, fish sprites, tank water, and all canvas-rendered elements look and animate identically.

**Acceptance Scenarios**:

1. **Given** the tank panel is open, **When** the user views the HUD overlay, **Then** the timer, coin balance, capacity display, and stats are rendered identically via Konva canvas.
2. **Given** fish are in the tank, **When** the user observes fish sprites, **Then** all swim, weak, and feeding animations play correctly at the same frame rate.
3. **Given** the action bar is visible, **When** the user clicks feed/water/algae/light buttons, **Then** the pixel-art button icons and feedback animations work identically.

---

### Edge Cases

- What happens if MUI's default styling conflicts with the existing dark theme? The custom theme must override all MUI defaults to match the current design.
- What happens if MUI components have different padding/margin defaults than the current raw HTML? The MUI theme must normalize these to match current spacing.
- What happens with the pixel font? MUI's typography system must use the custom pixel font as the primary font family.
- What happens in the companion sidebar view? If it uses HTML elements, they should also be migrated; if purely canvas-based, they remain unchanged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All HTML `<button>` elements MUST be replaced with MUI Button components, styled to match the current visual appearance (colors, borders, sizes, hover states).
- **FR-002**: All HTML `<input type="number">` elements MUST be replaced with MUI TextField or Input components, styled to match the current dark-themed appearance.
- **FR-003**: The Store overlay MUST be replaced with a MUI Dialog or Modal component, preserving the full-screen dark overlay behavior with the current layout.
- **FR-004**: The Settings panel collapsible behavior MUST be replaced with a MUI Accordion component, preserving the expand/collapse interaction and styling.
- **FR-005**: The notification toast MUST be replaced with a MUI Snackbar or equivalent, preserving the auto-dismiss behavior and positioning.
- **FR-006**: All inline `React.CSSProperties` style objects in HTML-based components MUST be eliminated and replaced with the chosen CSS framework's approach.
- **FR-007**: A centralized theme definition MUST be created containing all current color values, typography settings, and spacing values so components reference the theme rather than hardcoded values.
- **FR-008**: The pixel font (Press Start 2P) MUST remain the primary font for all UI text, configured through the styling system's theme.
- **FR-009**: Konva canvas components (HudOverlay, ActionBar, Fish, Tank, Wall, Desk, Light, FishTooltip, PixelText, PixelButton) MUST NOT be modified in any way.
- **FR-010**: The existing raw CSS file MUST be replaced or minimized to only contain global resets and canvas-specific rules (image-rendering), with all component styling moved to the new framework.
- **FR-011**: The visual output of every UI element MUST be pixel-identical (or indistinguishable) to the pre-migration design at the same viewport sizes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero inline `React.CSSProperties` style objects remain in HTML-based component files after migration.
- **SC-002**: All interactive UI elements (buttons, inputs, overlays, accordions) use MUI components confirmed by import statements.
- **SC-003**: Users cannot visually distinguish the post-migration UI from the pre-migration UI when performing all existing workflows (store, settings, debug).
- **SC-004**: Adding a new themed button or input to any component requires zero new color hex values — all colors come from the centralized theme.
- **SC-005**: The production build completes successfully with no type errors or warnings related to the migration.
- **SC-006**: Canvas-based components have zero file modifications (verified by git diff).

## Assumptions

- MUI (Material UI) version 5+ is used, compatible with React 19.
- The CSS-in-JS solution will be Emotion (MUI's default styling engine), which pairs naturally with MUI's `sx` prop and `styled()` API.
- The MUI theme will use `createTheme()` with a custom dark palette that exactly matches the current hardcoded color values (#181825, #2a2a40, #ccccdd, etc.).
- The companion sidebar webview will be assessed during implementation — if it has HTML elements they will be migrated; if purely canvas-based it will be skipped.
- The FishPreview and PixelIcon components use specialized CSS techniques (sprite animation, box-shadow) that will remain as-is within MUI-styled containers, since MUI has no equivalent for these rendering approaches.
- The CSP (Content Security Policy) in the webview HTML may need updating to allow Emotion's style injection (unsafe-inline is already permitted for styles).
