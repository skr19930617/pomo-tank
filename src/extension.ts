import * as vscode from 'vscode';
import { createInitialState } from './game/state';
import { initStorage, loadState, saveState } from './persistence/storage';
import { GameEngine } from './game/engine';
import { CompanionViewProvider } from './providers/companion-view';
import { TankPanelManager } from './providers/tank-panel';
import { ActivityTracker } from './activity/tracker';
import { StatusBarManager } from './ui/status-bar';

let engine: GameEngine | null = null;
let activityTracker: ActivityTracker | null = null;

export function activate(context: vscode.ExtensionContext): void {
  console.log('Pomotank: activate() called');
  try {
    // Initialize persistence
    initStorage(context);

    // Load or create initial state
    let state = loadState();
    if (!state) {
      state = createInitialState();
      saveState(state);
    }

    // Initialize activity tracker
    activityTracker = new ActivityTracker();
    context.subscriptions.push(activityTracker);

    // Read configurable session duration
    const config = vscode.workspace.getConfiguration('pomotank');
    const rawSessionMinutes = config.get<number>('workSessionMinutes', 25);
    const sessionMinutes = Math.max(1, Math.min(120, rawSessionMinutes));
    if (rawSessionMinutes !== sessionMinutes) {
      console.warn(
        `Pomotank: workSessionMinutes (${rawSessionMinutes}) clamped to [1, 120] → ${sessionMinutes}`,
      );
    }

    // Initialize game engine
    engine = new GameEngine(state, activityTracker, sessionMinutes);

    // Migrate legacy state if needed
    engine.migrateState();

    // Run offline catch-up
    engine.applyOfflineCatchUp();
    saveState(engine.getState());

    // Initialize UI providers
    const companionProvider = new CompanionViewProvider(context.extensionUri, engine);
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider('pomotank.companionView', companionProvider),
    );

    const tankPanel = new TankPanelManager(context.extensionUri, engine);

    // Initialize status bar
    const statusBar = new StatusBarManager(engine);
    context.subscriptions.push(statusBar);

    // Subscribe UI to engine state changes
    engine.onStateChange((newState) => {
      companionProvider.updateState(newState);
      tankPanel.updateState(newState);
      statusBar.update(newState);
      saveState(newState);

      // Optional notifications
      const notifConfig = vscode.workspace.getConfiguration('pomotank');
      if (notifConfig.get<boolean>('enableNotifications', false)) {
        if (
          newState.tank.hungerLevel > 70 ||
          newState.tank.waterDirtiness > 70 ||
          newState.tank.algaeLevel > 80
        ) {
          vscode.window.showInformationMessage(
            'Pomotank: Your fish need attention! Time for a break?',
          );
        }
      }
    });

    // Register commands
    context.subscriptions.push(
      vscode.commands.registerCommand('pomotank.openTank', () => {
        tankPanel.openOrReveal(context);
      }),
      vscode.commands.registerCommand('pomotank.feedFish', () => {
        engine?.performAction('feedFish');
      }),
      vscode.commands.registerCommand('pomotank.changeWater', () => {
        engine?.performAction('changeWater');
      }),
      vscode.commands.registerCommand('pomotank.cleanAlgae', () => {
        engine?.performAction('cleanAlgae');
      }),
      vscode.commands.registerCommand('pomotank.openStore', () => {
        tankPanel.openOrReveal(context, 'store');
      }),
      vscode.commands.registerCommand('pomotank.debugTick', () => {
        if (engine) {
          for (let i = 0; i < 10; i++) {
            engine.tick();
          }
          vscode.window.showInformationMessage('Pomotank: Applied 10 ticks');
        }
      }),
      vscode.commands.registerCommand('pomotank.debugReset', () => {
        if (engine) {
          const fresh = createInitialState();
          saveState(fresh);
          // Restart engine with fresh state
          engine.stop();
          engine = new GameEngine(fresh, activityTracker!, sessionMinutes);
          companionProvider.updateState(fresh);
          tankPanel.updateState(fresh);
          statusBar.update(fresh);
          engine.onStateChange((newState) => {
            companionProvider.updateState(newState);
            tankPanel.updateState(newState);
            statusBar.update(newState);
            saveState(newState);
          });
          engine.start();
          vscode.window.showInformationMessage('Pomotank: State reset');
        }
      }),
      vscode.commands.registerCommand('pomotank.debugAddPomo', () => {
        if (engine) {
          const s = engine.getState();
          engine.setState({
            ...s,
            player: {
              ...s.player,
              pomoBalance: s.player.pomoBalance + 100,
              totalPomoEarned: s.player.totalPomoEarned + 100,
            },
          });
          vscode.window.showInformationMessage(
            `Pomotank: +100 pomo (now ${engine.getState().player.pomoBalance})`,
          );
        }
      }),
    );

    // Start game loop
    engine.start();

    // Initial UI update
    statusBar.update(engine.getState());
    console.log('Pomotank: activate() completed successfully');
  } catch (err) {
    console.error('Pomotank: activate() FAILED', err);
    vscode.window.showErrorMessage(`Pomotank activation failed: ${err}`);
  }
}

export function deactivate(): void {
  if (engine) {
    saveState(engine.getState());
    engine.stop();
    engine = null;
  }
  if (activityTracker) {
    activityTracker.dispose();
    activityTracker = null;
  }
}
