# Quickstart: UI & Timer Improvements

**Feature**: 011-ui-timer-improvements
**Date**: 2026-03-26

## Prerequisites

- Node.js 18+
- VSCode ^1.85.0 (for extension development)
- npm dependencies installed: `npm install`

## Development

```bash
# Watch mode (rebuilds on save)
npm run watch

# In VSCode: F5 to launch Extension Development Host
# Open command palette → "Pomotank: Open Tank"
```

## Key Files to Edit

### Phase 1: Timer Theme Constants
1. Create `src/shared/timer-theme.ts` — all timer colors + overtime threshold
2. Update `src/webview/tank-panel/components/HudOverlay.tsx` — import colors from theme

### Phase 2: Settings System
1. Add `UserSettings` type to `src/shared/types.ts`
2. Add `updateSettings` / `settingsUpdate` messages to `src/shared/messages.ts`
3. Add settings persistence to `src/persistence/storage.ts`
4. Add settings message handling to `src/providers/tank-panel.ts`
5. Create `src/webview/tank-panel/hooks/useSettings.ts`
6. Create `src/webview/tank-panel/components/SettingsPanel.tsx`
7. Update `src/webview/tank-panel/App.tsx` — add collapsible settings section

### Phase 3: Timer Focus/Break Logic
1. Update `src/game/engine.ts` — break timer state, mode transitions
2. Extend `GameStateSnapshot.session` in `src/game/state.ts`
3. Update `src/webview/tank-panel/hooks/useTimer.ts` — break countdown + color state
4. Update `src/webview/tank-panel/components/HudOverlay.tsx` — multi-color rendering

### Phase 4: Store Improvements
1. Update `src/webview/tank-panel/components/Store.tsx` — back button + onClose prop
2. Update `src/webview/tank-panel/App.tsx` — pass onClose to Store
3. Create `src/webview/tank-panel/components/FishPreview.tsx` — animated sprite preview
4. Integrate FishPreview into Store item rows

### Phase 5: Pixel Font
1. Add font file to `media/webview/tank-detail/fonts/`
2. Update `media/webview/tank-detail/style.css` — @font-face + apply to all text
3. Update `src/providers/tank-panel.ts` — add font directory to localResourceRoots

## Testing

```bash
# Run all tests
npm test

# Run with watch
npm run test -- --watch
```

### Manual Testing Checklist

- [ ] Open tank panel, verify timer starts in white (focus mode)
- [ ] Wait past focus duration → timer turns yellow
- [ ] Wait past overtime threshold → timer turns red
- [ ] Perform maintenance action → timer switches to green countdown
- [ ] Break countdown reaches 0 → timer resets to white count-up
- [ ] Open settings, change focus/break durations, verify persistence
- [ ] Open store → back button visible, click closes store
- [ ] Store fish species rows show animated sprite previews
- [ ] All UI text uses pixel font (store, settings, buttons)
- [ ] Close and reopen panel → settings preserved
