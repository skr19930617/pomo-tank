import * as vscode from "vscode";
import type { GameEngine } from "../game/engine";
import type { GameState } from "../game/state";

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
        vscode.Uri.joinPath(this.extensionUri, "media"),
      ],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.type) {
        case "ready":
          this.sendState(this.engine.getState());
          break;
        case "openTank":
          vscode.commands.executeCommand("pomotank.openTank");
          break;
      }
    });

    webviewView.onDidDispose(() => {
      this.view = null;
    });
  }

  updateState(state: GameState): void {
    if (this.view) {
      const snapshot = this.engine.createSnapshot(false);
      this.view.webview.postMessage({
        type: "stateUpdate",
        state: snapshot,
      });
    }
  }

  private sendState(state: GameState): void {
    if (this.view) {
      const snapshot = this.engine.createSnapshot(false);
      this.view.webview.postMessage({
        type: "stateUpdate",
        state: snapshot,
      });
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.extensionUri,
        "media",
        "webview",
        "companion",
        "style.css",
      ),
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.extensionUri,
        "media",
        "webview",
        "companion",
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
    <div id="tank-container">
      <canvas id="tank-canvas" width="200" height="160"></canvas>
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
