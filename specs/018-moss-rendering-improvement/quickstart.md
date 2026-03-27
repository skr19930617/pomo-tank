# Quickstart: 苔の表現の向上

## 変更対象ファイル

1. **新規**: `src/webview/tank-panel/components/AlgaeOverlay.tsx` — 苔ドットオーバーレイ描画コンポーネント
2. **変更**: `src/webview/tank-panel/components/Tank.tsx` — 既存の苔矩形描画を削除
3. **変更**: `src/webview/tank-panel/components/TankScene.tsx` — AlgaeOverlay を Fish の後に配置

## 開発手順

```bash
# ブランチ
git checkout 018-moss-rendering-improvement

# 開発
npm run watch    # esbuild watch mode

# テスト
npm test
npm run lint
```

## 検証方法

Debug mode で `algaeLevel` を 0, 20, 40, 60, 80, 100 に手動設定し、各段階の見た目を確認する。
