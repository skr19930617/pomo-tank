# Quickstart: 水換えアニメーション

## Overview

水換えボタン押下 → 水槽クリック → 排水(6s) → ポーズ(2s) → 給水(6s) のアニメーション付き水換え体験を実装する。

## Key Files

| File | Role |
|------|------|
| `src/webview/tank-panel/hooks/useWaterChangeMode.ts` | **NEW** — 水換えモード状態管理 |
| `src/webview/tank-panel/components/Tank.tsx` | **MODIFY** — 動的水位・色描画 |
| `src/webview/tank-panel/components/TankScene.tsx` | **MODIFY** — モード統合・クリックハンドラ |
| `src/webview/tank-panel/components/ActionBar.tsx` | **MODIFY** — ボタン無効化制御 |
| `src/webview/tank-panel/App.tsx` | **MODIFY** — hook 統合・fishBounds 動的化 |

## Architecture Pattern

`useFeedingMode` と同じパターンを踏襲:

1. **Hook** (`useWaterChangeMode`): module-level mutable state + React state for phase
2. **TankScene**: hook の結果を受け取り、クリックハンドラと子コンポーネントに配信
3. **Tank**: 水位・色の props を受け取り描画
4. **ActionBar**: phase を受け取りボタン無効化
5. **App**: fishBounds を水位に応じて動的計算

## Build & Test

```bash
npm run build    # esbuild で extension + webview をビルド
npm test         # vitest でユニットテスト実行
npm run lint     # ESLint チェック
```

## Animation Flow

```
[Button] → ready → [Tank Click] → draining(6s, ease-in-out)
  → paused(2s) → filling(6s, ease-in-out, color blend)
  → idle + sendMessage('changeWater')
```
