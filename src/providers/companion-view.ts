import * as vscode from 'vscode';
import type { GameEngine } from '../game/engine';
import type { GameState } from '../game/state';
import { getAllGenera } from '../game/species';
import type { AnimState } from '../shared/types';
import type { ExtensionToWebviewMessage, WebviewToExtensionMessage } from '../shared/messages';
import type { SpriteUriMap } from './tank-panel';

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

export class CompanionViewProvider implements vscode.WebviewViewProvider {
  private view: vscode.WebviewView | null = null;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly engine: GameEngine,
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, 'media'),
        vscode.Uri.joinPath(this.extensionUri, 'dist'),
      ],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message: WebviewToExtensionMessage) => {
      switch (message.type) {
        case 'ready':
          this.sendState(this.engine.getState());
          break;
        case 'openTank':
          vscode.commands.executeCommand('pomotank.openTank');
          break;
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
        case 'toggleLight': {
          const lightOn = this.engine.toggleLight();
          this.sendToWebview({ type: 'lightToggleResult', lightOn, success: true });
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
        case 'debugResetState':
          if (isDebugMode()) {
            this.engine.resetState();
            this.sendToWebview({
              type: 'stateUpdate',
              state: this.engine.createSnapshot(false, isDebugMode()),
            });
          }
          break;
        default:
          break;
      }
    });

    webviewView.onDidDispose(() => {
      this.view = null;
    });
  }

  updateState(_state: GameState): void {
    this.sendToWebview({
      type: 'stateUpdate',
      state: this.engine.createSnapshot(false, isDebugMode()),
    });
  }

  private sendToWebview(msg: ExtensionToWebviewMessage): void {
    this.view?.webview.postMessage(msg);
  }

  private sendState(_state: GameState): void {
    this.sendToWebview({
      type: 'stateUpdate',
      state: this.engine.createSnapshot(false, isDebugMode()),
    });
  }

  private getHtml(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'webview', 'companion', 'style.css'),
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview-companion.js'),
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
      content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${cspSource}"
    />
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
