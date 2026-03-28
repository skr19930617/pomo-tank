# Research: 全体のリファクタリング

**Date**: 2026-03-28

## Findings

### React Context for Sprite URI Map

- **Decision**: React Context Provider + custom hook パターンを採用
- **Rationale**: 既存の React 19 環境で追加依存なし。webview 内のデータ受け渡しに自然なパターン。
- **Alternatives considered**: 初期化メッセージのみ（Context なし）→ prop drilling が発生するため却下

### unknown vs any for migration

- **Decision**: `unknown` + 型ガード（type narrowing）で置換
- **Rationale**: TypeScript strict mode のベストプラクティス。ランタイム安全性も向上。
- **Alternatives considered**: Zod 等のバリデーションライブラリ → 依存追加のオーバーヘッドに見合わない

### Water freeze simplification

- **Decision**: `Set<string>` ベースのカウンター方式
- **Rationale**: 現在の 2 オーナー（tank-panel, moss-cleaning）に加え、将来の拡張にも対応可能。コード量削減。
- **Alternatives considered**: 状態マシン → 2 状態程度では over-engineering

## No NEEDS CLARIFICATION items

All technical decisions are resolved. No blockers for Phase 1.
