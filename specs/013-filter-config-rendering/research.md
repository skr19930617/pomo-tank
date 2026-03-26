# Research: Filter Config & Pixel-Art Rendering

**Feature**: 013-filter-config-rendering
**Date**: 2026-03-26

## R1: Filter Config Module Structure

**Decision**: Create a `src/game/filters/` directory with one file per filter type plus an index, following the exact pattern of `src/game/species/`.

**Rationale**:
- Species configs use: `src/game/species/{species-name}.ts` + `src/game/species/index.ts` with registry, getters, and `buildFishStoreItems()`.
- Filters should follow the same pattern: `src/game/filters/{filter-name}.ts` + `src/game/filters/index.ts` with `FILTER_REGISTRY`, `getFilter()`, and `buildFilterStoreItems()`.
- This eliminates the `FILTERS` catalog and filter entries from `BASE_STORE_ITEMS` in `state.ts`.

**Alternatives considered**:
- Single file with all filters (rejected: doesn't scale, inconsistent with species pattern)
- Keep in state.ts but enrich (rejected: user explicitly wants separate management)

## R2: FilterConfig Data Type

**Decision**: Define a `FilterConfig` interface that includes both gameplay and visual properties.

```typescript
interface FilterConfig {
  id: FilterId;
  displayName: string;
  capacityBonus: number;
  pomoCost: number;              // Moved from BASE_STORE_ITEMS
  prerequisite: StoreItemPrerequisite;
  description: string;           // Moved from BASE_STORE_ITEMS
  mount: FilterMountType;        // 'internal' | 'hang_on_back' | 'canister'
  visual: {
    relativeSize: number;        // 0.5 (small) to 1.5 (large), scales with tank
    primaryColor: string;        // Main body color hex
    accentColor: string;         // Highlight/detail color hex
    width: number;               // Base width in logical pixels (before contentScale)
    height: number;              // Base height in logical pixels
  };
}
```

**Rationale**: Consolidates the data that was split across `FilterData` (state.ts) and `BASE_STORE_ITEMS` (state.ts) into a single source of truth. The `visual` sub-object groups rendering-specific properties.

## R3: Filter Mounting & Position Strategy

**Decision**: Three mount types with distinct rendering positions.

| Mount Type | Position | Coordinate Reference | Example |
|------------|----------|---------------------|---------|
| `internal` | Inside tank water, bottom-right corner | Relative to tank inner bounds (tankLeft+frame, tankTop+frame) | Basic sponge: small green rect in water |
| `hang_on_back` | Straddling tank right wall, 50% above / 50% below rim | Relative to tank right edge (tankLeft+tankWidth) | HOB: box hanging over right rim |
| `canister` | On desk to right of tank | Relative to tank Group, outside tank bounds, at desk level | Canister: cylinder on desk right of tank |

**Rationale**:
- Internal filters naturally sit inside the water (sponges are submerged).
- HOB filters hang on the rim, which in a 2D side view means the right edge of the tank frame.
- Canisters sit externally, so they're placed on the desk surface next to the tank.

**Coordinate system notes**:
- The tank Group in TankScene.tsx is at (tankX, tankY) with contentScale applied.
- Internal and HOB filters render inside this Group, using tank-local coordinates (0,0 = tank top-left).
- Canister filters also render inside the Group but at x > tankWidth (extending to the right of the tank on the desk).

## R4: Filter Visual Design (Pixel Art)

**Decision**: Use Konva Rect/Group primitives to draw simple pixel-art filter shapes.

| Filter | Mount | Shape | Colors | Base Size (w×h) |
|--------|-------|-------|--------|-----------------|
| Basic Sponge | internal | Small rectangle with dots | Primary: `#66aa66` (green), Accent: `#448844` | 10×12 |
| Hang-on-Back | hang_on_back | Box with intake tube | Primary: `#555577` (gray-blue), Accent: `#7777aa` | 14×20 |
| Canister | canister | Cylinder with tubes | Primary: `#446644` (dark green), Accent: `#668866` | 16×24 |
| Premium Canister | canister | Larger cylinder with gold highlights | Primary: `#334455` (dark blue), Accent: `#ccaa44` (gold) | 20×28 |

**Rationale**: Simple Konva Rects match the existing pixel-art aesthetic (Tank, Desk, Light all use Rect primitives). No sprite sheets needed for simple geometric shapes. Colors are muted to fit the dark aquarium theme, with premium getting a gold accent for visual distinction.

## R5: Store Item Generation for Filters

**Decision**: Create `buildFilterStoreItems()` in `src/game/filters/index.ts` that generates `StoreItemData` entries from `FilterConfig` objects, exactly like `buildFishStoreItems()` does for species.

**Rationale**:
- Eliminates the 3 hardcoded filter entries in `BASE_STORE_ITEMS`.
- The basic_sponge is NOT sold in the store (it's the default) — `buildFilterStoreItems()` should skip it.
- `STORE_ITEMS` in state.ts becomes: `{ ...BASE_STORE_ITEMS_WITHOUT_FILTERS, ...buildFishStoreItems(), ...buildFilterStoreItems() }`.

## R6: Rendering Architecture — Split Between Tank.tsx and Filter.tsx

**Decision**: Internal filters (sponge) render inside `Tank.tsx` since they're submerged. External filters (HOB, canister) render in a new `Filter.tsx` component placed as a sibling to Tank in the TankScene Group.

**Rationale**:
- Internal filters are visually part of the water scene (behind fish, affected by water color). They belong inside Tank's render tree.
- External filters sit outside the tank bounds (on the rim or desk). They should render after Tank but before Fish in the z-order so they don't obscure fish but appear attached to the tank.
- A separate `Filter.tsx` component keeps the Tank component focused on its current responsibility.

**Render order in TankScene Group**:
1. Light
2. Tank (includes internal filter if sponge)
3. Filter (external: HOB or canister)
4. Fish sprites
5. FishTooltip
