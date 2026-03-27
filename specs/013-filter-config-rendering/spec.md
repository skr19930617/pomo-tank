# Feature Specification: Filter Config & Pixel-Art Rendering

**Feature Branch**: `013-filter-config-rendering`
**Created**: 2026-03-26
**Status**: Draft
**Input**: User description: "フィルターがstoreでハードコードされているのでフィルターのデータ型を決めて別の場所で管理したい。またフィルターが描画されていないけど、壁掛けと外掛けでドット絵調のフィルターが見えるようにしたい。外掛けもランクによって大きさや色などが変わるようにしたい"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Filter Data Configuration Extraction (Priority: P1)

As a developer, I want filter definitions extracted from the hardcoded catalog in the game state file into a dedicated filter configuration module, similar to how species configs are managed. Each filter should have a rich data type that includes visual rendering properties (mounting type, size, color) in addition to the existing gameplay properties (name, capacity bonus).

**Why this priority**: This is the foundation — without a proper data model that includes visual properties, filter rendering cannot be implemented. Extracting the config also improves code organization and makes it easy to add new filter types in the future.

**Independent Test**: Can be fully tested by verifying that the existing filter purchase flow, capacity bonus calculation, and store display all work identically after the config extraction. The new visual properties should be present in the config but not yet rendered.

**Acceptance Scenarios**:

1. **Given** the filter config module exists, **When** a developer inspects the filter data, **Then** each filter has: id, display name, capacity bonus, mounting type (internal/hang-on-back/canister), visual size, and visual color properties.
2. **Given** the old hardcoded FILTERS catalog is removed, **When** the game runs, **Then** all existing filter functionality (purchase, capacity bonus, store listing) works identically using the new config module.
3. **Given** the store lists filters, **When** the user views the filter section, **Then** filter names and costs display correctly from the new config source.

---

### User Story 2 - Pixel-Art Filter Rendering in Tank (Priority: P2)

As a user, I want to see my purchased filter visually rendered on the tank in pixel-art style so that I can appreciate my upgrade and see what filter is currently equipped. Different filter types should look distinct: internal sponge filters sit inside the tank, hang-on-back filters hang over the rear wall, and canister filters sit alongside the tank.

**Why this priority**: This is the core visual feature the user requested. Currently filters are invisible — adding visual rendering makes the purchase feel rewarding and adds visual variety to the tank scene.

**Independent Test**: Can be fully tested by purchasing different filters in the store and verifying each one renders at the correct position on/near the tank with the appropriate pixel-art appearance.

**Acceptance Scenarios**:

1. **Given** the player has a basic sponge filter (default), **When** they view the tank, **Then** a small pixel-art sponge is visible inside the tank (e.g., in a corner of the water area).
2. **Given** the player purchases a hang-on-back filter, **When** they view the tank, **Then** a pixel-art filter box is visible hanging over the back wall of the tank, partially above and partially below the tank rim.
3. **Given** the player purchases a canister filter, **When** they view the tank, **Then** a pixel-art canister cylinder is visible next to the tank (e.g., on the desk beside it or below it).
4. **Given** the player purchases a premium canister filter, **When** they view the tank, **Then** the canister appears visually larger and/or with a different accent color compared to the regular canister, indicating its premium status.

---

### User Story 3 - Filter Visual Scaling by Rank (Priority: P3)

As a user, I want higher-tier filters to look visually more impressive (larger, different colors) so that the progression from basic to premium feels visually rewarding and each upgrade is distinguishable at a glance.

**Why this priority**: This is visual polish that makes the upgrade path feel meaningful. It depends on US2 being complete first.

**Independent Test**: Can be fully tested by switching between different filter tiers and verifying the visual size and color change for each tier.

**Acceptance Scenarios**:

1. **Given** the basic sponge is equipped, **When** the user looks at the filter visual, **Then** it appears as a small, simple shape in a muted color.
2. **Given** the hang-on-back filter is equipped, **When** compared to the sponge, **Then** the filter visual is noticeably larger and uses a different, more vibrant color scheme.
3. **Given** the canister filter is equipped, **When** compared to the hang-on-back, **Then** the canister is larger and more detailed with a distinct color.
4. **Given** the premium canister is equipped, **When** compared to the regular canister, **Then** it is the largest filter visual with a premium accent color (e.g., gold or silver highlights), clearly standing out as the top-tier option.

---

### Edge Cases

- What happens when no filter is equipped (filterId is null)? No filter visual should render — the tank appears without any filter attachment.
- What happens when the tank is resized (upgraded)? The filter visual should scale proportionally with the tank, maintaining its relative position (e.g., hang-on-back stays on the rim, canister stays on the desk).
- What happens when the light is off? The filter visual should dim along with the rest of the tank scene, consistent with existing light-off behavior.
- What happens with the basic sponge at the initial Nano tank? The sponge should be visible but small, proportional to the tiny tank.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Filter definitions MUST be extracted from the hardcoded catalog into a dedicated configuration module, separate from the game state file.
- **FR-002**: Each filter configuration MUST include: id, display name, capacity bonus, mounting type (internal, hang-on-back, canister), and visual properties (relative size, primary color, accent color).
- **FR-003**: The store item data for filters MUST be generated from the filter configuration (similar to how fish store items are generated from species configs), eliminating duplicate hardcoded definitions.
- **FR-004**: The tank visual MUST render the currently equipped filter as a pixel-art graphic in the appropriate position based on mounting type:
  - Internal (sponge): Inside the tank water area, in a corner
  - Hang-on-back: Straddling the back wall of the tank, partially above the rim
  - Canister: On the desk surface next to the tank
- **FR-005**: Each filter's visual appearance (size, shape, color) MUST be driven by data from the filter configuration, not hardcoded in the rendering component.
- **FR-006**: Higher-tier filters MUST appear visually larger and/or with more prominent colors than lower-tier filters, creating a clear visual progression.
- **FR-007**: Filter visuals MUST scale proportionally when the tank size changes (Nano through XL).
- **FR-008**: Filter visuals MUST respect the light-on/off state, dimming when the light is off.
- **FR-009**: All existing filter functionality (purchase, capacity bonus calculation, store listing, equip behavior) MUST continue to work identically after the refactoring.

### Key Entities

- **FilterConfig**: The rich filter definition containing gameplay properties (id, name, capacity bonus, pomo cost, prerequisite) and visual properties (mounting type, relative size, primary color, accent color). One config per filter type.
- **FilterMountType**: Classification of how a filter attaches to the tank — internal (inside water), hang-on-back (on the rim), or canister (beside the tank on the desk).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero filter-related data is hardcoded in the game state file — all filter definitions come from the dedicated config module.
- **SC-002**: Every filter type (basic sponge, hang-on-back, canister, premium canister) renders a distinct, visible pixel-art graphic when equipped.
- **SC-003**: Users can visually distinguish all 4 filter tiers by size and color without reading text labels.
- **SC-004**: Filter visuals render at the correct position for each mounting type (internal, rim, desk) across all 5 tank sizes (Nano through XL).
- **SC-005**: The existing store purchase flow, capacity bonus, and filter equip behavior all function identically after refactoring (zero regressions).

## Assumptions

- Filter visuals are rendered using Konva primitives (Rect, Group, Line) in the pixel-art style, consistent with the existing tank, desk, and light rendering approach. No sprite sheets are needed for filters.
- The "basic sponge" is an internal filter (inside the tank). The other 3 filters are external (hang-on-back for the HOB, canister for both canister tiers).
- Visual size is relative to tank size — e.g., a filter at "size 1.0" renders at a base pixel size that scales with the tank's contentScale.
- The canister filter renders on the desk surface to the right of the tank, within the existing scene bounds.
- The filter configuration module follows the same pattern as the species configuration (dedicated directory/file with typed exports).
- Store items for filters will be auto-generated from the filter config, similar to `buildFishStoreItems()`.
