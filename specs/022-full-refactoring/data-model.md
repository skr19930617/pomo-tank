# Data Model: 全体のリファクタリング

**Date**: 2026-03-28

## Entities (変更なし — 型定義の集約のみ)

本リファクタリングではエンティティの構造変更は行わない。以下は型定義の集約・移動に関する記録。

### SpriteUriMap (型統合)

- **Before**: 4 ファイルに同一型が重複定義
  - `providers/tank-panel.ts`: `type SpriteUriMap = Record<string, Record<string, Record<string, string>>>`
  - `webview/tank-panel/hooks/useGameState.ts`: インラインで同型
  - `webview/tank-panel/components/FishManager.tsx`: インラインで同型
  - `webview/tank-panel/components/Store.tsx`: インラインで同型
- **After**: `src/shared/sprite-utils.ts` から単一 export

### GameState (any → unknown)

- **Before**: `migrateState(raw: any): GameState`
- **After**: `migrateState(raw: unknown): GameState` + 型ガード関数

### Water Freeze State (簡素化)

- **Before**: `waterQualityFrozen: boolean` + `waterChangeOwnerId: string | null`
- **After**: `waterFreezers: Set<string>`（内部状態のみ、永続化対象外）

## Game Constants (新規集約)

| Constant | Source | Value | Category |
|----------|--------|-------|----------|
| WARNING_THRESHOLD | health.ts | 120 | Fish health |
| SICK_THRESHOLD | health.ts | 300 | Fish health |
| DEAD_THRESHOLD | health.ts | 540 | Fish health |
| (decay rates) | deterioration.ts | various | Tank deterioration |
| (bonus multipliers) | points.ts | various | Pomo rewards |

## State Flow Change

```
Before:
  Extension → <script>window.__SPRITE_URI_MAP__=...</script> → Webview reads global

After:
  Extension → stateUpdate message (includes spriteUriMap) → Webview
  → SpriteUriMapProvider (React Context) → useSpriteUriMap() hook → Components
```
