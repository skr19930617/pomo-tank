# Feature Specification: Tank & Fish Management Settings

**Feature Branch**: `014-tank-fish-management`
**Created**: 2026-03-26
**Status**: Draft
**Input**: User description: "設定項目を拡張したい。タイマーなどのコア機能とは別に水槽、フィルター、水槽内の魚の管理をできるようにしたい。水槽は解放済みならどのサイズも選べるようにしてフィルターも同様。もしコストが下がって現在のコストを超えるならコストを下げるようにメッセージを出して小さいスペックのものを選べないようにしていい。また魚の管理では魚の名前を変更できたり、水槽から除去できるようにしたい"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tank Size Switching (Priority: P1)

As a user, I want to freely switch between any previously unlocked tank sizes from the settings panel so that I can downgrade or upgrade my tank without re-purchasing. If switching to a smaller tank would cause the current fish count to exceed the new capacity, the system should warn me and prevent the switch.

**Why this priority**: Tank size directly impacts capacity and the entire visual scene. Allowing flexible switching between unlocked sizes gives users control over their setup and is the most impactful management feature.

**Independent Test**: Can be fully tested by unlocking multiple tank sizes, switching between them in settings, and verifying the tank visual and capacity update correctly. Attempting to switch to a size that would exceed capacity should show a warning and be blocked.

**Acceptance Scenarios**:

1. **Given** the user has unlocked Small, Medium, and Large tanks, **When** they open the tank management section in settings, **Then** they see a list of all unlocked tank sizes with the currently active one highlighted.
2. **Given** the user selects a different unlocked tank size, **When** the new size has sufficient capacity for current fish, **Then** the tank size changes immediately and the visual updates.
3. **Given** the user selects a smaller tank size, **When** the new tank's max capacity (including filter bonus) would be less than the current fish cost, **Then** a warning message is displayed explaining the capacity issue and the switch is prevented.
4. **Given** the user has only the default Nano tank unlocked, **When** they view the tank size options, **Then** only Nano is listed and no switching is possible.

---

### User Story 2 - Filter Switching (Priority: P2)

As a user, I want to freely switch between any previously unlocked filters from the settings panel so that I can change my filter without re-purchasing. If switching to a lower-capacity filter would cause the current fish count to exceed the new capacity, the system should warn me and prevent the switch.

**Why this priority**: Filter switching follows the same pattern as tank switching and is closely related. Implementing both together ensures a consistent management experience.

**Independent Test**: Can be fully tested by unlocking multiple filters, switching between them in settings, and verifying the filter visual and capacity bonus update correctly.

**Acceptance Scenarios**:

1. **Given** the user has unlocked basic sponge, hang-on-back, and canister filters, **When** they open the filter management section in settings, **Then** they see all unlocked filters with the currently equipped one highlighted.
2. **Given** the user selects a different unlocked filter, **When** the new filter's capacity bonus keeps total capacity above current fish cost, **Then** the filter changes immediately and the visual updates.
3. **Given** the user selects a filter with a lower capacity bonus, **When** the resulting max capacity (tank base + new filter bonus) would be less than current fish cost, **Then** a warning message is displayed and the switch is prevented.
4. **Given** the user has only the basic sponge, **When** they view the filter options, **Then** only basic sponge is listed.

---

### User Story 3 - Fish Management: Rename & Remove (Priority: P3)

As a user, I want to manage individual fish in my tank: give them custom names and remove them from the tank. This lets me personalize my aquarium and free up capacity when needed.

**Why this priority**: Fish management is a personalization feature that enhances the emotional connection to the aquarium. It also provides a practical way to free capacity, which complements the tank/filter switching from US1/US2.

**Independent Test**: Can be fully tested by opening the fish management list, renaming a fish, confirming the name persists, removing a fish, and confirming it disappears from the tank and capacity is freed.

**Acceptance Scenarios**:

1. **Given** the settings panel is open, **When** the user views the fish management section, **Then** they see a list of all living fish in the tank with their species name (or custom name if set), species type, and health state.
2. **Given** a fish is listed, **When** the user edits the name field, **Then** the custom name is saved and displayed instead of the default species name everywhere (tooltips, fish list).
3. **Given** a fish has a custom name, **When** the user clears the name field, **Then** it reverts to the default species display name.
4. **Given** a fish is listed, **When** the user clicks a remove button, **Then** a confirmation prompt appears asking if they really want to remove the fish.
5. **Given** the user confirms removal, **When** the fish is removed, **Then** it disappears from the tank, capacity is freed, and the fish list updates immediately.
6. **Given** the user cancels removal, **When** they return to the fish list, **Then** the fish remains in the tank unchanged.

---

### Edge Cases

- What happens when the user has only 1 living fish and tries to remove it? Allow removal — the tank can be empty (a new starter fish is spawned when all fish die via the existing dead fish handler).
- What happens when dead fish are in the tank? Dead fish should appear in the fish management list but marked as dead, and can be removed to clean up the tank.
- What happens if a custom fish name is very long? The name should be limited to a reasonable length (e.g., 20 characters).
- What happens if the user switches to a smaller tank and then removes fish to get under capacity? The tank switch must be validated at the time of switching, not retroactively.
- What happens with the settings panel layout? The tank management section should be separate from the timer settings, organized as distinct collapsible sections or tabs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The settings area MUST include a tank management section (separate from timer settings) where the user can switch between unlocked tank sizes.
- **FR-002**: The tank size selector MUST only show tank sizes present in the user's unlocked items list (plus the default Nano which is always available).
- **FR-003**: When the user selects a tank size that would cause current fish cost to exceed the new max capacity, the system MUST display a warning message and prevent the switch.
- **FR-004**: The settings area MUST include a filter management section where the user can switch between unlocked filters.
- **FR-005**: The filter selector MUST only show filters present in the user's unlocked items list (plus the default basic sponge which is always available).
- **FR-006**: When the user selects a filter that would cause current fish cost to exceed the new max capacity (tank base + filter bonus), the system MUST display a warning message and prevent the switch.
- **FR-007**: The settings area MUST include a fish management section listing all fish currently in the tank (living and dead).
- **FR-008**: Each fish entry MUST show: custom name (if set) or default species name, species type, and health state.
- **FR-009**: Users MUST be able to edit a fish's custom name (max 20 characters). Clearing the name reverts to the default species name.
- **FR-010**: Users MUST be able to remove a fish from the tank with a confirmation step before removal.
- **FR-011**: When a fish is removed, the tank capacity cost MUST decrease immediately.
- **FR-012**: Fish custom names MUST be persisted across sessions (surviving panel close/reopen and extension restart).
- **FR-013**: The tank/filter/fish management sections MUST be visually separated from the existing timer settings (distinct collapsible sections).

### Key Entities

- **Fish (extended)**: Gains an optional `customName` field for user-given names. All other fields remain unchanged.
- **Tank/Filter switch request**: A transient action that validates capacity constraints before applying the change. Not persisted as a separate entity — the result is a state mutation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch between any unlocked tank size in under 3 seconds (select → confirm → visual update).
- **SC-002**: Users can switch between any unlocked filter in under 3 seconds.
- **SC-003**: Capacity validation prevents all invalid tank/filter switches — zero cases where fish cost exceeds capacity after a switch.
- **SC-004**: Users can rename any fish and see the custom name reflected immediately in the fish list and tank tooltips.
- **SC-005**: Users can remove any fish with a single confirmation step, and capacity updates instantly.
- **SC-006**: All management changes (tank size, filter, fish names, fish removal) persist across panel close/reopen and extension restart.

## Assumptions

- The settings panel uses the same collapsible section pattern (MUI Accordion) for the new management sections.
- New message types will be added for tank switching (`switchTank`), filter switching (`switchFilter`), fish renaming (`renameFish`), and fish removal (`removeFish`).
- The `Fish` interface gains an optional `customName?: string` field. Existing persisted fish data without this field will be treated as having no custom name (backward compatible).
- The capacity validation logic reuses the existing `calculateCurrentCost()` and `calculateMaxCapacity()` functions from the store module.
- The "unlocked items" list (`player.unlockedItems`) is the source of truth for which tank sizes and filters are available to switch to.
- Dead fish can be removed from the fish management list (acts as a "clean up" operation).
- The default Nano tank and basic sponge filter are always available regardless of the unlocked items list.
