import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Group } from 'react-konva';
import type { WebviewToExtensionMessage } from '../../../shared/messages';
import { DESK_HEIGHT } from '../../../shared/types';
import { PixelButton } from './PixelButton';

// ── Icon bitmaps (8×8) ──

// prettier-ignore
const ICON_FEED: number[][] = [
  [0,0,0,1,1,0,0,0],
  [0,0,1,1,1,1,0,0],
  [0,1,0,0,0,0,1,0],
  [1,1,0,1,0,0,1,0],
  [1,1,0,0,0,1,0,0],
  [0,1,1,0,1,0,0,0],
  [0,0,1,1,1,1,0,0],
  [0,0,0,0,1,0,0,0],
];

// prettier-ignore
const ICON_WATER: number[][] = [
  [0,0,0,1,0,0,0,0],
  [0,0,1,1,1,0,0,0],
  [0,0,1,1,1,0,0,0],
  [0,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,0,0],
  [1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,0],
  [0,1,1,1,1,1,0,0],
];

// prettier-ignore
const ICON_ALGAE: number[][] = [
  [0,0,0,1,0,0,0,0],
  [0,0,1,1,1,0,0,0],
  [0,1,0,1,0,1,0,0],
  [1,0,0,1,0,0,1,0],
  [0,1,0,1,0,1,0,0],
  [0,0,1,1,1,0,0,0],
  [0,0,0,1,0,0,0,0],
  [0,0,1,1,1,0,0,0],
];

// prettier-ignore
const ICON_LIGHT: number[][] = [
  [0,0,0,1,0,0,0,0],
  [0,1,0,1,0,1,0,0],
  [0,0,1,1,1,0,0,0],
  [0,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,0,0],
  [0,0,1,1,1,0,0,0],
  [0,0,1,1,1,0,0,0],
  [0,0,0,1,0,0,0,0],
];

// prettier-ignore
const ICON_EXPAND: number[][] = [
  [1,1,1,0,0,0,0,0],
  [1,0,0,0,0,0,0,0],
  [1,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0],
  [0,0,0,0,0,0,0,1],
  [0,0,0,0,0,1,1,1],
];

interface ActionButtonDef {
  id: string;
  icon: number[][];
  color: string;
  activeColor: string;
  msgType?: WebviewToExtensionMessage['type'];
}

const ACTION_BUTTONS: ActionButtonDef[] = [
  { id: 'feed', icon: ICON_FEED, color: '#2a4a2a', activeColor: '#44aa44', msgType: 'feedFish' },
  {
    id: 'water',
    icon: ICON_WATER,
    color: '#2a2a4a',
    activeColor: '#4488cc',
    msgType: 'changeWater',
  },
  {
    id: 'algae',
    icon: ICON_ALGAE,
    color: '#2a4a3a',
    activeColor: '#44cc66',
    msgType: 'cleanAlgae',
  },
  {
    id: 'light',
    icon: ICON_LIGHT,
    color: '#4a4a2a',
    activeColor: '#cccc44',
    msgType: 'toggleLight',
  },
];

const EXPAND_BUTTON: ActionButtonDef = {
  id: 'expand',
  icon: ICON_EXPAND,
  color: '#3a3a4a',
  activeColor: '#8888cc',
};

const BUTTON_SIZE = 14;

// Thresholds below which action is not needed
const LOW_THRESHOLD = 10;

interface ActionBarProps {
  sceneWidth: number;
  sceneHeight: number;
  sendMessage: (msg: WebviewToExtensionMessage) => void;
  lightOn: boolean;
  showExpand: boolean;
  onExpandClick?: () => void;
  avgHunger?: number;
  waterDirtiness?: number;
  algaeLevel?: number;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  sceneWidth,
  sceneHeight,
  sendMessage,
  lightOn,
  showExpand,
  onExpandClick,
  avgHunger = 0,
  waterDirtiness = 0,
  algaeLevel = 0,
}) => {
  // Feedback state: buttonId → timestamp when feedback started
  const [feedback, setFeedback] = useState<Record<string, number>>({});
  const lastActionRef = useRef<string | null>(null);

  // Listen for actionResult messages to trigger feedback
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === 'actionResult' && msg.success && lastActionRef.current) {
        setFeedback((prev) => ({ ...prev, [lastActionRef.current!]: Date.now() }));
        lastActionRef.current = null;
      }
      if (msg.type === 'lightToggleResult' && msg.success) {
        setFeedback((prev) => ({ ...prev, light: Date.now() }));
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Clear expired feedback (>500ms)
  useEffect(() => {
    const ids = Object.entries(feedback).filter(([, ts]) => Date.now() - ts < 500);
    if (ids.length === Object.keys(feedback).length) return;
    const timer = setTimeout(() => {
      setFeedback((prev) => {
        const next: Record<string, number> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (Date.now() - v < 500) next[k] = v;
        }
        return next;
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleAction = useCallback(
    (buttonId: string, msgType: WebviewToExtensionMessage['type']) => {
      lastActionRef.current = buttonId;
      sendMessage({ type: msgType } as WebviewToExtensionMessage);
    },
    [sendMessage],
  );

  const buttons = showExpand ? [...ACTION_BUTTONS, EXPAND_BUTTON] : ACTION_BUTTONS;
  const gap = 2;
  // Shrink buttons to fit when scene is narrow
  const maxBtnSize = Math.floor((sceneWidth - gap * (buttons.length - 1) - 4) / buttons.length);
  const btnSize = Math.max(Math.min(BUTTON_SIZE, maxBtnSize), 8);
  const totalWidth = buttons.length * btnSize + (buttons.length - 1) * gap;
  const startX = (sceneWidth - totalWidth) / 2;
  const barY = sceneHeight - DESK_HEIGHT + Math.floor((DESK_HEIGHT - btnSize) / 2);

  // Determine disabled state per button
  const isDisabled = (id: string): boolean => {
    if (!lightOn && id !== 'light') return true;
    if (id === 'feed') return avgHunger < LOW_THRESHOLD;
    if (id === 'water') return waterDirtiness < LOW_THRESHOLD;
    if (id === 'algae') return algaeLevel < LOW_THRESHOLD;
    return false;
  };

  return (
    <Group>
      {buttons.map((btn, i) => {
        const bx = startX + i * (btnSize + gap);
        const isActive = feedback[btn.id] !== undefined;

        return (
          <PixelButton
            key={btn.id}
            x={bx}
            y={barY}
            icon={btn.icon}
            size={btnSize}
            color={btn.color}
            activeColor={btn.activeColor}
            disabled={isDisabled(btn.id)}
            isActive={isActive}
            onClick={() => {
              if (btn.id === 'expand') {
                onExpandClick?.();
              } else if (btn.msgType) {
                handleAction(btn.id, btn.msgType);
              }
            }}
          />
        );
      })}
    </Group>
  );
};
