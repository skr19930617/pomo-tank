import * as vscode from "vscode";
import type { GameEngine } from "../game/engine";
import type { GameState } from "../game/state";

export class TankPanelManager {
  private panel: vscode.WebviewPanel | null = null;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly engine: GameEngine,
  ) {}

  openOrReveal(
    context: vscode.ExtensionContext,
    initialView?: string,
  ): void {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "pomotank.tankDetail",
      "Pomotank - My Tank",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.extensionUri, "media"),
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

  updateState(state: GameState): void {
    if (this.panel) {
      const snapshot = this.engine.createSnapshot(false);
      this.panel.webview.postMessage({
        type: "stateUpdate",
        state: snapshot,
      });
    }
  }

  private handleMessage(message: {
    type: string;
    itemId?: string;
  }): void {
    switch (message.type) {
      case "ready": {
        const snapshot = this.engine.createSnapshot(false);
        this.panel?.webview.postMessage({
          type: "stateUpdate",
          state: snapshot,
        });
        break;
      }
      case "feedFish":
        this.engine.performAction("feedFish");
        this.panel?.webview.postMessage({
          type: "actionResult",
          action: "Feed Fish",
          success: true,
        });
        break;
      case "changeWater":
        this.engine.performAction("changeWater");
        this.panel?.webview.postMessage({
          type: "actionResult",
          action: "Change Water",
          success: true,
        });
        break;
      case "cleanAlgae":
        this.engine.performAction("cleanAlgae");
        this.panel?.webview.postMessage({
          type: "actionResult",
          action: "Clean Algae",
          success: true,
        });
        break;
      case "purchaseItem":
        if (message.itemId) {
          const result = this.engine.purchaseItem(message.itemId);
          this.panel?.webview.postMessage({
            type: "purchaseResult",
            itemId: message.itemId,
            success: result.success,
            message: result.message,
          });
        }
        break;
      case "toggleLight": {
        const lightOn = this.engine.toggleLight();
        this.panel?.webview.postMessage({
          type: "lightToggleResult",
          lightOn,
          success: true,
        });
        break;
      }
      case "openStore":
        // Store is handled in webview JS
        break;
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.extensionUri,
        "media",
        "webview",
        "tank-detail",
        "style.css",
      ),
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.extensionUri,
        "media",
        "webview",
        "tank-detail",
        "main.js",
      ),
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
      content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${cspSource}"
    />
    <link rel="stylesheet" href="${styleUri}" />
  </head>
  <body>
    <div id="app">
      <div id="tank-view">
        <canvas id="tank-canvas" width="200" height="200"></canvas>
      </div>
      <div id="stats-bar">
        <span id="stat-hunger">Hunger: 0%</span>
        <span id="stat-water">Water: 0%</span>
        <span id="stat-algae">Algae: 0%</span>
        <span id="stat-pomo">Pomo: 0</span>
        <span id="stat-streak">Streak: 0</span>
        <span id="stat-timer">Session: 0min</span>
      </div>
      <div id="actions">
        <button id="btn-feed" class="action-btn">Feed Fish</button>
        <button id="btn-water" class="action-btn">Change Water</button>
        <button id="btn-algae" class="action-btn">Clean Algae</button>
        <button id="btn-light" class="action-btn light-btn">Light: ON</button>
        <button id="btn-store" class="action-btn store-btn">Store</button>
      </div>
      <div id="store-panel" class="hidden">
        <h3>Store</h3>
        <div id="store-items"></div>
      </div>
      <div id="notification" class="hidden"></div>
    </div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
  }
}

function getNonce(): string {
  let text = "";
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
