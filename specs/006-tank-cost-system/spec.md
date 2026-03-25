# Feature Specification: Tank Cost System Simplification

**Feature Branch**: `006-tank-cost-system`
**Created**: 2026-03-25
**Status**: Draft
**Input**: User description: "Simplify tank economy by decoupling timer from tank upgrades, introduce cost-based capacity system, and display costs on HUD"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Tank Cost Status on HUD (Priority: P1)

As a user, I want to see my tank's current total cost and maximum accepted cost on the HUD at a glance, so I can understand how much room I have for adding more fish.

**Why this priority**: Cost visibility is the foundation of all purchasing decisions. Without it, users cannot meaningfully engage with the cost-based capacity system.

**Independent Test**: Can be fully tested by opening the tank panel and verifying cost numbers appear on the HUD. Delivers immediate value by giving users awareness of their tank's status.

**Acceptance Scenarios**:

1. **Given** a tank with fish, **When** the HUD renders, **Then** the current total cost and maximum accepted cost are displayed (e.g., "3/10")
2. **Given** a tank at full capacity, **When** the user views the HUD, **Then** the cost display clearly indicates the tank is full (e.g., "10/10" shown in a warning color)
3. **Given** a tank that is over capacity after migration, **When** the HUD renders, **Then** the over-capacity state is visually indicated (e.g., "12/10" in red)

---

### User Story 2 - Fish Species Have Clear Individual Costs (Priority: P1)

As a user, I want each fish species to have a clearly defined cost value, so I can plan which fish to add to my tank based on their cost relative to my remaining capacity.

**Why this priority**: Equally critical — the cost values define the core mechanic. Users need to see per-species cost in the store to make informed purchase decisions.

**Independent Test**: Can be tested by opening the store and verifying each fish species displays its cost value alongside its pomo price.

**Acceptance Scenarios**:

1. **Given** the store is open, **When** the user views a fish species, **Then** the species' capacity cost is displayed alongside its pomo purchase price
2. **Given** the user is considering a purchase, **When** they compare fish species, **Then** each species shows a distinct cost value reflecting its maintenance burden (e.g., Guppy: 1, Angelfish: 5)

---

### User Story 3 - Configurable Timer Duration (Priority: P2)

As a user, I want to configure my pomodoro timer duration, so I can adjust the work session length to fit my personal workflow.

**Why this priority**: Timer customization is a common user expectation for pomodoro tools. This ensures the timer is fully decoupled from tank state.

**Independent Test**: Can be tested by changing the timer setting and verifying the new duration is reflected in the countdown display.

**Acceptance Scenarios**:

1. **Given** the default configuration, **When** the timer starts, **Then** it counts down from 25 minutes
2. **Given** the user sets a custom duration (e.g., 50 minutes), **When** the timer starts, **Then** it counts down from the configured duration
3. **Given** any tank configuration (fish count, filter type, tank size), **When** the timer starts, **Then** the duration is always the user-configured value, unaffected by tank state

---

### User Story 4 - Tank Upgrades Increase Cost Capacity Only (Priority: P2)

As a user, I want tank and filter upgrades to increase my tank's maximum accepted cost, so I can house more or higher-cost fish without those upgrades affecting my timer duration.

**Why this priority**: This establishes the simplified economy model. Upgrades feel rewarding (more capacity) without adding complexity to the timer system.

**Independent Test**: Can be tested by purchasing a tank or filter upgrade and verifying the maximum accepted cost increases on the HUD while the timer duration remains unchanged.

**Acceptance Scenarios**:

1. **Given** a Nano tank with Basic Sponge filter, **When** the user views the HUD, **Then** the maximum accepted cost reflects the base capacity
2. **Given** the user upgrades from Small to Medium tank, **When** the HUD updates, **Then** the maximum accepted cost increases
3. **Given** the user upgrades the filter, **When** the HUD updates, **Then** the maximum accepted cost increases
4. **Given** any combination of tank/filter upgrades, **When** the timer starts, **Then** the timer duration is unchanged from the user-configured value

---

### Edge Cases

- What happens when a user already has fish exceeding the new cost system's capacity after migration? The system allows existing fish to remain but prevents adding new fish until cost is within limits.
- What happens if the user sets a timer duration of 0 or a negative number? The system enforces a minimum duration (1 minute) and a maximum (120 minutes).
- What happens when cost display exceeds the HUD's available space? The display truncates or abbreviates large numbers gracefully.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each fish species MUST have a defined capacity cost value that is visible in the store
- **FR-002**: The HUD MUST display the current total cost (sum of all owned fish costs) and the tank's maximum accepted cost
- **FR-003**: Tank size upgrades MUST increase the maximum accepted cost
- **FR-004**: Filter upgrades MUST increase the maximum accepted cost (flat bonus, no effect on deterioration)
- **FR-005**: The timer duration MUST be determined solely by user configuration, never by tank state (fish count, filter type, tank size, or any other in-game variable)
- **FR-006**: The system MUST prevent purchasing fish when the addition would exceed the tank's maximum accepted cost
- **FR-007**: The store MUST display the capacity cost for each fish species alongside its pomo price
- **FR-008**: The timer duration MUST be configurable by the user with a minimum of 1 minute and a maximum of 120 minutes
- **FR-009**: The system MUST handle legacy state where existing fish exceed the new capacity limits by allowing existing fish to remain while preventing new additions
- **FR-010**: Hunger MUST accumulate at a rate requiring feeding approximately every 1 pomodoro session
- **FR-011**: Water dirtiness MUST accumulate at a rate requiring a water change approximately every 3 pomodoro sessions
- **FR-012**: Algae MUST accumulate at a rate requiring cleaning approximately every 5 pomodoro sessions
- **FR-013**: More tedious maintenance tasks (algae > water > feeding) MUST have proportionally slower accumulation rates
- **FR-014**: Deterioration rates (hunger, water dirtiness, algae) MUST be tank-wide and fixed, unaffected by the number or species of fish in the tank
- **FR-015**: Fish capacity cost MUST only determine whether a fish can be added to the tank, not affect any deterioration or maintenance mechanics

### Key Entities

- **Fish Species**: A type of fish with attributes including pomo purchase price, capacity cost, and visual appearance. Per-species hungerRate and dirtinessLoad are removed; deterioration is tank-wide
- **Tank**: The aquarium container with a maximum accepted cost determined by its size tier and installed filter
- **Cost Capacity**: A numerical value representing the tank's total allowable fish cost, calculated as: tank base capacity + filter flat bonus (additive model)
- **Timer Configuration**: User-set duration for pomodoro work sessions, independent of all tank state

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can see their current cost usage and maximum capacity on the HUD within 1 second of the tank panel loading
- **SC-002**: 100% of fish species display their capacity cost in the store
- **SC-003**: Users can configure their timer duration and see the change reflected immediately
- **SC-004**: Timer duration remains constant regardless of any tank upgrades or fish purchases
- **SC-005**: Users can determine whether they can afford (in both pomo and capacity) a fish purchase before committing

## Clarifications

### Session 2026-03-25

- Q: Should the deterioration system (hunger/water/algae) be kept, simplified, or removed? → A: Keep deterioration but retune rates to pomo-based intervals: hunger needs attention every ~1 pomo, water change every ~3 pomo, algae cleaning every ~5 pomo. More tedious maintenance tasks accumulate slower.
- Q: How do tank size and filter combine for max cost capacity? → A: Additive model — tank provides a base cost capacity, filter adds a flat bonus (e.g., Small: 8 + HOB filter: +4 = 12).
- Q: Should fish cost affect deterioration rates? → A: No (Independent). Cost is for capacity checks only. Deterioration rates are tank-wide and fixed at pomo-based intervals regardless of fish count or species composition. This protects pomodoro focus time.
- Q: What happens to existing per-fish hungerRate and dirtinessLoad? → A: Remove entirely. These attributes are no longer needed in the tank-wide fixed deterioration model.
- Q: Should filter upgrades affect deterioration or only capacity? → A: Capacity only. Filters add a flat cost capacity bonus with no effect on deterioration rates. Keeps the model simple and deterioration predictable.

## Assumptions

- The existing pomo currency system (earning pomo through completed sessions) remains unchanged
- The deterioration system (hunger, water dirtiness, algae) is retained but retuned to pomo-based intervals: feeding ~1 pomo, water change ~3 pomo, algae cleaning ~5 pomo. Rates are tank-wide and fixed; per-species hungerRate and dirtinessLoad are removed. These mechanics do not influence timer duration or cost capacity
- The capacity cost per species is a new standalone attribute independent of deterioration properties. Cost determines only whether a fish can be added; deterioration rates are tank-wide and fixed regardless of fish composition
- The maximum accepted cost is calculated additively: tank size base capacity + filter flat bonus, replacing the current simple fish-count limit
