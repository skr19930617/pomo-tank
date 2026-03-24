// ── Webview ↔ Extension message contracts ──
// Discriminated unions ensuring type-safe communication.

import type { GameStateSnapshot } from "../game/state";

// ── Extension → Webview ──

export type ExtensionToWebviewMessage =
  | { type: "stateUpdate"; state: GameStateSnapshot }
  | { type: "actionResult"; action: string; success: boolean }
  | { type: "purchaseResult"; itemId: string; success: boolean; message?: string }
  | { type: "lightToggleResult"; lightOn: boolean; success: boolean };

// ── Webview → Extension ──

export type WebviewToExtensionMessage =
  | { type: "ready" }
  | { type: "feedFish" }
  | { type: "changeWater" }
  | { type: "cleanAlgae" }
  | { type: "toggleLight" }
  | { type: "purchaseItem"; itemId: string }
  | { type: "openTank" };
