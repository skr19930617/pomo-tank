# Research: UI & Timer Improvements

**Feature**: 011-ui-timer-improvements
**Date**: 2026-03-26

## R1: Timer Architecture — Focus/Break Mode

**Decision**: Extend the existing `useTimer` hook to support two modes (focus count-up, break countdown) with color state derived from timer-theme constants. Break mode is triggered by maintenance actions and managed in the extension host (GameEngine), not purely client-side.

**Rationale**:
- The current timer already tracks `timeSinceLastMaintenance` (server-calculated in `GameEngine.createSnapshot()` at `engine.ts:268`) with client-side RAF interpolation in `useTimer.ts`.
- `sessionMinutes` is already read from VSCode config `pomotank.workSessionMinutes` (extension.ts:32) and passed through the snapshot as `session.sessionMinutes`. This existing path can be reused for the focus duration.
- Break mode requires a new concept: when a maintenance action resets `sessionStartTime`, the engine should also set a `breakEndTimestamp` if the user has a configured break duration > 0. The snapshot already has `isInBreakWindow` (boolean) which can be extended with a `breakRemainingMs` field.
- Color determination happens in the webview (useTimer hook) based on snapshot data + timer-theme constants.

**Alternatives considered**:
- Pure client-side break timer (rejected: break state must survive panel close/reopen, and the engine already manages session timing)
- Separate break overlay/screen (rejected: user wants timer displayed in same HUD location)

## R2: Settings Persistence — Extensible Type

**Decision**: Define a `UserSettings` interface in `src/shared/types.ts` with `focusMinutes`, `breakMinutes` as initial fields. Persist via VSCode globalState alongside existing game state. New message types (`updateSettings` / `settingsUpdate`) for webview ↔ extension communication.

**Rationale**:
- VSCode globalState is the existing persistence mechanism (used in `src/persistence/storage.ts`).
- An extensible TypeScript interface allows adding fields with defaults without breaking existing persisted data (new fields get default values on load).
- The existing `pomotank.workSessionMinutes` VSCode setting will serve as the initial default for `focusMinutes` but the in-UI setting takes precedence once set.

**Alternatives considered**:
- VSCode workspace settings only (rejected: user wants in-UI controls, not JSON editing)
- Separate settings file (rejected: unnecessary complexity for a few fields)

## R3: Timer Color Theme — Centralized Constants

**Decision**: Create `src/shared/timer-theme.ts` containing all timer color hex values and the overtime threshold duration as named exports.

**Rationale**:
- User explicitly requested colors be "in an easy-to-find location as variables."
- A dedicated file is clearer than burying constants in HudOverlay or useTimer.
- Co-locating the overtime threshold (minutes) with colors keeps all timer visual config together.
- Currently, colors are inline in HudOverlay.tsx (`#ffffff`, `#ff4444`). These will be replaced with imports from the theme file.

**Alternatives considered**:
- CSS custom properties (rejected: HUD uses Konva canvas rendering, not CSS)
- Single constants file for all UI (rejected: too broad; timer theme is self-contained)

## R4: Pixel Font for HTML Elements

**Decision**: Use a free pixel web font (e.g., "Press Start 2P" from Google Fonts, or a self-hosted .woff2 file) loaded via CSS `@font-face` in `style.css`. The existing Konva PixelText bitmap font for the HUD remains unchanged.

**Rationale**:
- HTML elements (Store, Settings, buttons, tooltips) use CSS styling and cannot use the bitmap PixelText renderer.
- A .woff2 font file bundled in `media/webview/tank-detail/fonts/` avoids external network dependencies and CSP issues.
- VSCode webview CSP allows loading local fonts via `webview.asWebviewUri()`.
- The Konva HUD already has its own pixel bitmap font (pixel-font-data.ts) which works well at small sizes — no need to change it.

**Alternatives considered**:
- Render all store/settings text via Konva PixelText (rejected: would require rewriting Store.tsx from HTML to canvas, massive effort)
- Use system monospace font (rejected: doesn't achieve the pixel aesthetic)

## R5: Fish Animation Preview in Store

**Decision**: Create a small `FishPreview` component that uses an `<img>` element with the sprite sheet and CSS animation (or a mini Konva Stage) to show the swim animation for each species row in the store.

**Rationale**:
- The Store is HTML-based (not Konva canvas). Sprite URIs are available via `window.__SPRITE_URI_MAP__`.
- Option A — CSS sprite animation: Use the sprite sheet image as a CSS background with `steps()` animation to cycle frames. Lightweight, no extra canvas overhead.
- Option B — Mini Konva Stage per species: More faithful to in-tank rendering but heavier (multiple canvas elements).
- CSS sprite animation is preferred for performance with multiple simultaneous previews.

**Alternatives considered**:
- Static thumbnail image (rejected: user wants animated preview)
- Single shared canvas with all previews (rejected: complex layout integration with HTML store)

## R6: Store Back Button

**Decision**: Add a close/back button in the top-right corner of the Store overlay with an "X" or "← Back" label, using the same pixel font styling.

**Rationale**:
- The store is currently opened/closed via `setStoreOpen` state in App.tsx (line 43).
- The Store component receives no close callback — needs a new `onClose` prop.
- Top-right "X" is the most conventional position for overlay close buttons.

**Alternatives considered**:
- Click outside to close (rejected: store overlay covers entire view, no "outside" area)
- ESC key only (rejected: not discoverable, and webview key handling can be unreliable)
