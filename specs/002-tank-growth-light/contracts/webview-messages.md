# Webview Message Contract: 水槽の成長システムとライトスイッチ機能

**Date**: 2026-03-24

## New Messages

### Webview → Extension

| Type | Payload | Purpose |
|------|---------|---------|
| `toggleLight` | — | ライトのオン・オフを切り替える |

### Extension → Webview

#### stateUpdate (変更)

既存の`stateUpdate`メッセージに以下のフィールドを追加:

```
{
  type: "stateUpdate",
  state: {
    ...existing fields...
    tank: {
      sizeTier: TankSizeTier,  // 既存 — Webview側で描画サイズを決定
      ...existing fields...
    },
    lightOn: boolean,           // NEW — ライト状態
  }
}
```

#### lightToggleResult (新規)

```
{
  type: "lightToggleResult",
  lightOn: boolean,    // 切替後の状態
  success: boolean
}
```

## Companion View Contract

### Extension → Companion Webview

`stateUpdate`に`lightOn`と`tank.sizeTier`を含める（既存と同じ形式）。

### Companion Webview → Extension

変更なし。コンパニオンビューからのライト操作は不可。
