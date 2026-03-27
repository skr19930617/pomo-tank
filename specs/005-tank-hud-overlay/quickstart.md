# Quickstart: 水槽HUDオーバーレイ

**Feature**: 005-tank-hud-overlay
**Date**: 2026-03-25

## Prerequisites

- Node.js 18+
- npm
- VSCode (Extension Host デバッグ用)

## Setup

```bash
git checkout 005-tank-hud-overlay
npm install
```

## Development

```bash
# ビルド (esbuild)
npm run build

# ウォッチモード
npm run watch

# VSCode Extension Hostでデバッグ
# F5 キーで Extension Development Host を起動
```

## Key Files to Modify

### 新規作成

| File | Purpose |
|------|---------|
| `src/webview/tank-panel/components/PixelText.tsx` | ドット絵フォントレンダラー (Konva Rect群) |
| `src/webview/tank-panel/components/PixelButton.tsx` | ドット絵調ボタン (Konva Group + Rect) |
| `src/webview/tank-panel/components/HudOverlay.tsx` | HUDバー (タイマー + コイン + ステータス) |
| `src/webview/tank-panel/components/ActionBar.tsx` | アクションボタン群 (5ボタン横並び) |
| `src/webview/tank-panel/components/PomoAnimation.tsx` | ポモ獲得浮遊テキスト |
| `src/webview/tank-panel/hooks/useTimer.ts` | クライアントサイドタイマーフック |

### 既存ファイル変更

| File | Change |
|------|--------|
| `src/webview/tank-panel/components/TankScene.tsx` | HudOverlay + ActionBar をKonva Layer内に追加 |
| `src/webview/tank-panel/App.tsx` | StatsBar・Actions削除、HUDコールバック接続 |
| `src/webview/companion/App.tsx` | openTankクリック廃止、ActionBarコールバック追加 |
| `src/providers/companion-view.ts` | アクションメッセージ (feedFish等) ハンドリング追加 |
| `src/shared/types.ts` | HUD_HEIGHT, POMO_THRESHOLD 定数追加 |

### 削除対象

| File | Reason |
|------|--------|
| `src/webview/tank-panel/components/StatsBar.tsx` | HudOverlayに置換 |
| `src/webview/tank-panel/components/Actions.tsx` | ActionBarに置換 |

## Validation

```bash
# リント + テスト
npm test && npm run lint

# 手動テスト
# 1. Extension Host起動 → サイドバーのコンパニオンビューを確認
# 2. HUD上部にタイマーとコイン表示を確認
# 3. アクションボタンで餌やり・水替え・苔掃除を実行
# 4. 20分経過でタイマーが赤色に変化することを確認
# 5. 拡大ボタンでフルパネルが開くことを確認
# 6. フルパネルでもHUDスタイルが統一されていることを確認
```

## Architecture Notes

- HUDはKonvaコンポーネント（HTML overlayではない）。既存の2xピクセルスケーリング内で描画
- `compact` prop でコンパニオン（タイマー+ポモのみ）とフルパネル（全ステータス）を出し分け
- タイマーはstateUpdateのスナップショット値をクライアントサイドで毎秒補間
- ボタンフィードバックはReact state + RAFで0.5秒発光アニメーション
