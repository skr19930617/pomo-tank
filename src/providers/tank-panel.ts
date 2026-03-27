import * as vscode from 'vscode';
import type { GameEngine } from '../game/engine';
import type { GameState } from '../game/state';
import { getAllGenera } from '../game/species';
import type { AnimState } from '../shared/types';
import type { ExtensionToWebviewMessage, WebviewToExtensionMessage } from '../shared/messages';
import { type UserSettings, FOCUS_MIN, FOCUS_MAX, BREAK_MIN, BREAK_MAX } from '../shared/types';
import { loadSettings, saveSettings } from '../persistence/storage';

export type SpriteUriMap = Record<string, Record<string, Record<string, string>>>;

function isDebugMode(): boolean {
  return vscode.workspace.getConfiguration('pomotank').get<boolean>('debugMode', false);
}

function buildSpriteUriMap(webview: vscode.Webview, extensionUri: vscode.Uri): SpriteUriMap {
  const map: SpriteUriMap = {};
  const states: AnimState[] = ['swim', 'weak', 'feeding'];

  for (const genus of getAllGenera()) {
    map[genus.id] = {};
    for (const species of genus.species) {
      map[genus.id][species.id] = {};
      for (const state of states) {
        const filename = species.sprites[state];
        if (filename) {
          const uri = webview.asWebviewUri(
            vscode.Uri.joinPath(
              extensionUri,
              'media',
              'sprites',
              'fish',
              genus.id,
              species.id,
              filename,
            ),
          );
          map[genus.id][species.id][state] = uri.toString();
        }
      }
    }
  }
  return map;
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
      case 'ready':
        this.sendToWebview({
          type: 'stateUpdate',
          state: this.engine.createSnapshot(false, isDebugMode()),
        });
        this.sendToWebview({
          type: 'settingsUpdate',
          settings: loadSettings(),
        });
        break;
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
      case 'cleanAlgae':
        this.engine.performAction('cleanAlgae');
        this.sendToWebview({ type: 'actionResult', action: 'Clean Algae', success: true });
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
    const spriteUriMap = buildSpriteUriMap(webview, this.extensionUri);

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
    <script nonce="${nonce}">window.__SPRITE_URI_MAP__ = ${JSON.stringify(spriteUriMap)};</script>
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
