// ── Webview ↔ Extension message contracts ──
// Discriminated unions ensuring type-safe communication.

import type { GameStateSnapshot } from '../game/state';
import type { UserSettings, TankSizeTier, FilterId } from './types';

// ── Extension → Webview ──

export type ExtensionToWebviewMessage =
  | { type: 'stateUpdate'; state: GameStateSnapshot }
  | { type: 'actionResult'; action: string; success: boolean }
  | { type: 'purchaseResult'; itemId: string; success: boolean; message?: string }
  | { type: 'lightToggleResult'; lightOn: boolean; success: boolean }
  | { type: 'settingsUpdate'; settings: UserSettings }
  | { type: 'managementResult'; action: string; success: boolean; message?: string };

// ── Webview → Extension ──

export type WebviewToExtensionMessage =
  | { type: 'ready' }
  | { type: 'feedFish' }
  | { type: 'changeWater' }
  | { type: 'cleanAlgae' }
  | { type: 'toggleLight' }
  | { type: 'purchaseItem'; itemId: string }
  | { type: 'openTank' }
  | { type: 'debugSetPomo'; amount: number }
  | { type: 'debugResetState' }
  | { type: 'debugSetTickMultiplier'; multiplier: number }
  | { type: 'updateSettings'; settings: Partial<UserSettings> }
  | { type: 'switchTank'; sizeTier: TankSizeTier }
  | { type: 'switchFilter'; filterId: FilterId }
  | { type: 'renameFish'; fishId: string; customName: string }
  | { type: 'removeFish'; fishId: string };
