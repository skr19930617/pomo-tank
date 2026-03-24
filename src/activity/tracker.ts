import * as vscode from 'vscode';

const ACTIVE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

export class ActivityTracker implements vscode.Disposable {
  private lastEditTime: number = 0;
  private disposable: vscode.Disposable;

  constructor() {
    this.disposable = vscode.workspace.onDidChangeTextDocument(() => {
      this.lastEditTime = Date.now();
    });
  }

  isActivelyCoding(): boolean {
    return Date.now() - this.lastEditTime < ACTIVE_WINDOW_MS;
  }

  dispose(): void {
    this.disposable.dispose();
  }
}
