# Quickstart: Filter Config & Pixel-Art Rendering

**Feature**: 013-filter-config-rendering
**Date**: 2026-03-26

## Prerequisites

- Node.js 18+
- VSCode ^1.85.0
- npm dependencies installed: `npm install`

## Development

```bash
npm run watch
# F5 to launch Extension Development Host
# Open command palette → "Pomotank: Open Tank"
```

## Key Files

### New Files
- `src/game/filters/index.ts` — Registry, getFilter(), buildFilterStoreItems()
- `src/game/filters/basic-sponge.ts` — Basic sponge config
- `src/game/filters/hang-on-back.ts` — HOB config
- `src/game/filters/canister.ts` — Canister config
- `src/game/filters/premium-canister.ts` — Premium canister config
- `src/webview/tank-panel/components/Filter.tsx` — Konva component for external filter rendering

### Modified Files
- `src/shared/types.ts` — Add FilterMountType, FilterConfig, FilterVisual types
- `src/game/state.ts` — Remove FILTERS/FilterData, import from filters module, update STORE_ITEMS
- `src/game/store.ts` — Import filter data from new module
- `src/webview/tank-panel/components/Tank.tsx` — Add filterId prop, render internal sponge
- `src/webview/tank-panel/components/TankScene.tsx` — Pass filterId, add Filter component in render tree

## Manual Testing Checklist

- [ ] Open tank panel — basic sponge filter visible inside tank (green rect in bottom-right of water)
- [ ] Purchase hang-on-back filter in store → filter visual changes to box on tank rim
- [ ] Purchase canister filter → cylinder appears on desk to right of tank
- [ ] Purchase premium canister → larger cylinder with gold accent
- [ ] Each filter tier is visually distinct in size and color
- [ ] Filter scales correctly across all 5 tank sizes (Nano→XL)
- [ ] Light off → filter dims along with tank
- [ ] Store filter section works (prices, buy buttons, affordability)
- [ ] Capacity bonus still applies correctly after purchase
- [ ] No filter (null state) → no filter visual renders
