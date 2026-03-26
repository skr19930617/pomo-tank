# Quickstart: MUI & CSS Framework Migration

**Feature**: 012-mui-css-migration
**Date**: 2026-03-26

## Prerequisites

- Node.js 18+
- VSCode ^1.85.0
- npm dependencies installed: `npm install`

## New Dependencies

```bash
npm install @mui/material @emotion/react @emotion/styled
```

## Development

```bash
# Watch mode
npm run watch

# In VSCode: F5 to launch Extension Development Host
# Open command palette → "Pomotank: Open Tank"
```

## Key Files

### New File
- `src/webview/tank-panel/theme.ts` — MUI theme with dark palette, typography, component overrides

### Modified Files (in order)
1. `package.json` — add MUI + Emotion dependencies
2. `src/webview/tank-panel/theme.ts` — create theme
3. `src/webview/tank-panel/index.tsx` — wrap with ThemeProvider + CssBaseline
4. `src/webview/companion/index.tsx` — wrap with ThemeProvider + CssBaseline
5. `src/webview/tank-panel/App.tsx` — MUI Box, Snackbar, Button
6. `src/webview/tank-panel/components/Store.tsx` — MUI Drawer, Button, Box, Typography
7. `src/webview/tank-panel/components/SettingsPanel.tsx` — MUI Accordion, TextField
8. `src/webview/tank-panel/components/DebugPanel.tsx` — MUI Box, Button, TextField
9. `media/webview/tank-detail/style.css` — strip to global resets only

### Untouched Files (Konva canvas)
- TankScene.tsx, HudOverlay.tsx, ActionBar.tsx, Fish.tsx, Tank.tsx, Wall.tsx, Desk.tsx, Light.tsx, FishTooltip.tsx, PixelText.tsx, PixelButton.tsx

## Testing

```bash
npm run build   # Verify build succeeds
npm run lint    # Verify no lint errors
```

### Manual Visual Testing Checklist

- [ ] Open tank panel — overall layout unchanged
- [ ] Canvas rendering (HUD, fish, tank, action bar) — pixel-identical
- [ ] Click Store button — overlay appears with same dark background
- [ ] Store items show coin/fish icons with prices — layout unchanged
- [ ] Buy/Locked buttons styled correctly
- [ ] Close button (X) works in store
- [ ] Expand Settings panel — accordion opens/closes
- [ ] Focus/Break inputs accept numbers, save correctly
- [ ] Debug panel (if enabled) — orange accent theme intact
- [ ] Notification toast appears and auto-dismisses
- [ ] Pixel font applied to all text
- [ ] No MUI default styling "leaking" (blue buttons, rounded cards, etc.)
