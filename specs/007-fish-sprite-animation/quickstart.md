# Quickstart: Fish Sprite Animation System

## Verification Scenarios

### 1. Basic Sprite Rendering (US1)

1. Build and launch the extension (`npm run build`, F5 in VSCode)
2. Open the tank panel via command palette
3. **Verify**: Fish render as animated pixel-art sprites (not colored rectangles)
4. **Verify**: Sprites cycle through 12 frames smoothly at ~8 FPS
5. **Verify**: Fish flip horizontally when changing swim direction

### 2. Health-Based Animation (US2)

1. Start a tank with fish and let hunger accumulate (skip 1+ pomo without feeding)
2. **Verify**: When fish reach Warning state, they switch to weak animation with noticeably slower movement
3. Feed the tank to restore health
4. **Verify**: Fish transition back to swim animation at normal speed
5. Let a fish die (ignore all maintenance)
6. **Verify**: Dead fish shows weak sprite frozen on last frame, low opacity, stationary, stays in tank

### 3. Per-Species Behavior (US3)

1. Purchase one of each species type
2. **Verify**: Corydoras/otocinclus/shrimp stay near the bottom of the tank
3. **Verify**: Gourami swim in the upper-mid region
4. **Verify**: Neon tetras occupy the middle zone
5. **Verify**: Gourami move slower than neon tetras
6. **Verify**: Fish sizes are visually distinct between species

### 4. Feeding Animation (US4)

1. Have otocinclus or shrimp in the tank
2. Click the Feed button
3. **Verify**: Otocinclus/shrimp briefly play a feeding animation (~1.5s)
4. **Verify**: Other species (neon_tetra, corydoras, gourami) continue swim animation without disruption

### 5. Directory Structure (US5)

1. Check `media/sprites/fish/` directory
2. **Verify**: Each species has a directory
3. **Verify**: Each variant within a species has its own subdirectory
4. **Verify**: Sprite files follow `{state}_64x64_6x2_12f.png` naming

### 6. State Migration

1. If existing save has guppy/betta/angelfish fish:
2. **Verify**: They are automatically migrated to neon_tetra/gourami equivalents
3. **Verify**: The store no longer shows guppy/betta/angelfish
4. **Verify**: New store shows neon_tetra, corydoras, gourami, otocinclus, shrimp

### 7. Edge Cases

1. **New fish variant**: Fish created should have a random variant from their species
2. **Multiple of same species**: Different individuals may have different variants
3. **Light off**: Fish still animate but at reduced brightness/rate
