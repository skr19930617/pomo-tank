import * as vscode from 'vscode';
import type { GameState } from '../game/state';

const STATE_KEY = 'pomotank.gameState';

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
  return context.globalState.get<GameState>(STATE_KEY);
}

export function clearState(): Thenable<void> {
  if (!context) {
    throw new Error('Storage not initialized');
  }
  return context.globalState.update(STATE_KEY, undefined);
}
