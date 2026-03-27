# Quickstart: Tank & Fish Management Settings

**Feature**: 014-tank-fish-management
**Date**: 2026-03-26

## Prerequisites

- Node.js 18+, VSCode ^1.85.0
- `npm install`

## Development

```bash
npm run watch
# F5 → Extension Development Host → "Pomotank: Open Tank"
```

## Key Files

### New Files
- `src/webview/tank-panel/components/TankManager.tsx` — Tank size + filter switching UI
- `src/webview/tank-panel/components/FishManager.tsx` — Fish list with rename/remove

### Modified Files
- `src/game/state.ts` — Fish.customName, snapshot.player.unlockedItems, snapshot.fish[].customName
- `src/shared/messages.ts` — 4 new webview→extension + 1 new extension→webview message types
- `src/game/engine.ts` — switchTank, switchFilter, renameFish, removeFish methods
- `src/providers/tank-panel.ts` — Handle new message types
- `src/webview/tank-panel/App.tsx` — Add TankManager + FishManager accordions
- `src/webview/tank-panel/components/FishTooltip.tsx` — Show customName
- `src/webview/tank-panel/hooks/useGameState.ts` — Handle managementResult messages

## Manual Testing Checklist

- [ ] Open settings area → see Timer, Tank & Filter, Fish as separate sections
- [ ] Tank section shows only unlocked sizes with current highlighted
- [ ] Switch to a valid larger tank → visual updates immediately
- [ ] Switch to a smaller tank that would exceed capacity → warning message, switch blocked
- [ ] Filter section shows only unlocked filters with current highlighted
- [ ] Switch to a valid filter → visual updates immediately
- [ ] Switch to a lower-capacity filter that would exceed capacity → warning, blocked
- [ ] Fish list shows all fish with species names and health
- [ ] Rename a fish → custom name appears in list and in-tank tooltip
- [ ] Clear fish name → reverts to species name
- [ ] Remove a fish with confirmation → fish disappears, capacity freed
- [ ] Cancel removal → fish stays
- [ ] Remove all fish → starter fish auto-spawns on next tick
- [ ] Dead fish appear in list, can be removed
- [ ] All changes persist after panel close/reopen
