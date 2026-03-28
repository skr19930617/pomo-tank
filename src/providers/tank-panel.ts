import * as vscode from 'vscode';
import type { GameEngine } from '../game/engine';
import type { GameState } from '../game/state';
import { getAllGenera } from '../game/species';
import type { ExtensionToWebviewMessage, WebviewToExtensionMessage } from '../shared/messages';
import { type UserSettings, FOCUS_MIN, FOCUS_MAX, BREAK_MIN, BREAK_MAX } from '../shared/types';
import { loadSettings, saveSettings } from '../persistence/storage';
import { buildSpriteUriMap } from '../shared/sprite-utils';

function isDebugMode(): boolean {
  return vscode.workspace.getConfiguration('pomotank').get<boolean>('debugMode', false);
}

export class TankPanelManager {
  private panel: vscode.WebviewPanel | null = null;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly engine: GameEngine,
  ) {}

  openOrReveal(_context: vscode.ExtensionContext, _initialView?: string): void {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'pomotank.tankDetail',
      'Pomotank - My Tank',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.extensionUri, 'media'),
          vscode.Uri.joinPath(this.extensionUri, 'dist'),
        ],
      },
    );

    this.panel.webview.html = this.getHtml(this.panel.webview);

    this.panel.webview.onDidReceiveMessage((message) => {
      this.handleMessage(message);
    });

    this.panel.onDidDispose(() => {
      // Ensure water quality freeze is released if this view owns it
      this.engine.setWaterQualityFrozen(false, 'tank-panel');
      this.engine.setWaterQualityFrozen(false, 'moss-cleaning');
      this.panel = null;
    });
  }

  updateState(_state: GameState): void {
    if (this.panel) {
      const msg: ExtensionToWebviewMessage = {
        type: 'stateUpdate',
        state: this.engine.createSnapshot(false, isDebugMode()),
      };
      this.panel.webview.postMessage(msg);
    }
  }

  private sendToWebview(msg: ExtensionToWebviewMessage): void {
    this.panel?.webview.postMessage(msg);
  }

  private handleMessage(message: WebviewToExtensionMessage): void {
    switch (message.type) {
      case 'ready': {
        const spriteMap = buildSpriteUriMap(
          this.panel!.webview,
          this.extensionUri,
          getAllGenera,
          vscode.Uri.joinPath,
        );
        this.sendToWebview({ type: 'spriteUriMap', spriteUriMap: spriteMap });
        this.sendToWebview({
          type: 'stateUpdate',
          state: this.engine.createSnapshot(false, isDebugMode()),
        });
        this.sendToWebview({
          type: 'settingsUpdate',
          settings: loadSettings(),
        });
        break;
      }
      case 'updateSettings': {
        const current = loadSettings();
        const merged: UserSettings = { ...current, ...message.settings };
        merged.focusMinutes = Math.max(FOCUS_MIN, Math.min(FOCUS_MAX, Math.round(merged.focusMinutes)));
        merged.breakMinutes = Math.max(BREAK_MIN, Math.min(BREAK_MAX, Math.round(merged.breakMinutes)));
        saveSettings(merged);
        this.engine.setSessionMinutes(merged.focusMinutes);
        this.engine.setBreakMinutes(merged.breakMinutes);
        this.sendToWebview({ type: 'settingsUpdate', settings: merged });
        // Send updated state so timer reflects new sessionMinutes immediately
        this.sendToWebview({
          type: 'stateUpdate',
          state: this.engine.createSnapshot(false, isDebugMode()),
        });
        break;
      }
      case 'feedFish':
        this.engine.performAction('feedFish');
        this.sendToWebview({ type: 'actionResult', action: 'Feed Fish', success: true });
        break;
      case 'changeWater':
        this.engine.performAction('changeWater');
        this.sendToWebview({ type: 'actionResult', action: 'Change Water', success: true });
        break;
      case 'waterChangeAnimStart':
        this.engine.setWaterQualityFrozen(true, 'tank-panel');
        break;
      case 'waterChangeAnimEnd':
        this.engine.setWaterQualityFrozen(false, 'tank-panel');
        break;
      case 'waterChangeComplete':
        // Unfreeze this owner then apply effect (bypass freeze in case another owner is active)
        this.engine.setWaterQualityFrozen(false, 'tank-panel');
        this.engine.performAction('changeWater', true);
        this.sendToWebview({ type: 'actionResult', action: 'Change Water', success: true });
        break;
      case 'cleanAlgae':
        this.engine.performAction('cleanAlgae');
        this.sendToWebview({ type: 'actionResult', action: 'Clean Algae', success: true });
        break;
      case 'mossCleaningStart':
        this.engine.setWaterQualityFrozen(true, 'moss-cleaning');
        break;
      case 'mossCleaningProgress':
        // UI tracks local algae level for instant feedback; engine state stays frozen
        // so isTankHealthy check works correctly at completion time.
        // No engine state change needed here.
        break;
      case 'mossCleaningComplete':
        // Unfreeze this owner then apply effect (bypass freeze in case another owner is active)
        this.engine.setWaterQualityFrozen(false, 'moss-cleaning');
        this.engine.performAction('cleanAlgae', true);
        this.sendToWebview({ type: 'actionResult', action: 'Clean Algae', success: true });
        break;
      case 'mossCleaningCancel':
        // Apply accumulated reduction so partial progress is preserved (FR-005)
        this.engine.setWaterQualityFrozen(false, 'moss-cleaning');
        if (message.totalReduction > 0) {
          this.engine.reduceAlgae(message.totalReduction);
        }
        break;
      case 'purchaseItem': {
        const result = this.engine.purchaseItem(message.itemId);
        this.sendToWebview({
          type: 'purchaseResult',
          itemId: message.itemId,
          success: result.success,
          message: result.message,
        });
        break;
      }
      case 'toggleLight': {
        const lightOn = this.engine.toggleLight();
        this.sendToWebview({ type: 'lightToggleResult', lightOn, success: true });
        break;
      }
      case 'openTank':
        break;
      case 'switchTank': {
        const tankResult = this.engine.switchTank(message.tankId);
        this.sendToWebview({ type: 'managementResult', action: 'Switch Tank', ...tankResult });
        this.sendToWebview({ type: 'stateUpdate', state: this.engine.createSnapshot(false, isDebugMode()) });
        break;
      }
      case 'switchFilter': {
        const filterResult = this.engine.switchFilter(message.filterId);
        this.sendToWebview({ type: 'managementResult', action: 'Switch Filter', ...filterResult });
        this.sendToWebview({ type: 'stateUpdate', state: this.engine.createSnapshot(false, isDebugMode()) });
        break;
      }
      case 'renameFish': {
        const renameResult = this.engine.renameFish(message.fishId, message.customName);
        this.sendToWebview({ type: 'managementResult', action: 'Rename Fish', ...renameResult });
        this.sendToWebview({ type: 'stateUpdate', state: this.engine.createSnapshot(false, isDebugMode()) });
        break;
      }
      case 'removeFish': {
        const removeResult = this.engine.removeFish(message.fishId);
        this.sendToWebview({ type: 'managementResult', action: 'Remove Fish', ...removeResult });
        this.sendToWebview({ type: 'stateUpdate', state: this.engine.createSnapshot(false, isDebugMode()) });
        break;
      }
      case 'debugSetPomo':
        if (isDebugMode()) {
          this.engine.setPomo(message.amount);
          this.sendToWebview({
            type: 'stateUpdate',
            state: this.engine.createSnapshot(false, isDebugMode()),
          });
        }
        break;
      case 'debugSetTickMultiplier':
        if (isDebugMode()) {
          this.engine.setTickMultiplier(message.multiplier);
          this.sendToWebview({
            type: 'stateUpdate',
            state: this.engine.createSnapshot(false, isDebugMode()),
          });
        }
        break;
      case 'debugResetState':
        if (isDebugMode()) {
          this.engine.resetState();
          this.sendToWebview({
            type: 'stateUpdate',
            state: this.engine.createSnapshot(false, isDebugMode()),
          });
        }
        break;
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'webview', 'tank-detail', 'style.css'),
    );
    const fontUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'webview', 'tank-detail', 'fonts', 'press-start-2p.woff2'),
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview-tank-panel.js'),
    );
    const nonce = getNonce();
    const cspSource = webview.cspSource;

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${cspSource}; font-src ${cspSource}"
    />
    <style>
      @font-face {
        font-family: 'PixelFont';
        src: url('${fontUri}') format('woff2');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
    </style>
    <link rel="stylesheet" href="${styleUri}" />
  </head>
  <body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
