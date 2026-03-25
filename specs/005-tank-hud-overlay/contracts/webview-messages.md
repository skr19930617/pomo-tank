# Contract: Webview Message Protocol

**Feature**: 005-tank-hud-overlay
**Date**: 2026-03-25

## Overview

この機能では既存のメッセージプロトコル型に変更を加えない。コンパニオンビュープロバイダーが新たにハンドリングするメッセージは全て既存の `WebviewToExtensionMessage` 型で定義済み。

## Companion View: 新規ハンドリング対象メッセージ

現在 `companion-view.ts` が処理するメッセージ:
- `ready` (既存)
- `openTank` (既存)

追加でハンドリングが必要なメッセージ:
- `feedFish` → GameEngine.feedFish() 呼び出し
- `changeWater` → GameEngine.changeWater() 呼び出し
- `cleanAlgae` → GameEngine.cleanAlgae() 呼び出し
- `toggleLight` → GameEngine.toggleLight() 呼び出し

レスポンス:
- `actionResult` → コンパニオンwebviewに送信（ボタンフィードバック用）
- `lightToggleResult` → コンパニオンwebviewに送信

## TankScene Props: 新規追加

```
HudOverlay props:
  - compact: boolean (コンパニオン=true, フルパネル=false)
  - timerSeconds: number
  - isOvertime: boolean
  - isPaused: boolean
  - pomoBalance: number
  - avgHunger: number (compact=false時のみ使用)
  - waterDirtiness: number (compact=false時のみ使用)
  - algaeLevel: number (compact=false時のみ使用)
  - currentStreak: number (compact=false時のみ使用)

ActionBar props:
  - sceneWidth: number
  - sceneHeight: number
  - sendMessage: (msg) => void
  - lightOn: boolean
  - showExpand: boolean (コンパニオン=true, フルパネル=false)
  - onExpandClick: () => void
  - feedbackState: Map<string, number>
```

## Invariants

- メッセージ型 (`WebviewToExtensionMessage`, `ExtensionToWebviewMessage`) は変更しない
- GameStateSnapshot の構造は変更しない
- 既存のtank-panel.tsのメッセージハンドリングは変更しない
