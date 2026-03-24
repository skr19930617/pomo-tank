import React from 'react';
import type { GameStateSnapshot } from '../../../game/state';

interface StatsBarProps {
  state: GameStateSnapshot;
}

const statStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  margin: '0 4px',
  fontSize: '11px',
  color: '#cccccc',
  background: '#1e1e2e',
  borderRadius: '3px',
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '4px',
  padding: '6px 4px',
  background: '#181825',
};

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export const StatsBar: React.FC<StatsBarProps> = ({ state }) => {
  const avgHunger =
    state.fish.length > 0
      ? Math.round(state.fish.reduce((sum, f) => sum + f.hungerLevel, 0) / state.fish.length)
      : 0;

  return (
    <div style={containerStyle}>
      <span style={statStyle}>Hunger: {avgHunger}%</span>
      <span style={statStyle}>Water: {Math.round(state.tank.waterDirtiness)}%</span>
      <span style={statStyle}>Algae: {Math.round(state.tank.algaeLevel)}%</span>
      <span style={statStyle}>Pomo: {state.player.pomoBalance}</span>
      <span style={statStyle}>Streak: {state.player.currentStreak}</span>
      <span style={statStyle}>
        Timer: {formatTime(state.session.timeSinceLastMaintenance)}
        {!state.lightOn && ' (paused)'}
      </span>
    </div>
  );
};
