# Feature Specification: 型安全性の改善とWebviewリファクタリング

**Feature Branch**: `003-type-safety-refactor`
**Created**: 2026-03-24
**Status**: Draft
**Input**: User description: "現状の機能を保ったまま、型が不完全だったり、文字列でベタガキしている部分を全て整理したい。拡張性を重視してreactやreact-konvaなど適切なライブラリを使えるなら使うこと"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 全ての文字列リテラルを型安全な定数に統一する (Priority: P1)

開発者として、コードベース全体でハードコードされた文字列（メッセージ型、アクション名、魚種ID、フィルターID、ヘルス状態、ストアアイテムID）を列挙型または定数に統一する。これにより、タイポによるバグが排除され、IDEの補完とリファクタリング支援が有効になる。

**Why this priority**: 現在50箇所以上で文字列がベタ書きされており、新機能追加や変更時に複数ファイルを手動で同期する必要がある。型安全な定数への統一は他のリファクタリングの基盤となるため最優先。

**Independent Test**: ビルドが成功し、全ての既存機能（餌やり、水替え、藻掃除、ストア購入、ライトスイッチ、タンクサイズ変更）が変更前と同一の動作をすることを確認できる。

**Acceptance Scenarios**:

1. **Given** リファクタリング前のコードベース, **When** 文字列リテラルをgrepで検索する, **Then** メッセージ型・アクション名・ID類に関するハードコード文字列が25箇所以上見つかる
2. **Given** リファクタリング後のコードベース, **When** 同じgrepを実行する, **Then** 該当するハードコード文字列が0件になっている（全て定数経由）
3. **Given** リファクタリング後のコード, **When** 存在しないアクション名やメッセージ型を使おうとする, **Then** コンパイルエラーになる
4. **Given** リファクタリング後のコード, **When** 全ての既存機能を手動テストする, **Then** リファクタリング前と完全に同じ動作をする

---

### User Story 2 - GameStateSnapshotの型を厳密化する (Priority: P1)

開発者として、Extension↔Webview間の通信で使用されるGameStateSnapshotインターフェースで`string`として定義されているフィールド（sizeTier, healthState, store item type）を適切な列挙型に変更する。メッセージ送受信の型定義を判別共用体（discriminated union）として定義し、単一の型定義から全ての通信を型安全にする。

**Why this priority**: Webview通信の型安全性は拡張性の根幹であり、React導入の前提条件でもある。

**Independent Test**: GameStateSnapshotの各フィールドに不正な値を代入しようとするとコンパイルエラーになることを確認できる。

**Acceptance Scenarios**:

1. **Given** リファクタリング後のGameStateSnapshot, **When** sizeTierに不正な文字列を代入しようとする, **Then** コンパイルエラーになる
2. **Given** リファクタリング後のメッセージ型定義, **When** Extension→Webview/Webview→Extensionのメッセージを送信する, **Then** 型チェックにより不正なメッセージ構造を検出できる
3. **Given** リファクタリング後のコード, **When** 新しいメッセージ型を追加する, **Then** 型定義を1箇所に追加するだけで、送信側・受信側の両方にコンパイルエラーで追加漏れが通知される

---

### User Story 3 - WebviewをReact + react-konvaで再構築する (Priority: P2)

開発者として、現在のバニラJS Canvas描画（media/webview/tank-detail/main.js, companion/main.js）をReactコンポーネント + react-konvaによる宣言的Canvas描画に置き換える。これにより、UI状態管理が明確になり、新しい水槽デコレーションや魚種の追加が容易になる。

**Why this priority**: React + react-konvaの導入は大きな変更だが、US1・US2で型基盤が整った後に行うことで安全に移行できる。拡張性への最大のインパクトを持つ。

**Independent Test**: React版Webviewで全ての既存ビジュアル要素（壁背景、机、ライトバー、水槽、水、砂、藻、魚アニメーション、暗転オーバーレイ）が同等に表示され、全てのインタラクション（ボタン操作、ストア、ライトスイッチ）が動作することを確認できる。

**Acceptance Scenarios**:

1. **Given** React化されたWebview, **When** 水槽パネルを開く, **Then** リファクタリング前と視覚的に同等の水槽が表示される
2. **Given** React化されたWebview, **When** 魚が泳ぐアニメーションを観察する, **Then** 滑らかな60fpsのアニメーションが維持されている
3. **Given** React化されたWebview, **When** 全ボタン（餌やり、水替え、藻掃除、ライト、ストア）を操作する, **Then** リファクタリング前と同じ動作をする
4. **Given** React化されたWebview, **When** タンクサイズをアップグレードする, **Then** 壁背景の中で水槽サイズが段階的に変化する
5. **Given** React化されたWebview, **When** ライトをオフにする, **Then** 暗転エフェクト・魚の減速・劣化停止が同一に動作する

---

### User Story 4 - コンパニオンビューのReact化 (Priority: P3)

開発者として、サイドバーのコンパニオンビュー（companion/main.js）もReactコンポーネントとして再構築し、メインタンクパネルとコンポーネントを共有する。

**Why this priority**: メインパネルのReact化（US3）完了後に、共通コンポーネントを再利用するだけで実現できるため最後。

**Independent Test**: コンパニオンビューが既存と同等に表示され、クリックでメインパネルが開くことを確認できる。

**Acceptance Scenarios**:

1. **Given** React化されたコンパニオンビュー, **When** サイドバーを表示する, **Then** 水槽のミニプレビューが表示される
2. **Given** React化されたコンパニオンビュー, **When** クリックする, **Then** メインタンクパネルが開く
3. **Given** メインパネルとコンパニオンビュー, **When** 状態が更新される, **Then** 両方が同期して更新される

---

### Edge Cases

- リファクタリング中に既存の保存データ（globalState）との後方互換性が壊れないか → 永続化されたGameStateにlightOn等の新フィールドがない古いデータでも、デフォルト値でフォールバックする
- Reactのバンドルサイズ増加がVSCode拡張の起動速度に影響しないか → esbuildのtree-shakingとコード分割で最小化する
- react-konvaのCanvasレンダリングが既存のピクセルアートスタイル（image-rendering: pixelated）と互換するか → Konvaの `pixelRatio` 設定と CSS `image-rendering` の組み合わせで対応する
- Webview内でのReactの初期化がVSCode CSP（Content Security Policy）と競合しないか → nonce付きスクリプトとしてバンドルを配信することで対応する

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 全てのID類（魚種、フィルター、ストアアイテム、タンクサイズ）に対して列挙型または定数オブジェクトを定義し、コード全体で一貫して使用しなければならない
- **FR-002**: Extension↔Webview間の全てのメッセージ型を判別共用体として単一の型定義ファイルで管理しなければならない
- **FR-003**: GameStateSnapshotの全フィールドで、`string`の代わりに適切な列挙型を使用しなければならない
- **FR-004**: アクション型（feedFish, changeWater, cleanAlgae）を列挙型として定義し、GameEngineのメソッドシグネチャで使用しなければならない
- **FR-005**: メインタンクパネルのWebviewをReactコンポーネントとして再構築し、react-konvaでCanvas描画を行わなければならない
- **FR-006**: コンパニオンビューのWebviewもReactコンポーネントとして再構築し、メインパネルと描画コンポーネントを共有しなければならない
- **FR-007**: リファクタリング後、全ての既存機能（餌やり、水替え、藻掃除、ストア購入、ライトスイッチ、タンクサイズ変更、魚アニメーション、ステータスバー）が変更前と同一に動作しなければならない
- **FR-008**: 既存の永続化データ（globalState）との後方互換性を維持しなければならない
- **FR-009**: WebviewのCanvas描画は60fpsを維持しなければならない
- **FR-010**: VSCode拡張のCSP（Content Security Policy）に準拠したReactバンドル配信を行わなければならない

### Key Entities

- **メッセージ型定義**: Extension→WebviewおよびWebview→Extensionの全メッセージを包括する判別共用体型。メッセージの追加・変更時に型チェックで網羅性を保証する。
- **ID列挙型群**: FishSpeciesId, FilterId, StoreItemId, ActionType, TankSizeTier, HealthState — コード全体で文字列の代わりに使用される型安全なID体系。
- **共有コンポーネント**: メインパネルとコンパニオンビューで再利用可能なReactコンポーネント群（水槽描画、魚、壁背景、机、ライト）。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: コードベース内のハードコード文字列（メッセージ型・ID類）が0件になる（全て型安全な定数経由）
- **SC-002**: 不正な値の代入が100%コンパイルエラーとして検出される（型安全性の完全確保）
- **SC-003**: リファクタリング後の全機能が、リファクタリング前と完全に同一の動作をする（機能退行ゼロ）
- **SC-004**: Canvas描画が60fpsを維持する（React + react-konva移行後もパフォーマンス劣化なし）
- **SC-005**: 新しい魚種やメッセージ型の追加が、型定義1箇所の変更で全体に波及する（拡張ポイントの一元管理）
- **SC-006**: メインパネルとコンパニオンビューで描画コンポーネントの80%以上を共有する

## Assumptions

- React 18+とreact-konvaはVSCode Webview環境で問題なく動作する（既にesbuildでバンドルしているため、追加ライブラリも同様にバンドル可能）
- react-konvaの`pixelRatio`設定とCSS `image-rendering: pixelated`の組み合わせで既存のピクセルアートスタイルを再現できる
- esbuildのtree-shakingにより、React + react-konvaのバンドルサイズ増加は許容範囲内に抑えられる
- 既存のpostMessageベースの通信パターンはReact化後も維持し、状態管理はReact hooksで行う
- Webviewの`retainContextWhenHidden: true`設定により、React状態はパネル非表示時も保持される
