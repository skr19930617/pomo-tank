# Quickstart: Tank Config Refactor

## Overview

This feature refactors the tank system to use a typed registry pattern (mirroring filters), introduces real-world aquarium dimensions, replaces hardcoded `minTankSize` with dynamic size-based fish restrictions, and improves the light visual effects.

## Key Patterns

### Tank Config Definition (new file pattern)

Each tank is defined in its own file under `src/game/tanks/`:

```typescript
import type { TankConfig } from '../../shared/types';

export const nano20: TankConfig = {
  id: 'nano_20',
  displayName: '20cm Cube',
  widthMm: 200,
  heightMm: 200,
  depthMm: 200,
  baseCapacity: 4,
  pomoCost: 0,
  prerequisite: {},
  description: 'A compact starter cube. Base capacity: 4.',
  renderWidth: 200,
  renderHeight: 150,
};
```

### Tank Registry (mirrors filter registry)

```typescript
import type { TankConfig, TankId } from '../../shared/types';

const ALL_TANKS: TankConfig[] = [nano20, small30, medium45, large60, xl90];

export const TANK_REGISTRY: Map<TankId, TankConfig> = new Map(
  ALL_TANKS.map((t) => [t.id, t]),
);

export function getTank(id: TankId): TankConfig | undefined {
  return TANK_REGISTRY.get(id);
}

export function getAllTanks(): TankConfig[] {
  return ALL_TANKS; // Already ordered by size
}

export function buildTankStoreItems(): Record<string, StoreItemData> {
  // Similar to buildFilterStoreItems() — skip pomoCost=0 items
}
```

### Fish Size Restriction (replaces minTankSize)

```typescript
export function canFishFitInTank(genusId: GenusId, tankId: TankId): boolean {
  const genus = getGenus(genusId);
  const tank = getTank(tankId);
  if (!genus || !tank) return false;

  const maxFishSize = Math.max(...genus.species.map((s) => s.maxSizeMm));
  return tank.widthMm >= maxFishSize * 4;
}
```

### State Migration

```typescript
function migrateState(raw: any): GameState {
  // Detect old format
  if (raw.tank?.sizeTier && !raw.tank?.tankId) {
    const TIER_TO_ID: Record<string, TankId> = {
      'Nano': 'nano_20',
      'Small': 'small_30',
      'Medium': 'medium_45',
      'Large': 'large_60',
      'XL': 'xl_90',
    };
    raw.tank.tankId = TIER_TO_ID[raw.tank.sizeTier] ?? 'nano_20';
    delete raw.tank.sizeTier;

    // Migrate unlockedItems
    const ITEM_MAP: Record<string, string> = {
      'tank_small': 'small_30',
      'tank_medium': 'medium_45',
      'tank_large': 'large_60',
      'tank_xl': 'xl_90',
    };
    raw.player.unlockedItems = raw.player.unlockedItems.map(
      (item: string) => ITEM_MAP[item] ?? item,
    );
  }
  return raw as GameState;
}
```

### Light Diffusion Effect

```typescript
// In Light.tsx — add trapezoid light cone
{lightOn && (
  <Line
    points={[
      tankLeft + 2, lightTop + housingHeight + surfaceHeight,           // top-left
      tankLeft - LIGHT_DIFFUSION_OVERHANG, lightTop + LIGHT_BAR_HEIGHT + LIGHT_GAP, // bottom-left
      tankLeft + tankWidth + LIGHT_DIFFUSION_OVERHANG, lightTop + LIGHT_BAR_HEIGHT + LIGHT_GAP, // bottom-right
      tankLeft + tankWidth - 2, lightTop + housingHeight + surfaceHeight, // top-right
    ]}
    closed
    fill="#ffffcc"
    opacity={0.15}
  />
)}
```

## Build & Test

```bash
npm run test:unit    # Run unit tests
npm run lint         # Lint check
npm run build        # Build extension
```

## Files to Modify (summary)

**New files** (6):
- `src/game/tanks/index.ts`
- `src/game/tanks/nano-20.ts`
- `src/game/tanks/small-30.ts`
- `src/game/tanks/medium-45.ts`
- `src/game/tanks/large-60.ts`
- `src/game/tanks/xl-90.ts`

**Modified files** (14):
- `src/shared/types.ts` — TankId type, TankConfig interface, remove TankSizeTier + old constants
- `src/shared/messages.ts` — switchTank uses TankId
- `src/game/state.ts` — Tank.tankId, migration, re-exports
- `src/game/store.ts` — size-based fish restriction
- `src/game/engine.ts` — switchTank uses TankId
- `src/game/species/index.ts` — update buildFishStoreItems
- `src/game/species/neon-tetra.ts` — remove minTankSize
- `src/game/species/corydoras.ts` — remove minTankSize
- `src/game/species/gourami.ts` — remove minTankSize
- `src/game/species/otocinclus.ts` — remove minTankSize
- `src/game/species/shrimp.ts` — remove minTankSize
- `src/webview/tank-panel/components/TankScene.tsx` — layout spacing
- `src/webview/tank-panel/components/Light.tsx` — diffusion effect
- `src/webview/tank-panel/components/TankManager.tsx` — use tank registry
