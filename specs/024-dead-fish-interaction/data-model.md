# Data Model: Dead Fish Interaction

## Existing Entities (No Changes)

### Fish (src/game/state.ts)
```typescript
interface Fish {
  id: string;
  genusId: GenusId;
  speciesId: string;
  healthState: HealthState;  // Healthy | Warning | Sick | Dead
  sicknessTick: number;
  bodyLengthMm: number;
  ageWeeks: number;
  lifespanWeeks: number;
  maintenanceQuality: number;
  purchasedAt: number;
  customName?: string;
}
```

No schema changes needed. `healthState: 'Dead'` already exists and is sufficient for all dead fish logic.

## New State (Webview-Local, Not Persisted)

### Hover State (TankScene.tsx)
```typescript
// Replace existing selectedFishId with hoveredFishId
hoveredFishId: string | null;  // ID of the fish currently under cursor
```

### Fade Animation State (TankScene.tsx)
```typescript
fadingFishId: string | null;   // ID of dead fish currently fading out
fadeStartTime: number;         // performance.now() when fade started
```

## New Message Types (src/shared/messages.ts)

### WebviewToExtensionMessage Addition
```typescript
| { type: 'removeFish'; fishId: string }
```

### Extension Handler (extension.ts)
On receiving `removeFish`:
1. `engine.removeFish(fishId)` — filters fish array, saves state
2. Sends updated `GAME_STATE_UPDATE` snapshot back to webview

## State Transitions

### Fish Lifecycle (Updated)
```
Healthy → Warning → Sick → Dead → [Click Remove] → Deleted
                                  ↓ (immediate)
                                  Bottom placement (upside-down, transparent)
                                  ↓ (on click)
                                  Fade-out (300ms visual) + Data deletion (instant)
```

### Hover State Machine
```
idle (no hover)
  → mouseEnter on fish → hovered(fishId) [show tooltip + highlight + pointer cursor if dead]
  → mouseLeave / fish swims away → idle
  → mode activates → idle (forced clear)
  → fish dies while hovered → hovered(same fishId) [update tooltip, add pointer cursor]
  → dead fish clicked → fading(fishId) → idle (after 300ms)
```

## Rendering Layer Order (Updated)

```
1. Tank background (wall, desk)
2. Tank body (water, sand)
3. Dead fish (bottom, sorted by death order — older = back, newer = front)
4. Live fish (swim zone, sorted by existing order)
5. Algae overlay
6. Food overlay
7. Fish tooltip (listening=false, pointer-events disabled)
8. HUD overlay
```

Key change: Dead fish render **behind** live fish (FR-005a: live fish are in front of dead fish in Z-order).
