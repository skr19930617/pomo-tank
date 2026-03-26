import React, { useState } from 'react';
import type { UserSettings } from '../../../shared/types';
import { FOCUS_MIN, FOCUS_MAX, BREAK_MIN, BREAK_MAX } from '../../../shared/types';

interface SettingsPanelProps {
  settings: UserSettings;
  onUpdateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 8px',
  cursor: 'pointer',
  background: '#2a2a40',
  borderRadius: '4px',
  color: '#aabbcc',
  fontSize: '11px',
  userSelect: 'none',
  border: '1px solid #333355',
};

const bodyStyle: React.CSSProperties = {
  padding: '8px',
  background: '#222238',
  borderRadius: '0 0 4px 4px',
  borderTop: 'none',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '4px 0',
  fontSize: '11px',
  color: '#ccccdd',
};

const inputStyle: React.CSSProperties = {
  width: '50px',
  padding: '2px 4px',
  background: '#1a1a2e',
  border: '1px solid #444466',
  borderRadius: '3px',
  color: '#eeeeff',
  fontSize: '11px',
  textAlign: 'center',
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdateSetting }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ margin: '4px 0' }}>
      <div style={headerStyle} onClick={() => setExpanded((e) => !e)}>
        <span>Settings</span>
        <span>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div style={bodyStyle}>
          <div style={rowStyle}>
            <label>Focus (min)</label>
            <input
              type="number"
              style={inputStyle}
              value={settings.focusMinutes}
              min={FOCUS_MIN}
              max={FOCUS_MAX}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                  onUpdateSetting('focusMinutes', Math.max(FOCUS_MIN, Math.min(FOCUS_MAX, val)));
                }
              }}
            />
          </div>
          <div style={rowStyle}>
            <label>Break (min)</label>
            <input
              type="number"
              style={inputStyle}
              value={settings.breakMinutes}
              min={BREAK_MIN}
              max={BREAK_MAX}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                  onUpdateSetting('breakMinutes', Math.max(BREAK_MIN, Math.min(BREAK_MAX, val)));
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
