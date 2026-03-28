import React, { useRef, useEffect, useState } from 'react';
import { Group, Rect } from 'react-konva';
import { PixelText } from './PixelText';
import { HUD_HEIGHT } from '../../../shared/types';
import { measureText } from './pixel-font-data';
import { COIN_ICON, COIN_COLOR, FISH_ICON, FISH_COLOR } from './pixel-icons';

interface PomoAnimState {
  amount: number;
  startTime: number;
}

interface HudOverlayProps {
  sceneWidth: number;
  timerSeconds: number;
  timerColor: string;
  isPaused: boolean;
  compact: boolean;
  pomoBalance?: number;
  currentCost?: number;
  maxCost?: number;
  tankHunger?: number;
  waterDirtiness?: number;
  algaeLevel?: number;
  currentStreak?: number;
}

function formatTimer(totalSec: number): string {
  const capped = Math.min(totalSec, 359999); // 99:59:59
  const hrs = Math.floor(capped / 3600);
  const min = Math.floor((capped % 3600) / 60);
  const sec = capped % 60;
  const mm = min.toString().padStart(2, '0');
  const ss = sec.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${hrs}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  sceneWidth,
  timerSeconds,
  timerColor,
  isPaused,
  pomoBalance,
  currentCost,
  maxCost,
}) => {
  // Pomo animation state
  const [pomoAnim, setPomoAnim] = useState<PomoAnimState | null>(null);
  const [animOffset, setAnimOffset] = useState(0);
  const prevBalance = useRef(pomoBalance ?? 0);

  useEffect(() => {
    const cur = pomoBalance ?? 0;
    const prev = prevBalance.current;
    if (cur > prev && prev > 0) {
      setPomoAnim({ amount: cur - prev, startTime: Date.now() });
    }
    prevBalance.current = cur;
  }, [pomoBalance]);

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

  const timerStr = formatTimer(timerSeconds);
  const timerOpacity = isPaused ? 0.35 : 1;

  const balanceStr =
    pomoBalance !== undefined
      ? pomoBalance >= 100000
        ? '99999+'
        : String(pomoBalance)
      : undefined;

  // ── Measure text widths to determine scale ──
  const pad = 4;
  const iconGap = 2;
  const coinIconW = COIN_ICON[0].length;
  const fishIconW = FISH_ICON[0].length;

  const timerW = measureText(timerStr);
  const costStr =
    currentCost !== undefined && maxCost !== undefined ? `${currentCost}/${maxCost}` : '';
  const costW = costStr ? fishIconW + iconGap + measureText(costStr) : 0;
  const coinW = balanceStr !== undefined ? coinIconW + iconGap + measureText(balanceStr) : 0;

  // Total natural width of all 3 groups + padding between them
  const groupGap = 8;
  const totalNatW = timerW + costW + coinW + pad * 2 + groupGap * 2;

  // Scale down if content overflows, otherwise cap at 1
  const hudScale = Math.min(1, sceneWidth / totalNatW);

  // Positions (in scaled coordinates)
  const scaledPad = pad / hudScale;

  // Left: timer
  const timerX = scaledPad;

  // Center: cost (center the cost group horizontally)
  const costX = costW > 0 ? (sceneWidth / hudScale - costW) / 2 : 0;

  // Right: coin + balance (right-aligned)
  const coinX = coinW > 0 ? sceneWidth / hudScale - coinW - scaledPad : 0;

  // ── Build icon rects ──
  const coinRects: React.ReactElement[] = [];
  for (let r = 0; r < COIN_ICON.length; r++) {
    for (let c = 0; c < COIN_ICON[r].length; c++) {
      if (COIN_ICON[r][c] === 1) {
        coinRects.push(
          <Rect key={`coin-${r}-${c}`} x={c} y={r} width={1} height={1} fill={COIN_COLOR} />,
        );
      }
    }
  }

  const costElements: React.ReactElement[] = [];
  if (costStr && currentCost !== undefined && maxCost !== undefined) {
    const costRatio = maxCost > 0 ? currentCost / maxCost : 0;
    const costColor = costRatio >= 1 ? '#ff4444' : costRatio >= 0.8 ? '#ffcc44' : '#ffffff';

    for (let r = 0; r < FISH_ICON.length; r++) {
      for (let c = 0; c < FISH_ICON[r].length; c++) {
        if (FISH_ICON[r][c] === 1) {
          costElements.push(
            <Rect
              key={`fi-${r}-${c}`}
              x={costX + c}
              y={4 + r}
              width={1}
              height={1}
              fill={FISH_COLOR}
            />,
          );
        }
      }
    }
    costElements.push(
      <PixelText
        key="cost"
        text={costStr}
        x={costX + fishIconW + iconGap}
        y={4}
        color={costColor}
      />,
    );
  }

  return (
    <Group>
      {/* Semi-transparent background bar */}
      <Rect x={0} y={0} width={sceneWidth} height={HUD_HEIGHT} fill="#1a1a2a" />

      {/* Scaled content group */}
      <Group scaleX={hudScale} scaleY={hudScale}>
        {/* Left: Timer */}
        <PixelText text={timerStr} x={timerX} y={4} color={timerColor} opacity={timerOpacity} />

        {/* Center: Cost capacity */}
        {costElements}

        {/* Right: Coin + Balance */}
        {balanceStr !== undefined && (
          <Group x={coinX} y={4}>
            <Group>{coinRects}</Group>
            <PixelText text={balanceStr} x={coinIconW + iconGap} y={0} color={COIN_COLOR} />
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
    </Group>
  );
};
