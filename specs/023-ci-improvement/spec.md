# Feature Specification: CI改善 — テスト実行とCI設定の強化

**Feature Branch**: `023-ci-improvement`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "現状ciにtestが含まれていないなら現状の使用を読み取って最低限のテストをしたい。また変更のたびにciチェックして修正するフローをclaudeの設定として読ませたい。ci相当のスクリプトを用意してもいい"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - CI でユニットテストが自動実行される (Priority: P1)

開発者がプルリクエストを作成、または main ブランチにプッシュすると、既存のユニットテストが CI パイプラインで自動的に実行される。テストが失敗した場合、ワークフローが失敗ステータスとなる。

**Why this priority**: 現在 CI にはリント・フォーマットチェックのみで、テストが実行されていない。テストなしでマージされるとリグレッションが見逃される最も重大なギャップである。

**Independent Test**: PR を作成し、CI ワークフローでユニットテストが実行され、結果が GitHub Checks に表示されることを確認する。

**Acceptance Scenarios**:

1. **Given** 開発者が PR を作成した, **When** CI が起動する, **Then** すべてのユニットテスト (`npm run test:unit`) が実行され、結果が GitHub Checks に表示される
2. **Given** ユニットテストが1つ以上失敗した, **When** CI がテスト結果を報告する, **Then** ワークフローが失敗ステータスとなり、どのテストが失敗したかが明確にわかる
3. **Given** すべてのユニットテストが成功した, **When** CI がテスト結果を報告する, **Then** ワークフローが成功ステータスとなる

---

### User Story 2 - CI でビルドが検証される (Priority: P2)

開発者がコード変更を PR として提出すると、プロダクションビルドが CI で自動的に実行され、ビルドエラーがないことが検証される。

**Why this priority**: テストが通ってもビルドが壊れていれば出荷できない。ビルド検証はテストの次に重要な品質ゲートである。

**Independent Test**: 意図的にビルドエラーを含む PR を作成し、CI がビルド失敗を検知して報告することを確認する。

**Acceptance Scenarios**:

1. **Given** 開発者が PR を作成した, **When** CI が起動する, **Then** プロダクションビルド (`npm run build`) が実行される
2. **Given** ビルドが失敗した, **When** CI が結果を報告する, **Then** ワークフローが失敗ステータスとなり、ビルドエラーの内容が表示される

---

### User Story 3 - ローカルで CI 相当のチェックを一括実行できる (Priority: P2)

開発者がコミット前にローカルで CI と同等のチェック（リント、フォーマット、テスト、ビルド）を一括実行できるスクリプトが用意されている。

**Why this priority**: CI で失敗してから修正するよりも、ローカルで事前にチェックできる方が開発効率が高い。

**Independent Test**: ローカルでスクリプトを実行し、リント・フォーマット・テスト・ビルドがすべて順番に実行されることを確認する。

**Acceptance Scenarios**:

1. **Given** 開発者がローカル環境にいる, **When** CI 相当のスクリプトを実行する, **Then** リント、フォーマットチェック、ユニットテスト、ビルドが順番に実行される
2. **Given** いずれかのチェックが失敗した, **When** スクリプトが結果を報告する, **Then** どのステップで失敗したかが明確にわかり、スクリプトは即座に終了する

---

### User Story 4 - Claude が変更時に CI チェックを実行するフロー (Priority: P3)

Claude Code が変更を加えた際に CI 相当のチェックを実行し、問題があれば修正するフローが CLAUDE.md や設定として定義されている。

**Why this priority**: 自動化による品質維持は重要だが、まず CI インフラとローカルスクリプトが整備されている必要がある。

**Independent Test**: CLAUDE.md の Commands セクションに CI チェック手順が記載されていることを確認する。

**Acceptance Scenarios**:

1. **Given** CLAUDE.md が存在する, **When** 開発者が CI チェック手順を参照する, **Then** 変更後に実行すべきコマンドとフローが明確に記載されている
2. **Given** CLAUDE.md の Commands セクションを参照する, **When** CI チェックコマンドの記載を確認する, **Then** `npm run ci` コマンドと、失敗時は修正して再実行する旨が明記されている

---

### Edge Cases

- テストファイルが0件の場合、テストステップは成功（pass）として扱う
- CI 環境で Node.js バージョンが異なる場合、テスト結果に差異が生じないか？
- ローカルスクリプトが macOS 以外の環境でも動作するか？（現状は macOS + fish shell が主環境だが、スクリプトは POSIX 互換が望ましい）

## Clarifications

### Session 2026-03-28

- Q: 既存の lint.yml ワークフローとの統合方針は？ → A: lint.yml を ci.yml にリネームし、全ステップ（リント、フォーマット、テスト、ビルド）を含む新しいワークフローとして再構成する
- Q: Claude の CI チェック設定の形式は？ → A: CLAUDE.md の Commands セクションに CI チェックコマンドを記載するのみ（hooks による自動実行は不要）
- Q: ローカル CI スクリプトの提供形式は？ → A: package.json に npm script (`npm run ci`) として定義する（別途シェルスクリプトファイルは不要）
- Q: Branch protection 設定はスコープに含めるか？ → A: 対象外。手動設定推奨として Assumptions に記載するのみ
- Q: CI ワークフローのステップ報告粒度は？ → A: 単一 job 内の step として実行し、step ログで各ステップの成否が確認できればよい
- Q: pull_request のトリガーイベント範囲は？ → A: GitHub Actions のデフォルト（opened, synchronize, reopened）をそのまま使う
- Q: テストファイル0件の場合の扱いは？ → A: 成功（pass）として扱う
- Q: SC-004 の測定条件と User Story 4 の受け入れ条件修正 → A: SC-004 は GitHub-hosted runner (ubuntu-latest) での workflow 全体 wall-clock time に固定。User Story 4 Acceptance 2 は文書要件に書き換え

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: CI ワークフローは PR 作成時および main ブランチへのプッシュ時にユニットテストを自動実行しなければならない
- **FR-002**: CI ワークフローはプロダクションビルドを実行し、ビルドの成否を検証しなければならない
- **FR-003**: CI ワークフローは単一 job 内にリント、フォーマットチェック、テスト、ビルドの各 step を持ち、step ログで各ステップの成否が確認できなければならない
- **FR-004**: ローカルで CI 相当のチェックを一括実行できる npm script (`npm run ci`) が提供されなければならない
- **FR-005**: ローカルスクリプトはいずれかのステップが失敗した時点で即座に停止し、失敗箇所を明示しなければならない
- **FR-006**: CLAUDE.md の Commands セクションに変更後の CI チェック実行コマンド (`npm run ci`) が記載されなければならない
- **FR-007**: 既存の lint.yml を ci.yml にリネームし、リント・フォーマット・テスト・ビルドの全ステップを統合した単一ワークフローとして再構成しなければならない

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: すべての PR に対してユニットテストが CI で自動実行され、テスト結果が GitHub Checks に表示される
- **SC-002**: ビルド検証が CI で自動実行され、ビルド失敗が検知された場合にワークフローが失敗ステータスとなる
- **SC-003**: 開発者がローカルで1コマンドで CI 相当の全チェックを実行できる
- **SC-004**: CI の全ステップ（リント、フォーマット、テスト、ビルド）が GitHub-hosted runner (ubuntu-latest) での workflow 全体 wall-clock time で5分以内に完了する

## Assumptions

- Node.js 18 を CI 実行環境として使用する（既存ワークフローと同一）
- 既存の6つのユニットテストファイル（Vitest）がすべてパスする状態である
- integration テストは現時点では実装が存在しないため、CI には含めない
- macOS (darwin) が主な開発環境であり、ローカルスクリプトは POSIX 互換シェルで動作すればよい
- Branch protection / required status checks の設定はこの feature のスコープ外。CI ワークフロー整備後に手動で設定することを推奨する
- pull_request トリガーは GitHub Actions のデフォルト（opened, synchronize, reopened）を使用する
