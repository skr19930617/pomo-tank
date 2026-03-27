# Implementation Plan: MUI & CSS Framework Migration

**Branch**: `012-mui-css-migration` | **Date**: 2026-03-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/012-mui-css-migration/spec.md`

## Summary

Replace all HTML-based UI components with MUI equivalents and consolidate ~17 inline style objects + raw CSS into a MUI theme-based architecture using Emotion. The visual design (dark pixel-art theme) must be preserved exactly. Konva canvas components are untouched. The styling approach uses MUI's `sx` prop for component-level overrides and `createTheme()` for centralized palette/typography.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**: React 19, react-dom 19, react-konva 19, Konva 10, **NEW: @mui/material, @emotion/react, @emotion/styled**
**Storage**: VSCode ExtensionContext globalState (existing, unchanged)
**Testing**: Vitest (unit tests), manual visual testing
**Target Platform**: VSCode Extension webview (browser IIFE bundle), VSCode ^1.85.0
**Project Type**: VSCode extension with React/Konva webview
**Performance Goals**: 60fps canvas rendering (unchanged), fast UI response
**Constraints**: CSP allows `'unsafe-inline'` for styles (Emotion compatible), esbuild IIFE bundler, webview sandboxing
**Scale/Scope**: 5 HTML component files to migrate, ~17 inline style objects to eliminate, 1 CSS file to minimize

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No constitution principles defined (template-only). Gate passes by default.

## Project Structure

### Documentation (this feature)

```text
specs/012-mui-css-migration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── webview/
│   ├── tank-panel/
│   │   ├── index.tsx                  # MODIFY: wrap App with ThemeProvider + CssBaseline
│   │   ├── App.tsx                    # MODIFY: replace inline styles with sx/styled, use MUI Snackbar
│   │   ├── theme.ts                   # NEW: MUI theme definition (createTheme)
│   │   ├── hooks/                     # UNCHANGED
│   │   └── components/
│   │       ├── Store.tsx              # MODIFY: MUI Drawer/Modal, Button, Box, Typography
│   │       ├── SettingsPanel.tsx       # MODIFY: MUI Accordion, TextField
│   │       ├── DebugPanel.tsx         # MODIFY: MUI Box, Button, TextField
│   │       ├── FishPreview.tsx        # MODIFY: wrap in MUI Box (keep sprite CSS logic)
│   │       ├── pixel-icons.tsx        # UNCHANGED (box-shadow technique has no MUI equivalent)
│   │       ├── TankScene.tsx          # UNCHANGED (Konva)
│   │       ├── HudOverlay.tsx         # UNCHANGED (Konva)
│   │       ├── ActionBar.tsx          # UNCHANGED (Konva)
│   │       ├── Fish.tsx               # UNCHANGED (Konva)
│   │       └── [other Konva files]    # UNCHANGED
│   └── companion/
│       ├── index.tsx                  # MODIFY: wrap with ThemeProvider + CssBaseline
│       └── App.tsx                    # MODIFY: replace inline styles with sx
├── providers/
│   └── tank-panel.ts                  # UNCHANGED (CSP already allows unsafe-inline)
└── media/
    └── webview/
        └── tank-detail/
            └── style.css              # MODIFY: strip component styles, keep only global resets + canvas rules
```

**Structure Decision**: Follows existing single-project structure. One new file: `theme.ts` for MUI theme. All modifications are in-place replacements within existing files.

## Complexity Tracking

No constitution violations to justify.
