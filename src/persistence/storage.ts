import * as vscode from 'vscode';
import type { GameState } from '../game/state';
import { migrateState } from '../game/state';
import { type UserSettings, DEFAULT_USER_SETTINGS } from '../shared/types';

const STATE_KEY = 'pomotank.gameState';
const SETTINGS_KEY = 'pomotank.userSettings';

let context: vscode.ExtensionContext | null = null;

export function initStorage(ctx: vscode.ExtensionContext): void {
  context = ctx;
}

export function saveState(state: GameState): Thenable<void> {
  if (!context) {
    throw new Error('Storage not initialized');
  }
  return context.globalState.update(STATE_KEY, state);
}

export function loadState(): GameState | undefined {
  if (!context) {
    throw new Error('Storage not initialized');
  }
  const raw = context.globalState.get(STATE_KEY);
  if (!raw) return undefined;
  return migrateState(raw);
}

export function clearState(): Thenable<void> {
  if (!context) {
    throw new Error('Storage not initialized');
  }
  return context.globalState.update(STATE_KEY, undefined);
}

// ── User Settings persistence ──

export function withSettingsDefaults(partial: Partial<UserSettings> | undefined): UserSettings {
  return { ...DEFAULT_USER_SETTINGS, ...partial };
}

export function loadSettings(): UserSettings {
  if (!context) {
    throw new Error('Storage not initialized');
  }
  const raw = context.globalState.get<Partial<UserSettings>>(SETTINGS_KEY);
  return withSettingsDefaults(raw);
}

export function saveSettings(settings: UserSettings): Thenable<void> {
  if (!context) {
    throw new Error('Storage not initialized');
  }
  return context.globalState.update(SETTINGS_KEY, settings);
}
