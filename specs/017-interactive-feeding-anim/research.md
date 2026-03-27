# Research: インタラクティブ餌やりアニメーション

**Date**: 2026-03-26

## R1: カスタムカーソルの実装方法（VSCode Webview内）

**Decision**: CSS `cursor` プロパティでカスタムカーソル画像を適用する

**Rationale**: VSCode WebviewはChromium上で動作し、CSSの `cursor: url(data:image/png;base64,...), auto` がそのまま使える。Konvaキャンバス自体はDOM要素なのでcanvasのstyle.cursorを変更するか、wrapping divのcursorを切り替える。MUIのCssBaselineが既に適用されているため追加のCSS注入は不要。

**Alternatives considered**:
- Konva上にカーソル追従スプライトを描画 → 実際のカーソルが残り二重表示になるため不採用
- VSCode API経由のカーソル変更 → Webview内のDOM操作で十分、拡張API不要

## R2: 餌粒パーティクルの描画方式

**Decision**: Konva `Circle` プリミティブで餌粒を描画し、`requestAnimationFrame` ループ内で位置・透明度を更新する

**Rationale**: 既存の魚アニメーションが `requestAnimationFrame` で60fps動作しており、同じループに餌粒の更新を追加するのが自然。Konva `Circle` は軽量で5-10個程度なら描画コストは無視できる。スプライトシートは不要。

**Alternatives considered**:
- Konva `Sprite` で餌粒アニメーション → 専用スプライト作成が必要、パーティクルには過剰
- HTML Canvas 2D直接描画 → Konvaレイヤーと混在すると管理が複雑
- CSS DOM要素によるパーティクル → Konvaキャンバス座標系と位置合わせが困難

## R3: 餌缶アニメーションの実装方式

**Decision**: Konvaの `Group` + `Rect` のピクセルアートで餌缶を表現し、回転（rotation）プロパティで傾きをアニメーションする

**Rationale**: 既存のアイコン（ActionBarの8×8ビットマップ）と同じピクセルアートスタイルで統一できる。新規スプライトシート不要。Konvaの `rotation` プロパティはフレームごとの補間で滑らかに動作する。

**Alternatives considered**:
- スプライトシートアニメーション → 新規アセット制作が必要で工数増
- CSS transform による回転 → Konvaキャンバス内のオブジェクトには適用不可

## R4: Boidsシステムへの餌引力の統合方法

**Decision**: 既存のboids力計算に「餌引力（food attraction force）」を追加フォースとして注入する。餌が存在する間、各魚に対して餌位置への方向ベクトルを速度に加算する。

**Rationale**: 現在のboids実装（separation/alignment/cohesion）にもう1つの力を追加するだけで、既存のコード構造を壊さない。餌引力が群れの結束力より強ければ自然に群れから離脱し、餌消滅後は通常のboids力で自然に再合流する。

**Alternatives considered**:
- 餌やり中にboids無効化 → 群れ離脱→復帰の自然な遷移が表現できない
- 別の移動モードに切り替え → 状態遷移が複雑になり、境界でのちらつきリスク

## R5: 性格による反応速度差の実装方式

**Decision**: 性格ごとに「反応遅延フレーム数」を設定し、餌出現からのフレームカウントが遅延を超えた魚のみ餌引力を適用する

**Rationale**: フレームカウントベースの遅延は既存の `frameCount` を活用でき、実装が簡潔。反応速度マッピング: active=0フレーム（即反応）、social=30フレーム（~0.5秒）、calm=60フレーム（~1秒）、timid=90フレーム（~1.5秒）。

**Alternatives considered**:
- 引力係数を性格で変える → 全魚が同時に動き出すため視覚的な差が分かりにくい
- ランダム遅延 → 性格の特徴が曖昧になる

## R6: 餌やりモードの状態管理

**Decision**: 新規React hook `useFeedingMode` で餌やりモードの状態マシンを管理する。フェーズ: `idle` → `targeting`（クリック待ち） → `animating`（缶＋餌粒） → `idle`

**Rationale**: 既存の `useGameState` は拡張ホストとの通信に責任を持ち、UI固有のモード管理を混ぜるとSRPに反する。専用hookにすることでテスト容易性も向上する。

**Alternatives considered**:
- useGameState内に統合 → 責任過多、テスト困難
- useReducerでグローバル管理 → このモードはTankScene内で閉じており、グローバル化不要

## R7: メッセージフローの変更

**Decision**: 餌やりモードのアニメーション完了後に `feedFish` メッセージを送信する（現在のボタン即送信から変更）

**Rationale**: FR-011「効果はアニメーション完了後に適用」を満たすには、メッセージ送信タイミングをアニメーション終了時に遅延させる必要がある。ActionBarのボタンクリックはモード遷移のみを行い、実際の `feedFish` 送信は餌粒消滅時に実行する。

**Alternatives considered**:
- ボタン即送信＋UI上で効果表示を遅延 → hungerの即座の減少がstateUpdateで反映され、UIとの乖離が生じる
