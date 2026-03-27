# Quickstart: インタラクティブ餌やりアニメーション

**Branch**: `017-interactive-feeding-anim`

## Overview

餌やりボタンの即時完了を、カーソル変化→水槽クリック→缶傾き→餌粒落下→魚集合のインタラクティブ体験に置き換える。

## Key Files to Modify

| File | Change |
|------|--------|
| `src/webview/tank-panel/components/ActionBar.tsx` | feedボタンのクリックをモード遷移コールバックに変更 |
| `src/webview/tank-panel/hooks/useFishAnimation.ts` | 餌引力フォースをboidsループに追加 |
| `src/webview/tank-panel/hooks/useGameState.ts` | feedingActive制御をuseFeedingModeに委譲 |
| `src/webview/tank-panel/components/TankScene.tsx` | FoodOverlayコンポーネント追加、クリックハンドラ追加 |

## New Files

| File | Purpose |
|------|---------|
| `src/webview/tank-panel/hooks/useFeedingMode.ts` | 餌やりモード状態マシン（idle/targeting/animating） |
| `src/webview/tank-panel/components/FoodOverlay.tsx` | 餌缶＋餌粒パーティクルのKonva描画 |

## Architecture

```
ActionBar (feedボタン)
  ↓ onFeedClick callback
useFeedingMode (状態マシン)
  ↓ phase: targeting
TankScene (水槽クリックハンドラ)
  ↓ onClick → dropX確定
useFeedingMode (phase: animating)
  ↓ particles, canState
FoodOverlay (Konva描画)
  ↓ 毎フレーム更新
useFishAnimation (餌引力注入)
  ↓ attractionTarget
Fish sprites (集合行動)
  ↓ 全餌粒消滅
useFeedingMode → idle + sendMessage('feedFish')
```

## Build & Test

```bash
npm run build     # esbuildバンドル
npm test          # 既存テスト実行
npm run lint      # ESLint チェック
```

手動テスト: VSCodeでExtension Development Hostを起動し、水槽パネルの餌やりボタンで動作確認。
