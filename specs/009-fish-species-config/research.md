# Research: Fish Species Hierarchy Config

## R1: Genus/Species Config File Structure

**Decision**: One TypeScript file per Genus in `src/game/species/`, exporting a `GenusConfig` object that contains an array of `SpeciesConfig` entries. A central `index.ts` re-exports all genera as a registry map.

**Rationale**: TypeScript files (not JSON) allow type-safe config with IDE autocomplete, compile-time validation, and no runtime parsing. One file per Genus keeps configs co-located with their species while keeping the file count manageable (5 files for 5 genera vs. 14 files for individual species). The `index.ts` registry enables auto-discovery pattern.

**Alternatives considered**:
- JSON config files per Genus: Rejected — loses type safety, requires schema validation at runtime.
- One file per Species: Rejected — too granular for the current scale (14 files), genus-level traits would need to be duplicated or referenced from a separate file.
- Single config file with hierarchy: Rejected — doesn't meet the spec requirement of "separate configuration files per Genus."

## R2: Swim Layer Mapping

**Decision**: Define a `SwimLayer` enum with values `upper`, `middle`, `lower`, `all`. Map each to vertical percentage ranges:
- upper: 0.05–0.35
- middle: 0.25–0.75
- lower: 0.60–0.95
- all: 0.05–0.95

**Rationale**: These ranges provide natural overlap between layers (middle overlaps slightly with upper and lower) for visual realism — real fish don't have hard boundaries. The current codebase uses `swimZone: { min, max }` percentages, so the mapping is a direct replacement with no animation logic change required. The 0.05/0.95 margins prevent fish from touching the water surface or tank floor.

**Alternatives considered**:
- Hard boundaries (0-33%, 33-66%, 66-100%): Rejected — too rigid, creates visible "lines" between zones.
- Per-species custom percentages (current system): Rejected — spec requires named layers at genus level.

**Current species mapping**:
| Genus | Current swimZone | New SwimLayer |
|-------|-----------------|---------------|
| Neon Tetra | 0.20–0.70 | middle |
| Corydoras | 0.65–0.95 | lower |
| Gourami | 0.15–0.55 | upper |
| Otocinclus | 0.60–0.90 | lower |
| Shrimp | 0.70–0.95 | lower |

## R3: mm-Based Size System & Tank Dimensions

**Decision**: Define realistic mm dimensions for fish and tanks. Use a scaling function `mmToPx(mm, tankWidthMm, tankRenderWidthPx)` for conversion.

**Tank mm dimensions** (internal aquarium width):
| Tier | Real-world analog | Width (mm) | Height (mm) | Render (px) |
|------|-------------------|-----------|-------------|-------------|
| Nano | 20cm cube | 200 | 150 | 200×150 |
| Small | 30cm tank | 300 | 225 | 260×195 |
| Medium | 45cm tank | 450 | 300 | 320×240 |
| Large | 60cm tank | 600 | 400 | 370×278 |
| XL | 90cm tank | 900 | 600 | 400×300 |

**Fish mm sizes** (body length, based on real species):
| Genus | Species | Min (mm) | Max (mm) | Real-world ref |
|-------|---------|----------|----------|----------------|
| Neon Tetra | Standard | 20 | 35 | 20-35mm adult |
| Neon Tetra | Albino | 20 | 35 | Same species |
| Neon Tetra | Green | 18 | 30 | Slightly smaller |
| Corydoras | Albino | 30 | 55 | 50-65mm adult |
| Corydoras | Panda | 25 | 45 | Smaller variety |
| Corydoras | Sterbai | 30 | 60 | Larger variety |
| Gourami | Dwarf | 35 | 60 | 50-70mm adult |
| Gourami | Cobalt Blue Dwarf | 35 | 55 | Slightly smaller |
| Otocinclus | Standard | 20 | 40 | 30-45mm adult |
| Shrimp | Amano | 15 | 50 | 30-50mm adult |

**Scaling formula**: `pxSize = (fishMm / tankWidthMm) * tankRenderWidthPx`
- Example: 35mm Neon Tetra in Nano tank (200mm, 200px render) = (35/200) × 200 = 35px
- Example: 35mm Neon Tetra in XL tank (900mm, 400px render) = (35/900) × 400 ≈ 15.6px

**Rationale**: Real-world mm values make growth meaningful and proportions accurate. The scaling function naturally makes fish appear smaller in larger tanks (realistic). Current pixel sizes (12-30px) map roughly to these mm values in a Nano/Small tank context.

**Alternatives considered**:
- Arbitrary mm values (not based on real species): Rejected — loses the educational/realistic aspect of the aquarium sim.
- Fixed px-to-mm ratio: Rejected — wouldn't account for different tank sizes.

## R4: Growth Curve Model

**Decision**: Use a sigmoid (logistic) growth curve where fish size progresses from initial size toward maximum over their lifespan, modulated by maintenance quality.

**Growth formula per pomo**:
```
age_weeks += 1
age_ratio = age_weeks / total_lifespan_weeks
sigmoid_progress = 1 / (1 + exp(-10 * (age_ratio - 0.4)))
target_size = minSize + (maxSize - minSize) * sigmoid_progress * quality_factor
current_size = max(current_size, lerp(current_size, target_size, 0.3))
```

Where:
- `age_ratio`: 0.0 (newborn) to 1.0 (end of lifespan)
- `sigmoid_progress`: S-curve centered at 40% of lifespan (fish grows fastest in "adolescence")
- `quality_factor`: 0.0–1.0 from maintenance quality score, scales max achievable size
- `lerp`: Smooth interpolation prevents jarring size jumps
- `max(current_size, ...)`: Fish never shrinks (FR-016 plateau)

**Growth behavior examples** (2-year lifespan = ~104 pomos):
- At 20 pomos (~20% life): ~15% of max growth (still small juvenile)
- At 40 pomos (~40% life): ~50% of max growth (rapid adolescence)
- At 60 pomos (~60% life): ~85% of max growth (approaching adult)
- At 80 pomos (~80% life): ~97% of max growth (nearly full size)
- At 104 pomos (100% life): ~100% of max growth (natural death)

**Rationale**: Sigmoid curves model real biological growth well — slow juvenile phase, rapid adolescence, and plateau at maturity. The 0.4 center point means fish grow most visibly in the middle of their life, which is satisfying for users.

**Alternatives considered**:
- Linear growth: Rejected — unrealistic, no visible "growth spurt" satisfaction.
- Exponential growth: Rejected — too back-loaded, fish stay tiny for too long.
- Step-based (juvenile/adult/senior): Rejected — jarring size transitions.

## R5: Lifespan & Time Scale Balance

**Decision**: 1 pomo = 1 week of in-tank time. Species lifespans defined in years (min/max range). At purchase, a fish's lifespan is randomized within range.

**Lifespan values** (based on real species, adjusted for game balance):
| Genus | Min lifespan (years) | Max lifespan (years) | Min pomos | Max pomos |
|-------|---------------------|---------------------|-----------|-----------|
| Neon Tetra | 3 | 5 | ~156 | ~260 |
| Corydoras | 5 | 8 | ~260 | ~416 |
| Gourami | 3 | 5 | ~156 | ~260 |
| Otocinclus | 3 | 5 | ~156 | ~260 |
| Shrimp | 2 | 3 | ~104 | ~156 |

**Balance analysis** (1 pomo/day = casual user):
- Shrimp (shortest): ~3.5-5 months of daily use → reasonable, users get attached but not forever
- Corydoras (longest): ~8.5-14 months → long-lived "veteran" fish, rewarding for dedicated users
- Most fish: ~5-9 months → good middle ground

**With poor maintenance** (quality_factor = 0.5):
- Lifespan reduced by up to 30%: Shrimp lives ~73-109 pomos instead of 104-156
- Still gives users weeks to course-correct before losing fish

**Rationale**: Real fish lifespans (compressed slightly) provide variety. Shrimp as shortest-lived creates natural turnover and purchasing incentive. Corydoras as longest-lived rewards consistent care. The 1 pomo = 1 week mapping means even casual users (1 pomo/day) see meaningful progression over weeks.

**Alternatives considered**:
- 1 pomo = 1 day: Rejected — fish would live thousands of pomos, growth too slow to notice.
- 1 pomo = 1 month: Rejected — fish die too fast (Shrimp = ~24-36 pomos ≈ 1 month).
- Uniform lifespans: Rejected — loses biological variety and strategic depth.

## R6: Maintenance Quality Score Computation

**Decision**: Exponential moving average (EMA) of per-pomo quality snapshots, stored as a single float (0.0–1.0) per fish.

**Computation**:
```
snapshot = 1.0 - (hunger + dirtiness + algae) / 300  // 0.0 (worst) to 1.0 (best)
quality = quality * (1 - alpha) + snapshot * alpha     // EMA blend
alpha = 0.1                                            // Smoothing factor
```

**Behavior**:
- New fish start at quality = 1.0 (benefit of the doubt)
- Good maintenance (all conditions < 20): snapshot ≈ 0.93 → quality stays high
- Moderate neglect (conditions ~50): snapshot ≈ 0.50 → quality slowly degrades
- Severe neglect (conditions > 70): snapshot ≈ 0.30 → quality drops faster
- Recovery: After neglect, quality takes ~20 good pomos to recover from 0.3 to 0.8

**Impact on growth**:
- `quality_factor` in growth formula = `quality` value
- At quality 1.0: fish reaches ~100% of max size
- At quality 0.5: fish reaches ~50-60% of max size
- SC-003 (85% at end of life): Requires average quality ≥ 0.85 → achievable with occasional lapses
- SC-004 (60% max, 30% lifespan loss): Triggered when average quality ≤ 0.5

**Impact on lifespan**:
```
effective_lifespan = base_lifespan * (0.7 + 0.3 * quality)
```
- At quality 1.0: 100% lifespan
- At quality 0.5: 85% lifespan
- At quality 0.0: 70% lifespan (minimum — even worst case, fish doesn't die instantly from aging)

**Rationale**: EMA is simple, requires only one stored float per fish, naturally weights recent care more heavily (forgiving past mistakes), and smoothly transitions between good and bad states. Alpha of 0.1 means the last ~10 pomos have the strongest influence.

**Alternatives considered**:
- Simple average of all pomos: Rejected — early pomos permanently dilute later care quality.
- Sliding window (last N pomos): Rejected — requires storing N values per fish, more complex persistence.
- Binary good/bad counter: Rejected — too coarse, loses nuance.

## R7: Fish Info Tooltip Design

**Decision**: Show a tooltip panel when user clicks on a fish (not hover — too easy to trigger accidentally in a crowded tank). Display: Species name, current size (mm), age (weeks/months), health state, and a simple quality indicator.

**Tooltip content**:
```
Green Neon Tetra
Size: 28mm | Age: 12 weeks
Health: Healthy
Care: ★★★★☆
```

**Rationale**: Click-to-show prevents tooltip spam when mouse passes over multiple fish. The "Care" star rating (1-5 based on quality score quintiles) gives users feedback without exposing raw numbers.

**Alternatives considered**:
- Hover tooltip: Rejected — fish move constantly, hover would flicker and obstruct view.
- Detailed panel with graphs: Rejected — overengineered for the current scope, can be added later.

## R8: Tank Downgrade Overflow Handling

**Decision**: When user attempts to downgrade tank (buy a smaller tank — note: this is currently impossible since upgrades are one-way, but FR-020 specifies the behavior), show a confirmation dialog listing which fish will be removed. On confirm, remove the most recently purchased fish first until capacity fits.

**Removal order**: Last-in-first-out (most recently added fish removed first). This preserves the user's "veteran" fish they've had longest.

**Rationale**: LIFO removal is intuitive — newer fish are less attached to. Showing which fish will be removed gives users agency to cancel if they'd lose a valued fish.

**Note**: The current store only supports tank *upgrades* (Small → Medium → Large → XL). Tank downgrade is not currently implemented. FR-020 may be deferred or implemented as part of a future "sell items" feature. The plan includes the data model support but actual downgrade UI may be out of scope for initial implementation.

## R9: State Migration Strategy

**Decision**: Add a migration function in the state loading pipeline that converts old `Fish` objects to the new format. Run on state load, similar to existing `migrateState()`.

**Migration mapping**:
- `speciesId` → maps to new `genusId` (same string values: 'neon_tetra', 'corydoras', etc.)
- `variantId` → maps to new `speciesId` (same string values: 'standard', 'albino', etc.)
- New fields get defaults: `bodyLengthMm` = midpoint of species min/max, `ageWeeks` = estimated from sicknessTick history, `lifespanWeeks` = midpoint of species range, `maintenanceQuality` = 0.8 (generous default)
- Old `Fish.displaySize` concept removed (computed from bodyLengthMm at render time)

**Rationale**: Generous defaults ensure migrated fish don't die immediately or look wrong. Setting quality to 0.8 rather than 1.0 accounts for the fact that users haven't been "tracked" yet but shouldn't be penalized.
