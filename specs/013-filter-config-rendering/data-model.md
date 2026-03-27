# Data Model: Filter Config & Pixel-Art Rendering

**Feature**: 013-filter-config-rendering
**Date**: 2026-03-26

## New Entities

### FilterMountType (enum)

| Value | Description |
|-------|-------------|
| `'internal'` | Filter sits inside the tank water (submerged) |
| `'hang_on_back'` | Filter hangs on the tank rim (partially above, partially below) |
| `'canister'` | Filter sits on the desk beside the tank (external cylinder) |

### FilterVisual (embedded object)

| Field | Type | Description |
|-------|------|-------------|
| relativeSize | number | Scale multiplier (0.5-1.5) for visual progression |
| primaryColor | string | Main body color hex |
| accentColor | string | Highlight/detail color hex |
| width | number | Base width in logical pixels (before contentScale) |
| height | number | Base height in logical pixels (before contentScale) |

### FilterConfig (main entity)

| Field | Type | Description |
|-------|------|-------------|
| id | FilterId | Unique identifier (e.g., 'basic_sponge') |
| displayName | string | Human-readable name |
| capacityBonus | number | Tank capacity increase when equipped |
| pomoCost | number | Pomo currency cost (0 for default sponge) |
| prerequisite | StoreItemPrerequisite | Purchase prerequisites (empty for most filters) |
| description | string | Store description text |
| mount | FilterMountType | How the filter attaches to the tank |
| visual | FilterVisual | Rendering properties |

### Filter Instances

| Filter | Mount | Capacity | Cost | Visual Size | Primary Color | Accent Color |
|--------|-------|----------|------|-------------|---------------|-------------|
| Basic Sponge | internal | +0 | 0 (default) | 10×12 | `#66aa66` | `#448844` |
| Hang-on-Back | hang_on_back | +3 | 50 | 14×20 | `#555577` | `#7777aa` |
| Canister | canister | +6 | 150 | 16×24 | `#446644` | `#668866` |
| Premium Canister | canister | +10 | 400 | 20×28 | `#334455` | `#ccaa44` |

## Modified Entities

### STORE_ITEMS (state.ts)

- **Remove**: 3 hardcoded filter entries from `BASE_STORE_ITEMS` (hang_on_back, canister, premium_canister)
- **Add**: `...buildFilterStoreItems()` alongside `...buildFishStoreItems()`

### FILTERS / FilterData (state.ts)

- **Remove entirely**: `FilterData` interface and `FILTERS` Record
- **Replace with**: Import `getFilter()` and `FILTER_REGISTRY` from `src/game/filters/`
- **Update `calculateMaxCapacity`** in `store.ts`: use `getFilter(tank.filterId)?.capacityBonus` instead of `FILTERS[tank.filterId]`

### GameStateSnapshot.tank (unchanged)

`filterId: FilterId | null` — no change to the snapshot shape. The webview uses `filterId` to look up the filter config for rendering.

## Render Position Rules

### Internal (sponge)
- x: `tankWidth - frameThickness - filterWidth - 2` (bottom-right corner of water)
- y: `tankHeight - frameThickness - sandHeight - filterHeight` (above sand)
- Rendered inside Tank.tsx water area

### Hang-on-Back
- x: `tankWidth - 2` (straddling right tank wall)
- y: `tankHeight * 0.3` (upper portion of tank)
- Rendered in Filter.tsx, z-index between Tank and Fish

### Canister
- x: `tankWidth + 4` (on desk, right of tank)
- y: `tankHeight - filterHeight` (sitting on desk surface, aligned with tank bottom)
- Rendered in Filter.tsx, z-index between Tank and Fish
