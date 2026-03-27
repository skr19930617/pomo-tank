# Research: 型安全性の改善とWebviewリファクタリング

**Date**: 2026-03-24 | **Plan**: [plan.md](plan.md)

## R-001: TypeScript enumの`as const`オブジェクト vs string enum

**Decision**: `as const`オブジェクトパターン（const assertionつきオブジェクト）を使用

**Rationale**:
- TypeScript string enumはpostMessage経由でJSON.stringifyされると文字列値が保持されるが、受信側で`as`キャストが必要
- `as const`オブジェクトは値の型がリテラル型に推論され、`typeof`でUnion型を抽出可能
- 既存のTankSizeTier, HealthState等のstring enumは`as const`に移行せず維持（破壊的変更を避ける）
- 新規のMessageType, ActionType等は`as const`パターンで定義

**Alternatives considered**:
- string enum統一: 既存enumとの一貫性は良いが、Webview側でのimport/バンドルが複雑化
- branded type: 過剰な複雑性のため却下

## R-002: React + react-konva の VSCode Webview互換性

**Decision**: React 18 + react-konva 18 を使用。問題なく動作する。

**Rationale**:
- VSCode WebviewはChromeベースのiframeであり、React SPAと同一の環境
- esbuildでbrowser target向けにバンドルすれば、通常のSPAと同様に動作
- CSP: nonce付き`<script>`タグでバンドルを読み込む（現在のmain.jsと同一パターン）
- react-konvaのKonva canvasは`<div>`内にcanvas要素を生成するため、既存のCSS `image-rendering: pixelated`適用可能

**Alternatives considered**:
- pixi.js: WebGLベースで過剰。2Dピクセルアートにはreact-konva（Canvas 2D）が適切
- vanilla React + canvas ref: 宣言的描画ができず、既存コードと大差なし
- @react-three/fiber: 3D向けで過剰

## R-003: esbuild複数エントリポイント構成

**Decision**: esbuild.mjsを3エントリポイントに拡張（extension, tank-panel webview, companion webview）

**Rationale**:
- 現在はsrc/extension.tsのみをバンドル。Webview JSは生ファイルとして配信
- React化後はWebview TSXもバンドルが必要
- esbuildは複数エントリポイントをネイティブサポート（`entryPoints`配列）
- extension: platform=node, format=cjs, external=vscode
- webview: platform=browser, format=iife, jsx=automatic

**Alternatives considered**:
- webpack: 過剰な設定量
- vite: VSCode extensionとの統合が不自然
- 別ビルドスクリプト: 管理の複雑化

## R-004: 型共有アーキテクチャ（Extension ↔ Webview）

**Decision**: `src/shared/`ディレクトリに共通型ファイルを配置。extension bundleとwebview bundleの両方からimport。

**Rationale**:
- esbuildがtree-shakingで各バンドルに必要な型のみを含める
- `src/shared/types.ts`: 全ID列挙型、GameState、GameStateSnapshot、定数
- `src/shared/messages.ts`: 判別共用体メッセージ型
- TypeScriptのimport pathが両エントリポイントから解決可能
- 型定義は1箇所に集約され、変更が自動的に両側に伝播

**Alternatives considered**:
- 別パッケージ（monorepo）: 単一拡張には過剰
- declaration fileのみ共有: import解決が煩雑
- 型をコピー: DRY違反

## R-005: react-konvaでのピクセルアートレンダリング

**Decision**: Konvaの`pixelRatio`を2に固定 + CSS `image-rendering: pixelated`

**Rationale**:
- react-konvaの`<Stage>`コンポーネントに固定サイズ（display pixel）を指定
- Konva内部でpixelRatio × display sizeのcanvasを生成
- `pixelRatio: 2`で2x解像度を維持（現在の手動SCALE=2と同等）
- 親divにCSS `image-rendering: pixelated`を適用してブラウザスケーリング時もクリスプに

**Alternatives considered**:
- pixelRatio=1で低解像度: 現在の2x品質から後退
- pixelRatio=devicePixelRatio: デバイス依存で不安定

## R-006: React状態管理パターン

**Decision**: postMessage受信→`useState`で管理。カスタムhook `useGameState()`で抽象化。

**Rationale**:
- ゲーム状態はextension側（GameEngine）が所有。Webviewは表示のみ
- `useGameState()`: messageイベントリスナーをuseEffectで登録、stateUpdateメッセージでsetState
- アクション送信: `vscode.postMessage({ type: MessageType.FeedFish })`をラッパー関数化
- Zustand等の外部状態管理は不要（状態ソースがextension側に1つのため）

**Alternatives considered**:
- Zustand: 外部ライブラリ追加の割にメリット小（postMessage→stateの単純フロー）
- Redux: 過剰
- Context API: useStateで十分

## R-007: バンドルサイズ影響

**Decision**: 許容範囲内。React 18 (~45KB gzip) + react-konva (~15KB gzip) + Konva (~60KB gzip) ≈ 120KB gzip追加

**Rationale**:
- VSCode Webviewはローカルで実行されるため、ネットワーク配信のサイズ制約なし
- Webviewの初回表示時間にわずかな影響（~50ms増加程度）
- esbuildのminify + tree-shakingで実効サイズを最小化
- 拡張性向上のトレードオフとして妥当

**Alternatives considered**:
- Preact: サイズは小さいがreact-konvaと互換性なし
- 独自Canvas抽象化: 開発コストが高すぎる
