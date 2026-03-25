# Quickstart: Debug Mode

## Verification Scenarios

### 1. Debug Mode Toggle

1. Open VSCode Settings, search "pomotank"
2. **Verify**: `pomotank.debugMode` setting exists (default: false)
3. Enable it (check the box)
4. Open the tank panel
5. **Verify**: A debug panel appears below the store button with pomo input and reset button
6. Disable the setting
7. **Verify**: The debug panel disappears immediately

### 2. Set Pomo Balance

1. Enable debug mode
2. Open the tank panel
3. Enter "500" in the pomo input field and click "Set"
4. **Verify**: HUD shows 500 pomo balance
5. Open the store
6. **Verify**: Items costing 500 or less show as affordable
7. Enter "0" and click "Set"
8. **Verify**: Balance returns to 0, store items show as unaffordable

### 3. Reset State

1. Enable debug mode
2. Purchase some fish and upgrades (set pomo high first)
3. Click "Reset State" button
4. **Verify**: A confirmation step appears (not immediate reset)
5. Confirm the reset
6. **Verify**: Tank returns to Nano, 1 neon tetra, 0 pomo, 0 hunger/dirtiness/algae
7. **Verify**: HUD and tank display update immediately

### 4. Edge Cases

1. Enter "-50" in pomo input → **Verify**: clamps to 0
2. Enter "999999" → **Verify**: accepted, HUD shows "9999+"
3. Debug mode off → **Verify**: no debug controls visible anywhere
