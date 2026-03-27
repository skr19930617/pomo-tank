# Data Model: 型安全性の改善とWebviewリファクタリング

**Date**: 2026-03-24 | **Plan**: [plan.md](plan.md)

## 新規型定義 (src/shared/types.ts)

### ActionType（新規）

メンテナンスアクションの列挙型。現在の文字列リテラルユニオンを置換。

```
ActionType = "feedFish" | "changeWater" | "cleanAlgae"
```

### 既存列挙型の移動

以下の列挙型を`src/game/state.ts`から`src/shared/types.ts`に移動し、state.tsからre-export:

- `TankSizeTier` — Nano, Small, Medium, Large, XL
- `HealthState` — Healthy, Warning, Sick, Dead
- `StoreItemType` — TankUpgrade, Filter, FishSpecies

### GameStateSnapshot（変更）

| Field | Before | After |
|-------|--------|-------|
| `tank.sizeTier` | `string` | `TankSizeTier` |
| `fish[].healthState` | `string` | `HealthState` |
| `store.items[].type` | `string` | `StoreItemType` |

### FishSpeciesId / FilterId / StoreItemId

既存のstring keyをブランド型またはunion literalとして型制約:

```
FishSpeciesId = "guppy" | "neon_tetra" | "corydoras" | "betta" | "angelfish"
FilterId = "basic_sponge" | "hang_on_back" | "canister" | "premium_canister"
StoreItemId = "tank_small" | "tank_medium" | "tank_large" | "tank_xl"
            | "hang_on_back" | "canister" | "premium_canister"
            | "neon_tetra" | "corydoras" | "betta" | "angelfish"
```

## メッセージ型定義 (src/shared/messages.ts)

### ExtensionToWebviewMessage（新規 判別共用体）

Extension → Webview方向の全メッセージを包括する判別共用体型。

| type discriminant | Payload |
|-------------------|---------|
| `stateUpdate` | `{ state: GameStateSnapshot }` |
| `actionResult` | `{ action: string; success: boolean }` |
| `purchaseResult` | `{ itemId: string; success: boolean; message?: string }` |
| `lightToggleResult` | `{ lightOn: boolean; success: boolean }` |

### WebviewToExtensionMessage（新規 判別共用体）

Webview → Extension方向の全メッセージ。

| type discriminant | Payload |
|-------------------|---------|
| `ready` | — |
| `feedFish` | — |
| `changeWater` | — |
| `cleanAlgae` | — |
| `toggleLight` | — |
| `purchaseItem` | `{ itemId: StoreItemId }` |
| `openTank` | — (companion only) |

## 既存型の変更

### GameState

| Field | Change |
|-------|--------|
| `lightOn` | 既存 — 変更なし |
| `lightOffTimestamp` | 既存 — 変更なし |

GameState自体のフィールドは変更なし。内部の`Fish.speciesId`を`FishSpeciesId`型に、`Tank.filterId`を`FilterId | null`型に厳密化。

### Fish（変更）

| Field | Before | After |
|-------|--------|-------|
| `speciesId` | `string` | `FishSpeciesId` |

### Tank（変更）

| Field | Before | After |
|-------|--------|-------|
| `filterId` | `string \| null` | `FilterId \| null` |

### PlayerProfile（変更）

変更なし。

## 後方互換性

永続化されたGameState（globalState）は文字列値で保存されている。読み込み時に:
- `lightOn`が存在しない場合: `true`をデフォルト値として補完
- `lightOffTimestamp`が存在しない場合: `null`をデフォルト値として補完
- `speciesId`等の文字列値は型アサーション（`as FishSpeciesId`）で変換

この後方互換性ロジックは既にextension.tsのstate復元処理で部分的に実装済み。新型定義導入時にバリデーション関数を追加する。
