# Quickstart: 苔掃除アクション化

## 開発環境セットアップ

```bash
npm install
npm run compile   # esbuildでビルド
# VSCodeでF5 → Extension Development Hostで動作確認
```

## テスト

```bash
npm test && npm run lint
```

## 実装の起点

### 1. useMossCleaningMode フック作成
- 参考: `src/webview/tank-panel/hooks/useWaterChangeMode.ts`
- 同じパターン（フェーズ管理、rAFアニメーション、mutable state）で実装

### 2. TankScene統合
- 参考: `src/webview/tank-panel/components/TankScene.tsx` lines 198-238
- Stage上でmousedown/mousemove/mouseup/mouseleaveイベントを追加

### 3. ActionBar排他制御
- 参考: `src/webview/tank-panel/components/ActionBar.tsx` lines 202-218
- `getButtonState`関数に`mossCleaningPhase`条件を追加

### 4. メッセージハンドラ
- 参考: `src/providers/tank-panel.ts` lines 137-148（水換えメッセージ処理）
- `mossCleaningProgress`で苔レベルを段階的に低下

## キーファイル

| File | Role |
|------|------|
| `src/webview/tank-panel/hooks/useMossCleaningMode.ts` | 新規: モードロジック |
| `src/webview/tank-panel/components/TankScene.tsx` | マウスイベント統合 |
| `src/webview/tank-panel/components/ActionBar.tsx` | ボタン状態制御 |
| `src/shared/messages.ts` | メッセージ型定義 |
| `src/providers/tank-panel.ts` | Extension側ハンドラ |
| `src/game/engine.ts` | performAction変更 |
