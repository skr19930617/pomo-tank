# Implementation Plan: Rebuild Debug UI

**Branch**: `015-rebuild-debug-ui` | **Date**: 2026-03-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/015-rebuild-debug-ui/spec.md`

## Summary

レガシーデバッグコマンド（debugTick, debugReset, debugAddPomo）を全て削除し、専用デバッグUIに機能を集約する。壊れているx10tickを廃止し、ゲームエンジンに動的tick倍率変更機能を追加。デバッグUI上でPomoコイン残高の自由設定とタイマー速度の倍率制御（1x〜100x）を提供する。

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**: React 19, @mui/material, @emotion/react, react-konva 19, Konva 10, @types/vscode ^1.85.0, esbuild ^0.20.0
**Storage**: VSCode ExtensionContext globalState (key-value persistence via `src/persistence/storage.ts`)
**Testing**: Vitest (test directories exist but are empty)
**Target Platform**: VSCode Extension (Node.js backend + browser webview)
**Project Type**: VSCode Extension (desktop-app)
**Performance Goals**: Tick multiplier changes apply within 1 second; UI updates at 60fps
**Constraints**: Single-threaded extension host; webview communication via postMessage
**Scale/Scope**: Single developer tool; 1 debug panel, ~10 files modified

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is unconfigured (template placeholders only). No gates to evaluate. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/015-rebuild-debug-ui/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── game/
│   └── engine.ts            # MODIFY: Add setTickMultiplier(), restart interval logic
├── shared/
│   ├── messages.ts          # MODIFY: Add debugSetTickMultiplier message type
│   └── types.ts             # No changes needed
├── providers/
│   └── tank-panel.ts        # MODIFY: Handle new debug message, remove old command refs
├── webview/
│   └── tank-panel/
│       ├── App.tsx           # MODIFY: Pass new props to DebugPanel
│       └── components/
│           └── DebugPanel.tsx # MODIFY: Rebuild with tick multiplier control
├── extension.ts              # MODIFY: Remove 3 debug commands
└── persistence/
    └── storage.ts            # No changes needed

package.json                  # MODIFY: Remove 3 debug command definitions
```

**Structure Decision**: Single project, VSCode extension pattern. All changes are modifications to existing files — no new files or directories needed. The existing `DebugPanel.tsx` is rebuilt in-place.

## Complexity Tracking

No constitution violations. No complexity justification needed.
