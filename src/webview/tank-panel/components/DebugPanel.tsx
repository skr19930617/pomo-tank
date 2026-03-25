import React, { useState, useEffect, useRef } from 'react';

interface DebugPanelProps {
  pomoBalance: number;
  onSetPomo: (amount: number) => void;
  onResetState: () => void;
}

const panelStyle: React.CSSProperties = {
  border: '2px solid #ff6633',
  borderRadius: '4px',
  padding: '6px 8px',
  margin: '4px',
  background: '#2a1a10',
  fontSize: '11px',
  color: '#ffcc88',
};

const labelStyle: React.CSSProperties = {
  fontWeight: 'bold',
  color: '#ff6633',
  marginBottom: '4px',
  fontSize: '10px',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  marginBottom: '4px',
};

const inputStyle: React.CSSProperties = {
  width: '60px',
  padding: '2px 4px',
  fontSize: '11px',
  border: '1px solid #664422',
  borderRadius: '2px',
  background: '#1a0f08',
  color: '#ffcc88',
};

const buttonStyle: React.CSSProperties = {
  padding: '2px 8px',
  fontSize: '10px',
  cursor: 'pointer',
  border: '1px solid #664422',
  borderRadius: '2px',
  background: '#3a2210',
  color: '#ffcc88',
};

const dangerButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: '1px solid #cc3322',
  color: '#ff6644',
};

export const DebugPanel: React.FC<DebugPanelProps> = ({ pomoBalance, onSetPomo, onResetState }) => {
  const [pomoInput, setPomoInput] = useState(String(pomoBalance));
  const [confirmingReset, setConfirmingReset] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync input when external balance changes
  useEffect(() => {
    setPomoInput(String(pomoBalance));
  }, [pomoBalance]);

  // Auto-dismiss confirmation after 3 seconds
  useEffect(() => {
    if (confirmingReset) {
      confirmTimer.current = setTimeout(() => {
        setConfirmingReset(false);
      }, 3000);
      return () => {
        if (confirmTimer.current) clearTimeout(confirmTimer.current);
      };
    }
  }, [confirmingReset]);

  const handleSetPomo = () => {
    const val = parseInt(pomoInput, 10);
    if (!isNaN(val)) {
      onSetPomo(Math.max(0, val));
    }
  };

  const handleResetClick = () => {
    if (confirmingReset) {
      setConfirmingReset(false);
      onResetState();
    } else {
      setConfirmingReset(true);
    }
  };

  return (
    <div style={panelStyle}>
      <div style={labelStyle}>DEBUG MODE</div>
      <div style={rowStyle}>
        <span>Pomo:</span>
        <input
          type="number"
          value={pomoInput}
          onChange={(e) => setPomoInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSetPomo()}
          style={inputStyle}
          min={0}
        />
        <button style={buttonStyle} onClick={handleSetPomo}>
          Set
        </button>
      </div>
      <div style={rowStyle}>
        <button
          style={confirmingReset ? dangerButtonStyle : buttonStyle}
          onClick={handleResetClick}
        >
          {confirmingReset ? 'Confirm Reset?' : 'Reset State'}
        </button>
        {confirmingReset && (
          <button style={buttonStyle} onClick={() => setConfirmingReset(false)}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
