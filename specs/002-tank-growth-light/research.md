# Research: 水槽の成長システムとライトスイッチ機能

**Date**: 2026-03-24 | **Plan**: [plan.md](plan.md)

## R-001: Canvas動的サイズ変更のアプローチ

**Decision**: タンクサイズごとに固定のCanvas幅×高さを定義し、stateUpdate時にCanvas要素のwidth/height属性を書き換える

**Rationale**:
- 現在のCanvasは400×300固定。HTML Canvas要素のwidth/height属性を変更することで、描画解像度を直接制御可能
- CSS transform/scaleでの拡縮はピクセルアートがぼやけるため不適切
- Canvas属性変更は描画コンテキストをリセットするが、requestAnimationFrameで毎フレーム再描画しているため問題なし

**Alternatives considered**:
- CSSスケーリング: ピクセルアートの品質劣化で却下
- 単一サイズで描画領域をクリッピング: 小さいタンクで余白が不自然で却下

## R-002: タンクサイズ→描画寸法マッピング

**Decision**: 5段階のキャンバスサイズ（アスペクト比4:3維持）

| TankSizeTier | Canvas Width | Canvas Height | パネル幅比率 |
|-------------|-------------|--------------|------------|
| Nano        | 200         | 150          | ~50%       |
| Small       | 260         | 195          | ~65%       |
| Medium      | 320         | 240          | ~80%       |
| Large       | 370         | 278          | ~93%       |
| XL          | 400         | 300          | 100%       |

**Rationale**:
- アスペクト比4:3を維持することで、既存の描画ロジック（砂・水・藻）がそのまま動作
- Nanoが200px幅で十分に「小さい水槽」と認識でき、XLの400px幅との差が視覚的に明確
- 各段階の幅差は60〜70pxで均等な成長感を演出

**Alternatives considered**:
- パーセンテージベース（50%→100%）: 端数処理でピクセルアートの整合性が崩れる可能性で却下
- 3段階のみ: 成長の達成感が薄いため却下

## R-003: 机の描画アプローチ

**Decision**: Canvas内の水槽下部に木目調の天板をfillRectで描画。水槽の外側（下部）に配置。

**Rationale**:
- 既存のCanvas描画パイプラインに自然に統合可能
- 机の天板は水槽キャンバスの下に追加のCanvas領域（高さ+30px程度）として描画
- 実装: Canvasの高さをTANK_HEIGHT + DESK_HEIGHT（30px）とし、水槽はy=0から、机はy=TANK_HEIGHTから描画

**Alternatives considered**:
- HTML/CSSで机を別要素として配置: Canvas外のDOM要素との位置合わせが煩雑で却下
- 机を水槽内部に描画: 水中に机がある不自然な見た目で却下

## R-004: ライトの描画と操作

**Decision**: Canvas上部にライトバーを描画し、隣接するHTML要素（ボタン/トグル）でスイッチを制御

**Rationale**:
- ライトの視覚表現はCanvas内でピクセルアート描画（水槽上部にバー型ライト）
- スイッチの操作はCanvas内のクリック検出よりも、HTMLボタン要素の方が確実でアクセシブル
- Canvas上部に20px程度のライトバー領域を確保し、ライトバーを描画
- アクションボタン群にライトトグルボタンを追加

**Alternatives considered**:
- Canvas内クリックイベントで座標判定: タッチターゲットが小さく操作しづらいため却下
- VSCodeコマンドパレット経由: 直感的でないため却下

## R-005: ライトオフ時の劣化停止メカニズム

**Decision**: GameEngine.tick()の先頭でlightOn状態をチェックし、オフならdeteriorationとhealth処理をスキップ

**Rationale**:
- 最もシンプルで確実な実装。劣化ロジック自体を変更せず、呼び出し側でガードする
- `lastTickTimestamp`の更新もスキップすることで、オフライン復帰の計算にも影響しない
- メンテナンス間隔タイマーは`sessionStartTime`からの経過ではなく、別途`lastMaintenanceTime`として管理し、ライトオフ中は凍結する

**Alternatives considered**:
- 劣化関数にmultiplier=0を渡す: 関数シグネチャの変更が全体に波及するため却下
- 別のタイマーシステムを導入: 過剰な複雑性のため却下

## R-006: メンテナンスタイマー一時停止の実装

**Decision**: GameStateに`lightOffTimestamp: number | null`を追加。ライトオフ時にタイムスタンプを記録し、オン復帰時に経過時間分を`lastTickTimestamp`に加算

**Rationale**:
- ライトオフ中の経過時間 = `Date.now() - lightOffTimestamp`
- 復帰時: `lastTickTimestamp += lightOffDuration` により、オフ中の時間がなかったかのようにタイマーを調整
- `timeSinceLastMaintenance`の計算もオフ時間を除外する必要あり。同様に`lastMaintenanceTimestamp`を調整

**Alternatives considered**:
- 累積停止時間を別変数で管理: 計算が複雑化するため却下
