import React, { useRef, useEffect, useState } from 'react';
import { Group, Rect } from 'react-konva';
import { PixelText } from './PixelText';
import { HUD_HEIGHT } from '../../../shared/types';
import { measureText } from './pixel-font-data';

interface PomoAnimState {
  amount: number;
  startTime: number;
}

interface HudOverlayProps {
  sceneWidth: number;
  timerSeconds: number;
  isOvertime: boolean;
  isPaused: boolean;
  compact: boolean;
  // Coin display
  pomoBalance?: number;
  // Cost capacity display
  currentCost?: number;
  maxCost?: number;
  // Non-compact stats (full panel)
  tankHunger?: number;
  waterDirtiness?: number;
  algaeLevel?: number;
  currentStreak?: number;
}

function formatTimer(totalSec: number): string {
  const capped = Math.min(totalSec, 5999); // 99:59
  const min = Math.floor(capped / 60);
  const sec = capped % 60;
  const str = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  return totalSec > 5999 ? '99:59+' : str;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  sceneWidth,
  timerSeconds,
  isOvertime,
  isPaused,
  compact,
  pomoBalance,
  currentCost,
  maxCost,
  tankHunger,
  waterDirtiness,
  algaeLevel,
  currentStreak,
}) => {
  // Pomo animation state
  const [pomoAnim, setPomoAnim] = useState<PomoAnimState | null>(null);
  const [animOffset, setAnimOffset] = useState(0);
  const prevBalance = useRef(pomoBalance ?? 0);

  // Detect pomo balance increase → trigger animation
  useEffect(() => {
    const cur = pomoBalance ?? 0;
    const prev = prevBalance.current;
    if (cur > prev && prev > 0) {
      setPomoAnim({ amount: cur - prev, startTime: Date.now() });
    }
    prevBalance.current = cur;
  }, [pomoBalance]);

  // Animate pomo gain text
  useEffect(() => {
    if (!pomoAnim) return;
    let rafId: number;
    const run = () => {
      const elapsed = Date.now() - pomoAnim.startTime;
      if (elapsed > 1000) {
        setPomoAnim(null);
        setAnimOffset(0);
        return;
      }
      setAnimOffset((elapsed / 1000) * 20);
      rafId = requestAnimationFrame(run);
    };
    rafId = requestAnimationFrame(run);
    return () => cancelAnimationFrame(rafId);
  }, [pomoAnim]);

  // When paused, dim the timer text to indicate pause state

  const timerStr = formatTimer(timerSeconds);
  const timerColor = isOvertime ? '#ff4444' : '#ffffff';
  const timerOpacity = isPaused ? 0.35 : 1;

  // Coin display
  const balanceStr =
    pomoBalance !== undefined ? (pomoBalance >= 10000 ? '9999+' : String(pomoBalance)) : undefined;

  // Coin icon: 7×7 circle with P
  // prettier-ignore
  const coinIcon = [
    [0,0,1,1,1,0,0],
    [0,1,1,1,1,1,0],
    [1,1,1,1,0,1,1],
    [1,1,1,1,1,1,1],
    [1,1,1,1,0,1,1],
    [0,1,1,1,1,1,0],
    [0,0,1,1,1,0,0],
  ];

  const coinRects: React.ReactElement[] = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (coinIcon[r][c] === 1) {
        coinRects.push(
          <Rect key={`coin-${r}-${c}`} x={c} y={r} width={1} height={1} fill="#ffcc00" />,
        );
      }
    }
  }

  // Right side: coin + balance position
  const coinWidth = balanceStr !== undefined ? 7 + 2 + measureText(balanceStr) : 0;
  const coinX = sceneWidth - coinWidth - 4;

  // Fish icon for cost display (7×5 mini fish)
  // prettier-ignore
  const fishIcon = [
    [0,0,1,0,0,0,0],
    [1,0,0,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,0,0,1,1,1,0],
    [0,0,1,0,0,0,0],
  ];

  // Cost capacity display
  const costElements: React.ReactElement[] = [];
  const fishIconW = 7 + 2; // icon width + gap
  if (currentCost !== undefined && maxCost !== undefined) {
    const timerW = measureText(timerStr);
    const costX = 4 + timerW + 8;
    const costStr = `${currentCost}/${maxCost}`;
    const costRatio = maxCost > 0 ? currentCost / maxCost : 0;
    const costColor = costRatio >= 1 ? '#ff4444' : costRatio >= 0.8 ? '#ffcc44' : '#ffffff';

    // Fish icon
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 7; c++) {
        if (fishIcon[r][c] === 1) {
          costElements.push(
            <Rect
              key={`fi-${r}-${c}`}
              x={costX + c}
              y={5 + r}
              width={1}
              height={1}
              fill="#44ddff"
            />,
          );
        }
      }
    }

    // Cost text after icon
    costElements.push(
      <PixelText key="cost" text={costStr} x={costX + fishIconW} y={4} color={costColor} />,
    );
  }

  // Non-compact stats
  const statsElements: React.ReactElement[] = [];
  if (!compact && tankHunger !== undefined) {
    const timerW = measureText(timerStr);
    const costStr =
      currentCost !== undefined && maxCost !== undefined ? `${currentCost}/${maxCost}` : '';
    const costW = costStr ? fishIconW + measureText(costStr) + 4 : 0;
    let sx = 4 + timerW + 8 + costW;
    const labels = [
      `H:${Math.round(tankHunger)}%`,
      `W:${Math.round(waterDirtiness ?? 0)}%`,
      `A:${Math.round(algaeLevel ?? 0)}%`,
      `S:${currentStreak ?? 0}`,
    ];
    for (let i = 0; i < labels.length; i++) {
      if (sx + measureText(labels[i]) + 4 > coinX - 2) break;
      statsElements.push(
        <PixelText key={`stat-${i}`} text={labels[i]} x={sx} y={4} color="#aaaacc" />,
      );
      sx += measureText(labels[i]) + 4;
    }
  }

  return (
    <Group>
      {/* Semi-transparent background bar */}
      <Rect x={0} y={0} width={sceneWidth} height={HUD_HEIGHT} fill="rgba(0,0,0,0.55)" />

      {/* Timer (left) */}
      <PixelText text={timerStr} x={4} y={4} color={timerColor} opacity={timerOpacity} />

      {/* Cost capacity */}
      {costElements}

      {/* Non-compact stats */}
      {statsElements}

      {/* Coin + Balance (right) */}
      {balanceStr !== undefined && (
        <Group x={coinX} y={4}>
          <Group>{coinRects}</Group>
          <PixelText text={balanceStr} x={9} y={0} color="#ffcc00" />
        </Group>
      )}

      {/* Pomo gain animation */}
      {pomoAnim && balanceStr !== undefined && (
        <PixelText
          text={`+${pomoAnim.amount}`}
          x={coinX + 4}
          y={4 - animOffset}
          color="#44ff44"
          opacity={1 - animOffset / 20}
        />
      )}
    </Group>
  );
};
