# Research: Tank Config Refactor

## R1: Common Aquarium Tank Sizes (Real-World Reference)

**Decision**: Use 5 standard aquarium sizes commonly available in Japan/worldwide.

| ID | Name | Width (mm) | Height (mm) | Depth (mm) | Volume (approx) |
|----|------|-----------|-------------|------------|-----------------|
| nano_20 | 20cm Cube | 200 | 200 | 200 | ~8L |
| small_30 | 30cm Tank | 300 | 250 | 200 | ~15L |
| medium_45 | 45cm Tank | 450 | 300 | 240 | ~32L |
| large_60 | 60cm Tank | 600 | 360 | 300 | ~65L |
| xl_90 | 90cm Tank | 900 | 450 | 350 | ~142L |

**Rationale**: These are the most common standard aquarium sizes sold by ADA, GEX, Kotobuki, and other major manufacturers. The 20cm cube is popular as a nano starter tank, 30cm is a common beginner upgrade, 45cm is mid-range, 60cm is the standard hobbyist tank, and 90cm is a large display tank.

**Alternatives considered**:
- 25cm cube: Too similar to 20cm, doesn't add meaningful progression
- 75cm tank: Would add a 6th tier, increasing complexity without clear benefit
- 120cm tank: Too large for the game's scope

## R2: Fish Size to Tank Size Ratio

**Decision**: Use 4× multiplier (tank width >= fish maxSizeMm × 4).

**Rationale**: Confirmed during clarification phase. Verified against all current species:
- Neon Tetra (35mm × 4 = 140mm) → fits nano_20 (200mm) ✓
- Amano Shrimp (50mm × 4 = 200mm) → fits nano_20 (200mm) ✓
- Otocinclus (40mm × 4 = 160mm) → fits nano_20 (200mm) ✓
- Corydoras (60mm × 4 = 240mm) → needs small_30 (300mm) ✓
- Gourami (60mm × 4 = 240mm) → needs small_30 (300mm) ✓

This matches current game balance where neon tetras and shrimp start in Nano, while corydoras and gourami need Small.

**Alternatives considered**:
- 3× multiplier: Too permissive, almost all fish fit in Nano
- 5× multiplier: Shrimp (250mm) would need 30cm tank, breaking current balance
- 6× multiplier: Neon tetra wouldn't fit in smallest tank

## R3: Render Size Scaling Strategy

**Decision**: Maintain existing render size ratios, mapped from real-world proportions. Base the render width on a linear scale from the smallest (200px for 200mm) to largest (400px for 900mm), preserving aspect ratios from real dimensions.

| Tank ID | Real W×H (mm) | Render W×H (px) | Scale factor |
|---------|---------------|-----------------|-------------|
| nano_20 | 200×200 | 200×150 | Compact (cube rendered shorter for visual balance) |
| small_30 | 300×250 | 260×195 | ~0.87×/~0.78× |
| medium_45 | 450×300 | 320×240 | ~0.71×/~0.80× |
| large_60 | 600×360 | 370×278 | ~0.62×/~0.77× |
| xl_90 | 900×450 | 400×300 | ~0.44×/~0.67× |

**Rationale**: Exact proportional scaling would make the XL tank dominate the viewport. The existing render sizes are already well-tuned for the UI constraints. Keep them as-is within the new TankConfig.

## R4: State Migration Strategy

**Decision**: Map `TankSizeTier` enum values to new `TankId` values in `loadState()`.

Migration map:
- `'Nano'` → `'nano_20'`
- `'Small'` → `'small_30'`
- `'Medium'` → `'medium_45'`
- `'Large'` → `'large_60'`
- `'XL'` → `'xl_90'`

Also migrate `unlockedItems` references:
- `'tank_small'` → `'small_30'`
- `'tank_medium'` → `'medium_45'`
- `'tank_large'` → `'large_60'`
- `'tank_xl'` → `'xl_90'`

**Rationale**: globalState stores plain JSON. Migration can happen at load time with a version check or shape detection (presence of old enum values).

## R5: Light Diffusion Visual Design

**Decision**: Add a trapezoid-shaped light cone between the light bar and tank top, wider than the tank. Add vertical gap between light and tank (~6px), increase HUD-to-light gap by doubling HUD_HEIGHT or adding explicit padding.

**Rationale**: Real aquarium lights cast a spreading cone of light. A trapezoid (wider at bottom) simulates this naturally. The gap creates visual breathing room and makes the scene feel less cramped.

**Implementation approach**:
- Add `LIGHT_GAP` constant (~6px) between light bottom and tank top
- Light diffusion: render a semi-transparent trapezoid shape using Konva `Line` (polygon) from light width to tank width + overhang
- Increase `HUD_HEIGHT` from 16 to 24, or add `HUD_BOTTOM_PAD` constant
