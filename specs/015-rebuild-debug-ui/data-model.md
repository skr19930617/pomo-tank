# Data Model: Rebuild Debug UI

## Entities

### GameEngine (modified)

New property added to the engine instance (not persisted):

| Property        | Type   | Default | Description                          |
|-----------------|--------|---------|--------------------------------------|
| tickMultiplier  | number | 1       | Tick speed multiplier (1–100). Transient, not saved to globalState. |

### GameStateSnapshot (modified)

New field added to snapshot sent to webview:

| Property        | Type   | Default | Description                          |
|-----------------|--------|---------|--------------------------------------|
| tickMultiplier  | number | 1       | Current engine tick multiplier, for debug UI display. |

### WebviewToExtensionMessage (modified)

New message variant added to the discriminated union:

| Type                      | Payload              | Description                     |
|---------------------------|----------------------|---------------------------------|
| debugSetTickMultiplier    | `{ multiplier: number }` | Set engine tick speed multiplier |

### Removed Entities

The following are deleted entirely:

| Entity                    | Location                | Reason                          |
|---------------------------|-------------------------|---------------------------------|
| `pomotank.debugTick` command | package.json, extension.ts | Replaced by tick multiplier UI |
| `pomotank.debugReset` command | package.json, extension.ts | Moved to debug UI (already exists there) |
| `pomotank.debugAddPomo` command | package.json, extension.ts | Replaced by free-form pomo input (already exists in debug UI) |

## State Transitions

### Tick Multiplier Lifecycle

```
[Engine start] → multiplier = 1
  ↓
[debugSetTickMultiplier(n)] → clear interval → set multiplier = clamp(n, 1, 100) → restart interval at 60_000/n ms
  ↓
[Debug mode disabled] → multiplier = 1 → restart interval at 60_000ms
  ↓
[Engine stop] → clear interval → multiplier irrelevant
```

## Validation Rules

- `tickMultiplier`: Must be integer, 1 ≤ value ≤ 100. Non-integers rounded. Values outside range clamped.
- `pomoBalance` (debug set): Must be integer, ≥ 0. Negative values clamped to 0.
