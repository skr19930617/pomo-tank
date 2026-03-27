# Data Model: 苔の表現の向上

## 既存エンティティ（変更なし）

### Tank (src/game/state.ts)
- `algaeLevel: number` — 0-100, 苔の進行度。既存のまま使用。

## 新規エンティティ

### AlgaeDot
苔の個々のドットを表す描画用データ。ゲーム状態には保存せず、描画時に `algaeLevel` から決定論的に生成する。

| Field | Type | Description |
|-------|------|-------------|
| x | number | 水槽内のX座標（0〜tankWidth） |
| y | number | 水槽内のY座標（waterTop〜sandTop） |
| size | number | ドットのサイズ（px）、2-5 の範囲 |
| threshold | number | このドットが表示される最小 algaeLevel (1-100) |

### AlgaeConfig
5段階の視覚パラメータ定義。

| Stage | algaeLevel | maxDots | opacity | 被覆率目安 |
|-------|-----------|---------|---------|-----------|
| 0 | 0 | 0 | 0 | 0% |
| 1 | 1-20 | ~50 | 0.3 | ~5% |
| 2 | 21-40 | ~150 | 0.4 | ~15% |
| 3 | 41-60 | ~350 | 0.5 | ~35% |
| 4 | 61-80 | ~600 | 0.6 | ~60% |
| 5 | 81-100 | ~850 | 0.7 | ~85% |

ドット数と opacity は `algaeLevel` に応じて連続的に補間する。

## 状態遷移

- **上昇**: deterioration tick で `algaeLevel` が増加 → 表示ドット数が増加（低 threshold のドットは保持）
- **減少**: `changeWater` で -10 → 高 threshold のドットから消える
- **リセット**: `cleanAlgae` で 0 → 全ドット非表示
