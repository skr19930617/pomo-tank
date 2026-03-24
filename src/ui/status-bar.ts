import * as vscode from "vscode";
import type { GameState } from "../game/state";
import { HealthState } from "../game/state";

export class StatusBarManager implements vscode.Disposable {
  private item: vscode.StatusBarItem;

  constructor(_engine: { getState(): GameState }) {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );
    this.item.command = "pomotank.openTank";
    this.item.show();
  }

  update(state: GameState): void {
    const config = vscode.workspace.getConfiguration("pomotank");
    if (!config.get<boolean>("showStatusBar", true)) {
      this.item.hide();
      return;
    }

    const hunger = this.getAvgHunger(state);
    const dirtiness = state.tank.waterDirtiness;
    const algae = state.tank.algaeLevel;
    const worstHealth = this.getWorstHealth(state);

    const icon = this.getStateIcon(hunger, dirtiness, algae, worstHealth);
    this.item.text = `$(beaker) ${icon}`;

    const livingFish = state.fish.filter(
      (f) => f.healthState !== HealthState.Dead,
    );
    const fishSummary = livingFish
      .map((f) => `${f.speciesId}: ${f.healthState}`)
      .join(", ");

    const timeSince = Date.now() - state.player.sessionStartTime;
    const minutesSince = Math.floor(timeSince / 60000);

    this.item.tooltip = [
      `Pomotank - ${livingFish.length} fish`,
      `Hunger: ${Math.round(hunger)}%`,
      `Water: ${Math.round(dirtiness)}%`,
      `Algae: ${Math.round(algae)}%`,
      `Fish: ${fishSummary || "none"}`,
      `Pomo: ${state.player.pomoBalance}`,
      `Streak: ${state.player.currentStreak}`,
      `Session: ${minutesSince}min`,
    ].join("\n");

    this.item.show();
  }

  private getAvgHunger(state: GameState): number {
    const living = state.fish.filter(
      (f) => f.healthState !== HealthState.Dead,
    );
    if (living.length === 0) return 0;
    return living.reduce((sum, f) => sum + f.hungerLevel, 0) / living.length;
  }

  private getWorstHealth(state: GameState): HealthState {
    const order = [
      HealthState.Healthy,
      HealthState.Warning,
      HealthState.Sick,
      HealthState.Dead,
    ];
    let worst = 0;
    for (const fish of state.fish) {
      const idx = order.indexOf(fish.healthState);
      if (idx > worst) worst = idx;
    }
    return order[worst];
  }

  private getStateIcon(
    hunger: number,
    dirtiness: number,
    algae: number,
    health: HealthState,
  ): string {
    if (health === HealthState.Dead) return "!!";
    if (health === HealthState.Sick) return "!";
    if (hunger > 70 || dirtiness > 70 || algae > 80) return "~";
    if (hunger > 50 || dirtiness > 50 || algae > 60) return ".";
    return "*";
  }

  dispose(): void {
    this.item.dispose();
  }
}
