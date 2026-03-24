# Webview Message Contract: 型安全化

**Date**: 2026-03-24

## 変更: 文字列→判別共用体への移行

### Before (現在)

```
// Extension → Webview: loose { type: string, ...any }
// Webview → Extension: loose { type: string, itemId?: string }
// 型チェックなし、switch文の網羅性チェック不可
```

### After (判別共用体)

```
// Extension → Webview
type ExtensionToWebviewMessage =
  | { type: "stateUpdate"; state: GameStateSnapshot }
  | { type: "actionResult"; action: string; success: boolean }
  | { type: "purchaseResult"; itemId: string; success: boolean; message?: string }
  | { type: "lightToggleResult"; lightOn: boolean; success: boolean }

// Webview → Extension
type WebviewToExtensionMessage =
  | { type: "ready" }
  | { type: "feedFish" }
  | { type: "changeWater" }
  | { type: "cleanAlgae" }
  | { type: "toggleLight" }
  | { type: "purchaseItem"; itemId: StoreItemId }
  | { type: "openTank" }
```

## 型チェック保証

- Extension側: `handleMessage(msg: WebviewToExtensionMessage)` — switch文で全case網羅
- Webview側: `useGameState()` hookが`ExtensionToWebviewMessage`を受信・ディスパッチ
- 新メッセージ追加時: 型定義1箇所追加 → コンパイルエラーで全ハンドラに追加漏れ通知

## GameStateSnapshot型の厳密化

```
// Before
tank: { sizeTier: string; ... }
fish: Array<{ healthState: string; ... }>
store: { items: Array<{ type: string; ... }> }

// After
tank: { sizeTier: TankSizeTier; ... }
fish: Array<{ healthState: HealthState; ... }>
store: { items: Array<{ type: StoreItemType; ... }> }
```
