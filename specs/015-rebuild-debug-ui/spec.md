# Feature Specification: Rebuild Debug UI

**Feature Branch**: `015-rebuild-debug-ui`
**Created**: 2026-03-26
**Status**: Draft
**Input**: User description: "デバッグ関連のコマンドを全て消してdebug専用のUIを作りたい。そのUI上ではpomoコインを自由に設定できるのと、タイマー速度を自由な倍数で進むようにしたい。現状のx10tickがまともに動いてなさそうなのでこれを消して作り直して欲しい"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - タイマー速度の倍率変更 (Priority: P1)

開発者がデバッグモードを有効にしている状態で、デバッグUI上でタイマー速度の倍率を指定すると、ゲームのtick間隔がその倍率に応じて加速される。これにより、通常25分かかるセッションの挙動を短時間で確認できる。

**Why this priority**: 現状のx10tickコマンドが正しく機能しておらず、開発中のテストに最も支障をきたしている。時間経過に依存するゲームロジック（劣化、魚の健康状態、ポイント計算）のテストに不可欠。

**Independent Test**: デバッグUIで倍率を変更し、タンクの劣化速度やタイマー表示が期待通りに加速されることを目視確認できる。

**Acceptance Scenarios**:

1. **Given** デバッグモードが有効, **When** 倍率を5xに設定, **Then** ゲームのtickが通常の5倍の頻度で発生し、タンク状態（空腹度・水の汚れ・藻）が5倍速で変化する
2. **Given** 倍率が10xに設定されている, **When** 倍率を1xに戻す, **Then** ゲームのtick間隔が通常速度（1分間隔）に戻る
3. **Given** デバッグモードが有効, **When** 倍率入力欄に任意の正の整数を入力, **Then** その倍率が即座に反映される

---

### User Story 2 - Pomoコインの自由設定 (Priority: P1)

開発者がデバッグUI上でPomoコインの残高を任意の値に直接設定できる。ストアの購入テストや残高不足時の挙動確認に使用する。

**Why this priority**: ストアでのアイテム購入テストやUI表示の確認に、任意の残高を素早く設定できることが不可欠。

**Independent Test**: デバッグUIでPomo残高を0、100、9999などの値に設定し、UI上の表示とストアの購入可否が正しく反映されることを確認できる。

**Acceptance Scenarios**:

1. **Given** デバッグモードが有効で残高が50, **When** 残高を500に設定, **Then** Pomo残高が即座に500に更新され、UIに反映される
2. **Given** デバッグモードが有効, **When** 残高を0に設定, **Then** 残高が0になり、購入不可のアイテムが正しく表示される
3. **Given** デバッグモードが有効, **When** 負の値を入力, **Then** 0にクランプされて設定される

---

### User Story 3 - レガシーデバッグコマンドの削除 (Priority: P2)

既存のVSCodeコマンドパレット経由のデバッグコマンド（debugTick、debugReset、debugAddPomo）を全て削除し、デバッグ機能をUI上に集約する。

**Why this priority**: コマンドパレット経由のデバッグ操作は使いにくく、x10tickは正しく動作していない。UI集約により一貫した操作体験を提供する。

**Independent Test**: コマンドパレットで「Pomotank: [Debug]」を検索しても何も表示されないことを確認できる。

**Acceptance Scenarios**:

1. **Given** 拡張機能がインストール済み, **When** コマンドパレットで "Pomotank Debug" を検索, **Then** デバッグ関連のコマンドが一切表示されない
2. **Given** package.jsonのコマンド定義, **When** 内容を確認, **Then** debugTick、debugReset、debugAddPomoのコマンド定義が存在しない

---

### User Story 4 - ステートリセット機能の維持 (Priority: P2)

既存のステートリセット機能をデバッグUIに移行し、確認ダイアログ付きでリセットできるようにする。

**Why this priority**: ステートリセットは開発中に頻繁に使う機能であり、UIへの移行により引き続き利用可能にする必要がある。

**Independent Test**: デバッグUI上のリセットボタンを押し、確認後にゲーム状態が初期化されることを確認できる。

**Acceptance Scenarios**:

1. **Given** デバッグモードが有効でゲームが進行中, **When** リセットボタンを押して確認, **Then** ゲーム状態が初期状態に戻る
2. **Given** リセット確認ダイアログが表示中, **When** キャンセルを選択, **Then** ゲーム状態は変更されない

---

### Edge Cases

- 倍率に0以下の値が入力された場合 → 最小値1xにクランプする
- 倍率に極端に大きい値（例: 1000x）が入力された場合 → 上限値100xにクランプする
- デバッグモードが無効な状態でデバッグUIにアクセスしようとした場合 → UIが表示されない
- タイマー速度変更中にデバッグモードを無効にした場合 → 速度が1xに戻る
- Pomoコインに小数や文字列が入力された場合 → 整数に丸めるか、入力を拒否する

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST remove all legacy debug commands (`pomotank.debugTick`, `pomotank.debugReset`, `pomotank.debugAddPomo`) from command registration and package.json
- **FR-002**: System MUST provide a dedicated debug UI panel that is only visible when debug mode is enabled (`pomotank.debugMode` setting)
- **FR-003**: Debug UI MUST allow users to set Pomo coin balance to any non-negative integer value
- **FR-004**: Debug UI MUST allow users to set a timer speed multiplier that changes the tick interval
- **FR-005**: Timer speed multiplier MUST accept values from 1x to 100x
- **FR-006**: When timer speed multiplier is changed, the game engine's tick interval MUST be adjusted accordingly (e.g., 5x = tick every 12 seconds instead of every 60 seconds)
- **FR-007**: Debug UI MUST include a state reset function with a confirmation step to prevent accidental resets
- **FR-008**: When debug mode is disabled, timer speed MUST automatically reset to 1x (normal speed)
- **FR-009**: Pomo coin value set via debug UI MUST be immediately persisted and reflected in all UI elements (HUD, store)
- **FR-010**: Timer speed multiplier changes MUST take effect immediately without requiring a restart

### Key Entities

- **Timer Speed Multiplier**: A positive integer (1-100) controlling how fast game ticks occur. Default is 1 (normal speed). Only active when debug mode is enabled.
- **Debug UI State**: Contains current multiplier value and pomo input value. Transient — not persisted across sessions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer can simulate 25 minutes of game time in under 30 seconds using the speed multiplier
- **SC-002**: Developer can set Pomo balance to any desired value in a single action (type + confirm)
- **SC-003**: All debug functionality is accessible from a single UI panel without using the command palette
- **SC-004**: No debug commands appear in the command palette after the migration
- **SC-005**: Timer speed change takes effect within 1 second of user input
- **SC-006**: State reset completes within 1 second and all UI elements reflect the initial state
