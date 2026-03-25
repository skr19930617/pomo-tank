# Research: Debug Mode

## R1: Debug Mode Setting Pattern

**Decision**: Use `pomotank.debugMode` as a `boolean` VSCode configuration setting (default: false).

**Rationale**: The project already uses 3 configuration settings in `package.json` (`enableNotifications`, `workSessionMinutes`, `showStatusBar`). Adding another boolean follows the established pattern. The setting is read via `vscode.workspace.getConfiguration('pomotank').get<boolean>('debugMode', false)`.

**Alternatives considered**:
- Environment variable: Not accessible in VSCode extension webviews.
- Command toggle (stateful): More complex, requires persisting toggle state. A setting is simpler and survives restarts.

## R2: Existing Debug Infrastructure

**Decision**: Keep existing command palette debug commands, add webview debug panel as a complementary UI.

**Rationale**: `pomotank.debugTick`, `pomotank.debugReset`, and `pomotank.debugAddPomo` are already registered and functional. The webview panel adds convenience (visible inline, custom pomo amount) without removing the command palette fallback.

## R3: Passing Debug Mode to Webview

**Decision**: Include `debugMode: boolean` in `GameStateSnapshot` rather than a separate message.

**Rationale**: The snapshot is already sent on every state update. Adding a field is the simplest approach and guarantees the webview always has the current value. No new message type needed for reading the setting.

## R4: Confirmation for Reset

**Decision**: Use an inline confirm state in the React component (click "Reset" → shows "Confirm Reset?" → click to confirm or auto-dismiss after 3 seconds).

**Rationale**: `window.confirm()` may not work reliably in VSCode webviews due to CSP restrictions. An inline confirm pattern is safer and more consistent with the existing UI style.
