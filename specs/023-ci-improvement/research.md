# Research: CI改善

## GitHub Actions Workflow Design

- **Decision**: Single job with sequential steps (not parallel jobs)
- **Rationale**: Small project with fast steps; parallelizing adds complexity (artifact passing, dependency installation per job) with minimal time savings. Step logs provide sufficient per-step visibility.
- **Alternatives considered**: Multi-job workflow (rejected: overhead > benefit for this project size)

## npm Script for Local CI

- **Decision**: Use `&&` chaining in a single npm script (`npm run ci`)
- **Rationale**: Native to npm, no additional tooling, fail-fast by default, cross-platform (works on any shell that npm supports)
- **Alternatives considered**: Shell script (rejected: user chose npm script), npm-run-all (rejected: unnecessary dependency)

## Workflow Trigger Configuration

- **Decision**: Use GitHub Actions default pull_request events (opened, synchronize, reopened)
- **Rationale**: Covers all common PR update scenarios without explicit event listing. Standard practice for most projects.
- **Alternatives considered**: Adding ready_for_review (rejected: draft PR filtering adds complexity without clear benefit)

## Test Zero-File Behavior

- **Decision**: Vitest returns exit code 0 when no test files found (default behavior). Treat as success.
- **Rationale**: User confirmed 0 tests = success. No Vitest configuration change needed.
- **Alternatives considered**: `--passWithNoTests` flag (not needed for Vitest, which passes by default)
