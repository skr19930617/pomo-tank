# Quickstart: Pomotank MVP

**Branch**: `001-pomotank-mvp` | **Date**: 2026-03-23

## Prerequisites

- Node.js 18+
- VSCode 1.85+ (for WebviewView API stability)
- npm or pnpm

## Project Setup

```bash
# From repo root
npm install

# Development — run extension in Extension Development Host
# Press F5 in VSCode, or:
npm run watch    # Continuous esbuild compilation
# Then launch "Run Extension" from VSCode debug panel
```

## Project Structure

```
pomo-tank/
├── package.json              # Extension manifest + VSCode contributions
├── tsconfig.json             # TypeScript config
├── esbuild.mjs               # Build script
├── src/
│   ├── extension.ts          # Extension entry point (activate/deactivate)
│   ├── game/
│   │   ├── engine.ts         # Game loop, tick processing, offline catch-up
│   │   ├── state.ts          # GameState type definitions and initial state
│   │   ├── deterioration.ts  # Hunger, dirtiness, algae formulas
│   │   ├── health.ts         # Fish health state machine
│   │   ├── points.ts         # Pomo point calculations, timing bonus, streaks
│   │   └── store.ts          # Store catalog, purchase validation
│   ├── providers/
│   │   ├── companion-view.ts # WebviewViewProvider for Explorer companion
│   │   └── tank-panel.ts     # WebviewPanel for detailed tank view
│   ├── activity/
│   │   └── tracker.ts        # Coding activity detection
│   ├── ui/
│   │   └── status-bar.ts     # Status bar item management
│   └── persistence/
│       └── storage.ts        # GlobalState read/write wrapper
├── media/
│   ├── webview/
│   │   ├── companion/        # HTML/CSS/JS for companion webview
│   │   │   ├── index.html
│   │   │   ├── style.css
│   │   │   └── main.js       # Canvas rendering, animation loop
│   │   └── tank-detail/      # HTML/CSS/JS for detailed tank panel
│   │       ├── index.html
│   │       ├── style.css
│   │       └── main.js       # Full tank view, maintenance buttons, store
│   └── sprites/              # Pixel-art sprite sheets
│       ├── fish/             # Per-species sprite sheets
│       ├── tank/             # Tank backgrounds, decorations
│       └── ui/               # Buttons, bubbles, icons
├── test/
│   ├── unit/                 # Vitest unit tests
│   │   ├── deterioration.test.ts
│   │   ├── health.test.ts
│   │   ├── points.test.ts
│   │   └── store.test.ts
│   └── integration/          # @vscode/test-electron tests
│       ├── extension.test.ts
│       └── persistence.test.ts
└── specs/                    # Feature specifications (this directory)
```

## Key Commands

```bash
npm run build         # One-shot esbuild production build
npm run watch         # Continuous dev build
npm run test:unit     # Run vitest unit tests
npm run test:integration  # Run @vscode/test-electron integration tests
npm run test          # Run all tests
npm run lint          # ESLint check
npm run package       # Package as .vsix for distribution
```

## Development Workflow

1. **Game logic changes** (`src/game/`): Write unit test first → run `npm run test:unit` → implement → verify
2. **Webview changes** (`media/webview/`): Launch Extension Development Host (F5) → edit → reload webview (Cmd+Shift+P → "Developer: Reload Webviews")
3. **Extension host changes** (`src/providers/`, `src/extension.ts`): Restart Extension Development Host to pick up changes
4. **Sprite/art changes** (`media/sprites/`): Reload webview to see updates

## Architecture Quick Reference

- **Extension Host** (`src/`): Runs game logic, manages state, provides webview content
- **Webview** (`media/webview/`): Renders pixel art, handles user clicks, sends actions to host
- **Communication**: `postMessage` / `onDidReceiveMessage` between host ↔ webview
- **Persistence**: `ExtensionContext.globalState` — JSON-serializable game state
- **Game Tick**: 60-second interval in extension host; webview animates independently
