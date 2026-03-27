# Implementation Plan: インタラクティブ餌やりアニメーション

**Branch**: `017-interactive-feeding-anim` | **Date**: 2026-03-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/017-interactive-feeding-anim/spec.md`

## Summary

餌やりボタン押下で即座にhunger減少する現在の動作を、カーソル変化→水槽クリック→缶傾きアニメーション→餌粒落下パーティクル→魚の集合行動→群れ復帰というインタラクティブ体験に置き換える。既存のboids魚アニメーションに餌引力フォースを追加し、性格による反応速度差を表現する。

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**: React 19, react-konva 19, Konva 10, @mui/material, @emotion/react, @types/vscode ^1.85.0, esbuild ^0.20.0
**Storage**: VSCode ExtensionContext globalState（既存、本機能では変更なし）
**Testing**: npm test (既存テストスイート)
**Target Platform**: VSCode Extension Webview (Chromium)
**Project Type**: VSCode Extension (desktop-app)
**Performance Goals**: 60fps維持、パーティクル5-8個追加による描画負荷は無視可能レベル
**Constraints**: Konvaキャンバス内での描画、論理座標系240×190px
**Scale/Scope**: 単一Webviewパネル内、同時操作ユーザー1名

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution未設定（テンプレートのまま）のため、ゲートチェックはスキップ。違反なし。

**Post-Phase 1 Re-check**: 同上、スキップ。

## Project Structure

### Documentation (this feature)

```text
specs/017-interactive-feeding-anim/
├── plan.md              # This file
├── research.md          # Phase 0 output - 技術選定・設計判断
├── data-model.md        # Phase 1 output - エンティティ定義
├── quickstart.md        # Phase 1 output - 開発ガイド
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── webview/tank-panel/
│   ├── components/
│   │   ├── ActionBar.tsx        # 修正: feedボタンのクリック処理変更
│   │   ├── TankScene.tsx        # 修正: FoodOverlay追加、クリックハンドラ追加
│   │   ├── FoodOverlay.tsx      # 新規: 餌缶＋餌粒パーティクル描画
│   │   ├── Tank.tsx             # 参照のみ（水面座標取得）
│   │   └── Fish.tsx             # 軽微修正: feedingActive制御元の変更
│   └── hooks/
│       ├── useFeedingMode.ts    # 新規: 餌やりモード状態マシン
│       ├── useFishAnimation.ts  # 修正: 餌引力フォース追加
│       └── useGameState.ts      # 修正: feedingActive制御をuseFeedingModeに委譲
├── game/
│   └── species/                 # 参照のみ: personality値の確認
└── shared/
    └── messages.ts              # 変更なし（既存feedFishメッセージを再利用）

tests/
└── （既存テストの修正が必要な場合のみ）
```

**Structure Decision**: 既存のVSCode Extension構造を維持。新規ファイルは2つ（useFeedingMode.ts, FoodOverlay.tsx）のみ追加し、残りは既存ファイルの修正で対応。

## Design Decisions

### D1: 餌やりモード状態マシン（useFeedingMode hook）

3フェーズの状態マシンで餌やりの全体フローを管理:
- `idle`: 通常状態。ActionBarのfeedボタンが有効
- `targeting`: カーソル変化中、水槽クリック待ち
- `animating`: 缶傾き＋餌粒落下＋魚集合の進行中

ActionBarの `feedFish` メッセージ送信タイミングを「ボタン押下時」から「アニメーション完了時」に遅延させる。

### D2: パーティクルシステム（FoodOverlay）

Konva `Circle` プリミティブで5-8個の餌粒を描画。各粒は:
- 初期位置: dropX ± 3px, 水面Y座標
- 落下速度: 0.15-0.25 px/frame（ランダム）
- フェード: 生成後~1.5秒でフェード開始、~3.2秒で消滅
- 色: 暖色系（#d4a574 等、餌の粉末イメージ）
- サイズ: 1-2px（ピクセルアートスケール）

### D3: 餌缶ピクセルアート

ActionBarの8×8ビットマップスタイルに合わせ、Konva Rect群で餌缶を表現。rotation=0°→45°へイージングアニメーション（~0.5秒）。缶は水面より上（タンクフレーム付近）に表示。

### D4: Boids餌引力の注入

`useFishAnimation` のフレーム更新ループに、`attractionTarget` が有効な場合の引力計算を追加:
```
foodForceX = (target.x - fish.x) * FOOD_ATTRACTION_FORCE
foodForceY = (target.y - fish.y) * FOOD_ATTRACTION_FORCE
```
- FOOD_ATTRACTION_FORCE: 0.008（cohesionの約3倍、群れ結束力を上回る）
- 性格別遅延: active=0f, social=30f, calm=60f, timid=90f
- 泳層制約は維持（foodForceYは泳層範囲内にクランプ）

### D5: カスタムカーソル

targeting フェーズ中、Konva Stageの containerDiv の `style.cursor` を `url(data:image/png;base64,...), crosshair` に設定。base64画像は16×16pxの餌缶アイコン。フェーズ終了時にデフォルトに戻す。

### D6: ActionBar連携

ActionBarの feedボタン onClick を変更:
- Before: `sendMessage({ type: 'feedFish' })`
- After: `onFeedClick()` コールバック（TankSceneから注入）→ useFeedingModeの `startTargeting()` を呼ぶ
- ボタン無効化条件に `feedingMode.phase !== 'idle'` を追加

## Complexity Tracking

> Constitution未設定のため、複雑性の正式な違反チェックは不要。設計判断の妥当性は上記で記載済み。
