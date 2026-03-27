# Implementation Plan: Tank Config Refactor

**Branch**: `016-tank-config-refactor` | **Date**: 2026-03-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/016-tank-config-refactor/spec.md`

## Summary

水槽定義をフィルターと同じレジストリパターンに統一し、実寸サイズ（mm）ベースの定義に移行する。魚種のタンク制限を `minTankSize` から動的なサイズ計算（maxSizeMm × 4 <= widthMm）に置き換える。ライトの拡散エフェクトと間隔の改善を行う。

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**: React 19, react-konva 19, Konva 10, @mui/material, @emotion/react, @types/vscode ^1.85.0, esbuild ^0.20.0
**Storage**: VSCode ExtensionContext globalState (key-value persistence via `src/persistence/storage.ts`)
**Testing**: Vitest ^1.2.0 (`npm run test:unit`)
**Target Platform**: VSCode Extension (desktop)
**Project Type**: VSCode Extension (idle game companion)
**Performance Goals**: 60fps rendering in Konva canvas
**Constraints**: Single-threaded, webview sandbox, globalState JSON serialization
**Scale/Scope**: 5 tank sizes, 5 fish genera, ~15 species, single-user local state

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is not configured for this project (template placeholders only). No gates to enforce. Proceeding.

## Project Structure

### Documentation (this feature)

```text
specs/016-tank-config-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── shared/
│   └── types.ts                    # TankId type, TankConfig interface (modify)
├── game/
│   ├── tanks/                      # NEW: tank registry (mirrors filters/)
│   │   ├── index.ts                # getTank(), getAllTanks(), buildTankStoreItems()
│   │   ├── nano-20.ts              # 20cm cube tank config
│   │   ├── small-30.ts             # 30cm tank config
│   │   ├── medium-45.ts            # 45cm tank config
│   │   ├── large-60.ts             # 60cm tank config
│   │   └── xl-90.ts                # 90cm tank config
│   ├── species/
│   │   ├── neon-tetra.ts           # Remove minTankSize (modify)
│   │   ├── corydoras.ts            # Remove minTankSize (modify)
│   │   ├── gourami.ts              # Remove minTankSize (modify)
│   │   ├── otocinclus.ts           # Remove minTankSize (modify)
│   │   ├── shrimp.ts               # Remove minTankSize (modify)
│   │   └── index.ts                # Update buildFishStoreItems (modify)
│   ├── store.ts                    # Size-based fish restriction logic (modify)
│   ├── engine.ts                   # switchTank uses TankId (modify)
│   └── state.ts                    # Tank interface uses TankId, migration (modify)
├── webview/tank-panel/components/
│   ├── TankScene.tsx               # Layout spacing changes (modify)
│   ├── Light.tsx                   # Diffusion effect (modify)
│   ├── TankManager.tsx             # Use tank registry (modify)
│   └── Tank.tsx                    # Render sizes from registry (modify)
├── persistence/
│   └── storage.ts                  # No changes needed
└── shared/
    └── messages.ts                 # switchTank message uses TankId (modify)

tests/
└── unit/
    ├── tank-registry.test.ts       # NEW: tank config registry tests
    └── fish-size-restriction.test.ts # NEW: size-based restriction tests
```

**Structure Decision**: Follows existing project structure. New `src/game/tanks/` directory mirrors `src/game/filters/` pattern exactly.
