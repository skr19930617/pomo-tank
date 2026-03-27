# Quickstart: Fish Species Hierarchy Config

## Prerequisites

- Node.js 18+
- VSCode (for running/debugging the extension)

## Setup

```bash
git checkout 009-fish-species-config
npm install
npm run compile
```

## Development Workflow

```bash
# Run tests
npm test

# Lint + format check
npm run lint

# Build extension
npm run compile

# Debug in VSCode
# Press F5 to launch Extension Development Host
```

## Key Files to Understand

| File | Purpose |
|------|---------|
| `src/game/species/index.ts` | Genus registry — start here to understand config structure |
| `src/game/species/neon-tetra.ts` | Example Genus config file |
| `src/game/growth.ts` | Growth curve & aging logic |
| `src/game/maintenance-quality.ts` | Quality score EMA computation |
| `src/game/scaling.ts` | mm ↔ px conversion |
| `src/shared/types.ts` | All type definitions (GenusConfig, SpeciesConfig, Fish) |
| `src/game/engine.ts` | Game loop — hooks growth into pomo completion |

## Adding a New Fish Genus

1. Create `src/game/species/your-genus.ts`:
```typescript
import { GenusConfig, SwimLayer, Personality } from '../../shared/types';

export const yourGenus: GenusConfig = {
  id: 'your_genus',
  displayName: 'Your Genus',
  swimLayer: SwimLayer.middle,
  personality: Personality.calm,
  schoolingMin: 3,
  baseSpeed: 1.0,
  hasFeedingAnim: false,
  capacityCost: 2,
  minTankSize: TankSizeTier.Small,
  species: [
    {
      id: 'variant_a',
      displayName: 'Variant A',
      sprites: { swim: 'swim_64x64_6x2_12f.png', weak: 'weak_64x64_6x2_12f.png' },
      minSizeMm: 20,
      maxSizeMm: 40,
      minLifespanYears: 2,
      maxLifespanYears: 4,
    },
  ],
};
```

2. Register in `src/game/species/index.ts`
3. Add sprites to `media/sprites/fish/your_genus/variant_a/`
4. Add store item in store config (price, prerequisites)

## Testing Growth Mechanics

Use debug mode (existing) to:
- Set pomo balance for purchasing fish
- Simulate pomo completions to observe growth
- Reset state to test fresh migration
