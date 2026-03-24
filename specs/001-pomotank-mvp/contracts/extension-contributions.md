# Extension Contributions Contract: Pomotank MVP

**Branch**: `001-pomotank-mvp` | **Date**: 2026-03-23

This document defines the public interface of the Pomotank VSCode extension — what it contributes to the VSCode environment and how users interact with it.

## View Contributions

### Explorer Companion View

- **View Container**: Explorer (`explorer`)
- **View ID**: `pomotank.companionView`
- **View Title**: "Pomotank"
- **Type**: WebviewView
- **Behavior**: Renders a small pixel-art aquarium with animated fish, tank state, and speech bubbles. Clicking the view opens the detailed tank panel.

### Detailed Tank Panel

- **Type**: WebviewPanel (editor tab)
- **View Type**: `pomotank.tankDetail`
- **Title**: "Pomotank - My Tank"
- **Behavior**: Full-size aquarium view with maintenance action buttons, tank stats, and store access. Opened via companion view click or command.

## Commands

| Command ID                    | Title                  | Description                              |
|-------------------------------|------------------------|------------------------------------------|
| `pomotank.openTank`           | Pomotank: Open Tank    | Opens the detailed tank panel            |
| `pomotank.feedFish`           | Pomotank: Feed Fish    | Executes the Feed Fish maintenance action|
| `pomotank.changeWater`        | Pomotank: Change Water | Executes the Change Water action         |
| `pomotank.cleanAlgae`         | Pomotank: Clean Algae  | Executes the Clean Algae action          |
| `pomotank.openStore`          | Pomotank: Open Store   | Opens the store view within the tank panel|

## Status Bar Item

- **Position**: Left side, priority 100 (low priority, right of most items)
- **Text format**: `$(pomotank-icon) [state emoji/icon]`
- **Tooltip**: Summary of tank state (hunger/dirtiness/algae levels, fish health)
- **Click action**: Executes `pomotank.openTank`

## Configuration Settings

| Setting ID                        | Type    | Default | Description                              |
|-----------------------------------|---------|---------|------------------------------------------|
| `pomotank.enableNotifications`    | boolean | false   | Enable VSCode notification reminders     |
| `pomotank.workSessionMinutes`     | number  | 25      | Work session duration before break window|
| `pomotank.showStatusBar`          | boolean | true    | Show/hide status bar indicator           |

## Webview ↔ Extension Host Message Protocol

### Webview → Host (User Actions)

```typescript
type WebviewToHostMessage =
  | { type: "feedFish" }
  | { type: "changeWater" }
  | { type: "cleanAlgae" }
  | { type: "openStore" }
  | { type: "purchaseItem"; itemId: string }
  | { type: "ready" }  // Webview loaded and ready for state
```

### Host → Webview (State Updates)

```typescript
type HostToWebviewMessage =
  | { type: "stateUpdate"; state: GameStateSnapshot }
  | { type: "actionResult"; action: string; success: boolean; message?: string }
  | { type: "pointsAwarded"; points: number; bonus: string }
  | { type: "purchaseResult"; itemId: string; success: boolean; message?: string }

interface GameStateSnapshot {
  tank: {
    sizeTier: string;
    waterDirtiness: number;
    algaeLevel: number;
    filterId: string | null;
  };
  fish: Array<{
    id: string;
    speciesId: string;
    hungerLevel: number;
    healthState: string;
  }>;
  player: {
    pomoBalance: number;
    currentStreak: number;
    dailyContinuityDays: number;
  };
  session: {
    timeSinceLastMaintenance: number;  // ms
    isInBreakWindow: boolean;
    isActivelyCoding: boolean;
  };
  store: {
    items: Array<{
      id: string;
      name: string;
      type: string;
      pomoCost: number;
      affordable: boolean;
      meetsPrerequisites: boolean;
    }>;
  };
}
```

## Activation Events

- `onView:pomotank.companionView` — activate when the companion view becomes visible
- `onStartupFinished` — activate on VSCode startup to resume game tick and calculate offline deterioration
