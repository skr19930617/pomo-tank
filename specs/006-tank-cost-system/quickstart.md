# Quickstart: Tank Cost System Simplification

**Branch**: `006-tank-cost-system` | **Date**: 2026-03-25

## Overview

This feature simplifies the tank economy by:
1. Replacing fish-count capacity with a cost-based capacity system
2. Making deterioration rates tank-wide and fixed (tied to pomo session duration)
3. Adding cost display to the HUD
4. Ensuring timer is fully configurable and decoupled from tank state

## Key Files to Modify

| File | Purpose | Changes |
|------|---------|---------|
| `src/shared/types.ts` | Type definitions | Add capacityCost to FishSpeciesData, remove hungerRate/dirtinessLoad, add hungerLevel to Tank, remove hungerLevel from Fish, add capacityBonus to FilterData, remove efficiency |
| `src/game/state.ts` | Game catalogs | Update FISH_SPECIES with capacityCost, update FILTERS with capacityBonus, replace TANK_CAPACITY with TANK_BASE_CAPACITY |
| `src/game/deterioration.ts` | Per-tick decay | Rewrite to use tank-wide fixed rates based on session duration |
| `src/game/health.ts` | Fish health | Update isPoorConditions to read tank.hungerLevel |
| `src/game/store.ts` | Purchase logic | Replace fish-count check with cost-capacity check |
| `src/game/engine.ts` | Game loop | Accept sessionMinutes config, pass to deterioration, update action handlers for tank-wide hunger |
| `src/game/points.ts` | Pomo earning | Scale timing windows with session duration |
| `src/webview/tank-panel/components/HudOverlay.tsx` | HUD display | Add cost capacity display |
| `src/webview/tank-panel/hooks/useTimer.ts` | Timer | Use configurable session duration for overtime threshold |
| `src/extension.ts` | Entry point | Read workSessionMinutes config, pass to engine |

## Build & Test

```bash
npm run build    # esbuild bundle
npm test         # Run test suite
npm run lint     # ESLint + Prettier check
```

## Architecture Notes

- **No new files needed** — all changes modify existing modules
- **No new dependencies** — uses existing React, react-konva, VSCode API
- **State migration** — existing save data needs migration handler for schema changes (per-fish hunger → tank-wide, filter efficiency → capacityBonus)
- **Config integration** — `pomotank.workSessionMinutes` already declared in package.json but currently unused; this feature wires it in
