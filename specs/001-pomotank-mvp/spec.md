# Feature Specification: Pomotank MVP

**Feature Branch**: `001-pomotank-mvp`
**Created**: 2026-03-23
**Status**: Draft
**Input**: User description: "Pomotank MVP - pixel-art VSCode aquarium companion for healthy coding breaks"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First-Time Setup & Passive Aquarium Companion (Priority: P1)

A new user installs the Pomotank extension and immediately receives a small Nano tank with one beginner-friendly fish. The aquarium appears as a webview-based view registered inside the Explorer view container in VSCode. While the user codes, the aquarium lives quietly alongside their work — fish swim, and the tank state slowly changes over real time. No immediate action is required; the aquarium simply exists as a calming presence.

**Why this priority**: This is the foundational experience. Without a visible, living aquarium companion, no other feature has meaning. This establishes the core emotional hook and the passive deterioration loop that drives all subsequent interactions.

**Independent Test**: Can be fully tested by installing the extension, observing the aquarium appear with a starter fish, and confirming that tank state (hunger, dirtiness, algae) changes over real time without any user interaction.

**Acceptance Scenarios**:

1. **Given** a user installs Pomotank for the first time, **When** the extension activates, **Then** a small pixel-art aquarium companion appears in the editor with a Nano tank and one starter fish.
2. **Given** an active aquarium is displayed, **When** real time passes during a coding session, **Then** fish hunger increases, water dirtiness rises, and algae gradually builds up.
3. **Given** the user is actively coding, **When** keystrokes and edits are detected, **Then** deterioration rates increase slightly compared to idle time.
4. **Given** the aquarium companion is visible, **When** the user is coding normally, **Then** the companion does not obstruct code, interrupt workflow, or demand immediate attention.

---

### User Story 2 - Break-Time Maintenance Actions (Priority: P1)

When tank conditions deteriorate enough, the aquarium gently signals that care is needed through fish speech bubbles and a status bar indicator. The user clicks the companion to open a detailed tank view, where they can perform three quick maintenance actions: feed fish, change water, and clean algae. Each action takes only a few seconds and provides immediate visual feedback.

**Why this priority**: Maintenance actions are the core interaction loop — the primary way users engage with Pomotank and the mechanism through which breaks are encouraged. Without these, the aquarium is a passive screensaver with no break-prompting value.

**Independent Test**: Can be fully tested by waiting for deterioration to trigger care cues, opening the detailed view, performing each of the three actions, and confirming that tank state improves and visual feedback is provided.

**Acceptance Scenarios**:

1. **Given** fish hunger has risen above the care-needed threshold, **When** the user views the aquarium, **Then** fish display speech bubble cues indicating hunger.
2. **Given** water dirtiness or algae levels are elevated, **When** the user checks the status bar, **Then** a summary indicator shows the current tank state.
3. **Given** the user clicks the small companion, **When** the detailed tank view opens as a webview panel in the editor tab area, **Then** the user sees controls for Feed Fish, Change Water, and Clean Algae.
4. **Given** the user performs the Feed Fish action, **When** the action completes, **Then** fish hunger is reduced and a visual confirmation is shown.
5. **Given** the user performs the Change Water action, **When** the action completes, **Then** water dirtiness is significantly reduced.
6. **Given** the user performs the Clean Algae action, **When** the action completes, **Then** algae buildup is removed and the tank visually appears cleaner.

---

### User Story 3 - Pomo Points & Progression Rewards (Priority: P2)

After performing maintenance actions, the user earns `pomo` points. Maintenance performed near natural break timing (around the 25-minute mark) earns bonus points. Consecutive well-timed maintenance sessions build a streak multiplier. A daily continuity bonus rewards returning users. The user can spend points in a store to unlock tank upgrades, better filters, and new fish species.

**Why this priority**: Progression transforms the aquarium from a novelty into a sustained habit. Points and unlocks create the reward loop that keeps users returning and reinforces the break-taking behavior. However, the core loop (P1) must work first.

**Independent Test**: Can be fully tested by performing maintenance actions at various timings, verifying point awards differ based on timing, checking streak tracking across sessions, and purchasing an item from the store.

**Acceptance Scenarios**:

1. **Given** the user completes a maintenance action, **When** the action is performed, **Then** the user earns `pomo` points.
2. **Given** the user performs maintenance near the natural break window (around 25 minutes since last maintenance or session start), **When** points are calculated, **Then** a timing bonus multiplier is applied.
3. **Given** the user has performed well-timed maintenance across consecutive sessions, **When** the streak is active, **Then** a streak multiplier increases point earnings.
4. **Given** the user returns to Pomotank on a new day after caring for their tank the previous day, **When** the session begins, **Then** a daily continuity bonus is awarded.
5. **Given** the user has accumulated enough `pomo` points, **When** they open the store, **Then** they can browse and purchase tank upgrades, filters, and new fish.

---

### User Story 4 - Fish Health Deterioration & Consequences (Priority: P2)

If the user neglects the aquarium for extended periods, fish health deteriorates through a visible progression: Healthy → Warning → Sick → Dead. Warning signs appear after a few hours of neglect. Sickness follows prolonged neglect. Death occurs only after sustained, visible deterioration. The emotional tone remains soft — consequences matter but are never cruel or dramatic. Severe neglect or fish death breaks the care streak.

**Why this priority**: Consequences give weight to the care loop. Without them, maintenance feels optional and the break-encouraging purpose is undermined. However, consequences only matter once the core interaction loop (P1) is established.

**Independent Test**: Can be fully tested by leaving the aquarium unattended for progressively longer periods and observing the health state transitions, visual changes, and streak impact at each stage.

**Acceptance Scenarios**:

1. **Given** a fish has been in good conditions, **When** the tank state is checked, **Then** the fish displays a Healthy state with normal appearance and behavior.
2. **Given** the aquarium has been neglected for a few hours, **When** conditions remain poor, **Then** affected fish transition to a Warning state with subtle visual cues (subdued bubbles, changed expression).
3. **Given** a fish is in Warning state and neglect continues, **When** more time passes without care, **Then** the fish transitions to Sick state with visibly subdued behavior.
4. **Given** a fish is Sick and neglect continues further, **When** no care is provided, **Then** the fish eventually dies — presented as a sad but simple consequence.
5. **Given** a fish dies or severe neglect occurs, **When** the streak state is evaluated, **Then** the care streak and continuity bonus progression are reset.

---

### User Story 5 - Tank Upgrades & Fish Collection (Priority: P3)

The user spends `pomo` points to upgrade their tank through five sizes (Nano → Small → Medium → Large → XL), unlock stronger filters, and add new fish species (5 total in MVP). Larger tanks support more fish and larger species but require better filters to remain stable. Each fish species has unique stats: hunger rate, dirtiness load, minimum tank size, and schooling requirements. Better filters slow deterioration and extend time between required maintenance.

**Why this priority**: Upgrades and collection provide the long-term engagement arc and sense of growth. They make the progression system tangible. However, users need to experience the core loop and earn points before upgrades become relevant.

**Independent Test**: Can be fully tested by earning enough points to purchase a tank upgrade and a new fish, verifying that tank capacity changes, the new fish appears with its unique stats, and filter upgrades measurably slow deterioration rates.

**Acceptance Scenarios**:

1. **Given** the user has sufficient `pomo` points, **When** they purchase a tank size upgrade, **Then** the tank capacity increases, allowing more fish or larger species.
2. **Given** a fish species requires a minimum tank size of Medium, **When** the user's tank is Small, **Then** that fish species is not available for purchase.
3. **Given** the user purchases a stronger filter, **When** the filter is active, **Then** water dirtiness accumulates more slowly than before.
4. **Given** the user adds a new fish with a schooling requirement of 3, **When** fewer than 3 of that species are in the tank, **Then** the purchase is allowed but the system displays a soft warning about the species' schooling preference.
5. **Given** a larger tank with more fish, **When** no filter upgrade has been applied, **Then** water dirtiness increases faster than in a smaller tank with fewer fish.

---

### Edge Cases

- What happens when the user closes VSCode for an extended period? Tank deterioration should continue based on elapsed real time when the extension reactivates, capped at a maximum of 24 hours of deterioration regardless of actual time away.
- What happens when all fish die? The user should be able to restart with a new starter fish without losing tank upgrades or accumulated progression.
- What happens when the user attempts to add more fish than the tank capacity allows? The purchase or addition should be blocked with a clear message about capacity limits.
- What happens when the user performs maintenance on a tank with no issues? The action should still complete but award minimal or no points, preventing point farming.
- What happens during very short coding sessions (under 5 minutes)? Deterioration should still occur proportionally but should not trigger aggressive care cues.
- What happens if the user has no `pomo` points and wants to buy something? The store should show items as locked/unaffordable with the point cost clearly displayed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a small, persistent pixel-art aquarium companion as a webview view inside the Explorer view container, visible alongside the file tree without obstructing code editing.
- **FR-002**: System MUST initialize first-time users with a Nano tank and one beginner-friendly starter fish.
- **FR-003**: System MUST track and update three tank state parameters in real time: fish hunger, water dirtiness, and algae level.
- **FR-004**: System MUST slightly accelerate tank deterioration rates when the user is actively coding (keystrokes/edits detected).
- **FR-005**: System MUST display fish speech bubble cues when tank conditions require care.
- **FR-006**: System MUST display a status bar indicator summarizing current tank state.
- **FR-007**: System MUST provide a detailed tank view that opens as a webview panel in the editor tab area when the user clicks the companion view.
- **FR-008**: System MUST support three maintenance actions: Feed Fish (reduces hunger), Change Water (reduces dirtiness), and Clean Algae (reduces algae).
- **FR-009**: Each maintenance action MUST complete within a few seconds of user interaction.
- **FR-010**: System MUST track fish health through four states: Healthy, Warning, Sick, and Dead, with transitions driven by sustained poor tank conditions.
- **FR-011**: System MUST ensure health deterioration is gradual — Warning after a few hours of neglect, Sickness after longer neglect, Death only after sustained visible deterioration.
- **FR-012**: System MUST award `pomo` points for completing maintenance actions.
- **FR-013**: System MUST apply a timing bonus when maintenance is performed near the natural break window (approximately 25 minutes into a work session). The work session timer resets after any maintenance action is performed.
- **FR-014**: System MUST track consecutive well-timed maintenance streaks and apply a multiplier to point earnings.
- **FR-015**: System MUST award a daily continuity bonus for returning users who maintained their tank the previous day.
- **FR-016**: System MUST reset streak and continuity progression when fish die or severe neglect occurs.
- **FR-017**: System MUST provide a store where users can spend `pomo` points on tank size upgrades (5 sizes: Nano, Small, Medium, Large, XL), filter unlocks, and new fish species.
- **FR-018**: System MUST enforce tank capacity limits — larger tanks support more fish and larger species.
- **FR-019**: System MUST enforce minimum tank size requirements per fish species.
- **FR-020**: System MUST support 5 fish species, each with distinct hunger rate, dirtiness load, minimum tank size, and schooling requirement parameters. Schooling requirements MUST be enforced as soft warnings (purchase allowed, with a message about group preference), not hard blocks.
- **FR-021**: System MUST make filters functional — stronger filters slow water dirtiness accumulation.
- **FR-022**: System MUST persist all tank state, progression, and unlocks across VSCode sessions.
- **FR-023**: System MUST calculate elapsed real time between sessions and apply proportional deterioration on reactivation, capped at a maximum of 24 hours of deterioration regardless of actual absence duration.
- **FR-024**: System MUST allow users to recover after all fish die by providing a new starter fish without losing tank upgrades or progression.
- **FR-025**: System MUST support optional VSCode notifications for care reminders, disabled by default.
- **FR-026**: System MUST ensure that automation (filters, future auto-feeders) reduces but never eliminates the need for manual user care.

### Key Entities

- **Tank**: The aquarium container. Has a size tier (Nano through XL) that determines fish capacity and species eligibility. Tracks aggregate water dirtiness and algae levels.
- **Fish**: An individual aquarium inhabitant. Has a species type, current hunger level, and health state (Healthy/Warning/Sick/Dead). Belongs to one Tank.
- **Fish Species**: A template defining a type of fish. Specifies hunger rate, dirtiness load, minimum tank size, and schooling requirement. 5 species in MVP.
- **Filter**: An equipment item attached to a Tank. Has an efficiency level that slows water dirtiness growth. Stronger filters are unlocked through progression.
- **Player Profile**: The user's persistent progression state. Tracks `pomo` point balance, current streak count, daily continuity status, unlocked items, and purchase history.
- **Store Item**: A purchasable upgrade or unlock. Has a type (tank upgrade, filter, fish species), a `pomo` cost, and prerequisite conditions (e.g., minimum tank size).

## Clarifications

### Session 2026-03-23

- Q: Where should the small persistent companion live in the VSCode UI? → A: As a webview view inside the Explorer view container (alongside file tree, source control, etc.)
- Q: What should the maximum offline deterioration cap be? → A: Fixed duration cap of 24 hours — deterioration applied on return never exceeds 24 hours regardless of actual absence length.
- Q: Should schooling requirements be enforced as a hard purchase block or a soft warning? → A: Soft warning — allow purchase but display a message about the schooling preference.
- Q: Where should the detailed tank view open when the user clicks the companion? → A: As a webview panel in the editor tab area (like Settings or Welcome tab).
- Q: What resets the work session timer that determines the break window bonus? → A: Performing any maintenance action resets the timer. The next bonus window opens ~25 minutes after the last maintenance.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete any single maintenance action (feed, water change, clean algae) in under 10 seconds from opening the detailed view.
- **SC-002**: 80% of users who install Pomotank perform at least one maintenance action within their first coding session.
- **SC-003**: Users who engage with Pomotank for one week report taking more regular breaks than before installation, as measured by user survey.
- **SC-004**: The aquarium companion remains visible and functional during normal coding without causing noticeable editor performance degradation.
- **SC-005**: Users can progress from a Nano tank to a Small tank within their first 3 days of regular use (3+ sessions per day).
- **SC-006**: Fish health transitions (Healthy → Warning → Sick → Dead) occur over a predictable, multi-hour timeline that gives users reasonable opportunity to intervene.
- **SC-007**: 70% of returning users maintain a care streak of 3 or more consecutive days within their first week.
- **SC-008**: Users rate the emotional tone of the experience as "calming" or "pleasant" at a rate of 75% or higher in post-use surveys.
