# Research: Pomotank MVP

**Branch**: `001-pomotank-mvp` | **Date**: 2026-03-23

## R1: VSCode Extension Webview Architecture

**Decision**: Use the VSCode Extension API with two webview surfaces:
1. A **WebviewView** registered in the Explorer view container for the persistent companion
2. A **WebviewPanel** in the editor tab area for the detailed tank view

**Rationale**: `WebviewView` (via `vscode.window.registerWebviewViewProvider`) is the API for embedding webviews inside view containers like Explorer. This is distinct from `WebviewPanel` which opens as an editor tab. Both support HTML/CSS/JS rendering and bidirectional message passing with the extension host via `postMessage`/`onDidReceiveMessage`.

**Alternatives considered**:
- TreeView API: Too limited for pixel-art rendering (only supports tree items with icons/labels)
- Custom editor: Designed for file-based editing, not a companion widget
- Status bar only: Insufficient for visual aquarium rendering

## R2: Pixel-Art Rendering in Webview

**Decision**: Use HTML5 Canvas within the webview for pixel-art rendering. Sprite sheets for fish, tank elements, and UI. Animation via `requestAnimationFrame`.

**Rationale**: Canvas is the most performant option for sprite-based pixel-art animation in a webview context. It avoids DOM manipulation overhead and gives precise pixel control. The webview environment supports standard browser APIs including Canvas 2D.

**Alternatives considered**:
- CSS sprites with DOM elements: Higher overhead for many animated elements, harder to control pixel alignment
- WebGL: Overkill for 2D pixel art; adds complexity without benefit at this scale
- SVG: Not suited for pixel-art aesthetic

## R3: Game State Persistence

**Decision**: Use VSCode `ExtensionContext.globalState` for all game state persistence.

**Rationale**: `globalState` persists across sessions, workspaces, and VSCode restarts. It supports JSON-serializable data with `get`/`update` methods. For MVP, the data volume is small (one tank, ≤10 fish, progression state) — well within `globalState` limits. No external files or databases needed.

**Alternatives considered**:
- `workspaceState`: Per-workspace, meaning users would lose progress when switching projects
- File-based (JSON in globalStorageUri): More complex, requires file I/O handling; no benefit at MVP scale
- SQLite via WASM: Massive overkill for simple key-value game state

## R4: Real-Time Game Loop Architecture

**Decision**: Use `setInterval` in the extension host for game tick updates (every 60 seconds), with the webview handling visual animation independently.

**Rationale**: The extension host runs the authoritative game simulation on a 1-minute tick cycle (deterioration calculations, health checks, timer tracking). The webview runs its own `requestAnimationFrame` loop for visual animation (fish swimming, bubbles). State syncs from host → webview via `postMessage` after each tick and after user actions.

This separation means:
- Game state remains correct even if the webview is hidden/collapsed
- Visual animation doesn't affect game logic
- The extension host can detect active coding via `vscode.workspace.onDidChangeTextDocument`

**Alternatives considered**:
- All logic in webview: Webview can be destroyed/hidden when panel collapses — would lose game state
- High-frequency ticks (1s): Unnecessary for minute-scale deterioration; wastes CPU

## R5: Offline Time Calculation

**Decision**: Store `lastTickTimestamp` in `globalState`. On activation, calculate `min(elapsed, 24 hours)` and apply deterioration proportionally.

**Rationale**: Simple delta-time approach. The 24-hour cap (from clarifications) prevents catastrophic state on return from long absences. Applied as a batch update before the first live tick resumes.

**Alternatives considered**:
- No offline deterioration: Undermines the care loop — users could just close VSCode to avoid consequences
- Uncapped deterioration: Too punishing; clarification explicitly chose 24h cap

## R6: TypeScript + Build Tooling

**Decision**: TypeScript for all extension code. esbuild for bundling.

**Rationale**: TypeScript is the standard language for VSCode extensions (first-class support in `@types/vscode`). esbuild is recommended by the VSCode extension guide for fast bundling with minimal config. The `yo code` generator supports this setup out of the box.

**Alternatives considered**:
- Plain JavaScript: Loses type safety for game state models, which have many interrelated types
- webpack: Slower builds, more config; esbuild is the modern VSCode recommendation

## R7: Testing Strategy

**Decision**:
- **Unit tests** (vitest): Game logic — deterioration formulas, health state machine, point calculations, store validation rules
- **Integration tests** (@vscode/test-electron): Extension activation, webview registration, command execution, state persistence

**Rationale**: The game logic is pure computation and highly testable in isolation. The VSCode integration layer (webview providers, commands, status bar) requires the real extension host and is tested via `@vscode/test-electron`. Vitest chosen over Jest for speed and native ESM support.

**Alternatives considered**:
- Jest: Works but slower; vitest is a better fit for modern TypeScript projects
- Only integration tests: Too slow for rapid iteration on game balance formulas
- Mock-based webview testing: Brittle; better to test game logic as pure functions

## R8: Activity Detection

**Decision**: Listen to `vscode.workspace.onDidChangeTextDocument` events. Track a rolling window: if edits occurred in the last 2 minutes, consider the user "actively coding."

**Rationale**: This is the simplest reliable signal that the user is actually coding (not just having VSCode open). The 2-minute rolling window smooths over brief pauses (reading docs, thinking). Used to apply the slight deterioration acceleration during active coding.

**Alternatives considered**:
- Keystroke counting: More granular but requires `vscode.workspace.onDidChangeTextDocument` anyway; count not needed
- File save events only: Too infrequent; misses long editing sessions between saves
- Terminal activity: Out of scope; coding activity means editor activity
