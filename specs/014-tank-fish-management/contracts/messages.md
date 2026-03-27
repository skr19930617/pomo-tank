# Message Contracts: Tank & Fish Management

**Feature**: 014-tank-fish-management
**Date**: 2026-03-26

## Existing Messages (unchanged)

### Extension → Webview
- `stateUpdate` — full GameStateSnapshot (extended with unlockedItems + customName)
- `actionResult` — maintenance action result
- `purchaseResult` — store purchase result
- `lightToggleResult` — light toggle result
- `settingsUpdate` — timer settings sync

### Webview → Extension
- `ready` / `feedFish` / `changeWater` / `cleanAlgae` / `toggleLight` / `purchaseItem`
- `openTank` / `debugSetPomo` / `debugResetState` / `updateSettings`

## New Messages

### Webview → Extension: `switchTank`
```typescript
{ type: 'switchTank'; sizeTier: TankSizeTier }
```
Request to change tank size. Engine validates capacity and unlocked status.

### Webview → Extension: `switchFilter`
```typescript
{ type: 'switchFilter'; filterId: FilterId }
```
Request to change filter. Engine validates capacity and unlocked status.

### Webview → Extension: `renameFish`
```typescript
{ type: 'renameFish'; fishId: string; customName: string }
```
Set custom name (empty string = clear). Engine validates fish exists and trims to 20 chars.

### Webview → Extension: `removeFish`
```typescript
{ type: 'removeFish'; fishId: string }
```
Remove fish from tank. Engine validates fish exists.

### Extension → Webview: `managementResult`
```typescript
{ type: 'managementResult'; action: string; success: boolean; message?: string }
```
Result of any management action. `action` values: `'Switch Tank'`, `'Switch Filter'`, `'Rename Fish'`, `'Remove Fish'`.

## Extended Snapshot Fields

### player (gains unlockedItems)
```typescript
player: {
  pomoBalance: number;
  currentStreak: number;
  dailyContinuityDays: number;
  unlockedItems: string[];  // NEW
}
```

### fish array (gains customName)
```typescript
fish: Array<{
  // ...existing fields...
  customName?: string;  // NEW
}>
```
