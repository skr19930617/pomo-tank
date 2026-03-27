# Quickstart: 水槽の成長システムとライトスイッチ機能

**Date**: 2026-03-24

## Prerequisites

- Node.js (package.jsonに記載のバージョン)
- VSCode ^1.85.0

## Setup

```bash
npm install
npm run build
```

## Development

```bash
npm run watch    # esbuildウォッチモード
```

VSCode内でF5キーでExtension Development Hostを起動。

## Testing

```bash
npm test         # vitest run
npm run lint     # eslint
```

## Key Files to Modify

1. **`src/game/state.ts`** — `GameState`にlightOnフィールド追加、`TANK_RENDER_SIZES`定数追加、`createInitialState()`更新、`GameStateSnapshot`更新
2. **`src/game/engine.ts`** — `tick()`にライトガード追加、`toggleLight()`メソッド追加、タイムスタンプ調整ロジック
3. **`src/game/points.ts`** — `timeSinceLastMaintenance`計算でライトオフ時間を除外
4. **`media/webview/tank-detail/main.js`** — Canvas動的サイズ、机描画、ライトバー描画、暗いオーバーレイ、魚速度調整、魚境界動的計算
5. **`src/providers/tank-panel.ts`** — toggleLightメッセージハンドラー、ライトトグルボタンHTML追加
6. **`src/providers/companion-view.ts`** — Canvas動的サイズ、ライト状態反映
7. **`src/ui/status-bar.ts`** — ライト状態インジケーター追加

## Architecture Notes

- ライト状態は永続化しない（VSCode起動時は常にオン）
- 劣化停止はengine.tick()のガードで実現（deterioration.tsは変更不要）
- Canvas寸法はTankSizeTierから`TANK_RENDER_SIZES`定数で解決
- 机（+30px）とライトバー（+20px）はCanvas内に統合描画
