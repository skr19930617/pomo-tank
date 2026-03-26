import React from 'react';
import { Rect, Group } from 'react-konva';
import type { FilterId } from '../../../shared/types';
import { getFilter } from '../../../game/filters';

interface TankProps {
  tankLeft: number;
  tankTop: number;
  tankWidth: number;
  tankHeight: number;
  waterDirtiness: number;
  algaeLevel: number;
  lightOn: boolean;
  filterId: FilterId | null;
}

export const Tank: React.FC<TankProps> = ({
  tankLeft,
  tankTop,
  tankWidth,
  tankHeight,
  waterDirtiness,
  algaeLevel,
  lightOn,
  filterId,
}) => {
  const frameThickness = 3;
  const innerLeft = tankLeft + frameThickness;
  const innerTop = tankTop + frameThickness;
  const innerW = tankWidth - frameThickness * 2;
  const innerH = tankHeight - frameThickness * 2;

  // Water color tinted by dirtiness (0-100)
  const dirtFactor = Math.min(waterDirtiness / 100, 1);
  const waterR = Math.round(60 + dirtFactor * 80);
  const waterG = Math.round(140 + dirtFactor * -40);
  const waterB = Math.round(200 + dirtFactor * -60);
  const waterColor = `rgb(${waterR}, ${waterG}, ${waterB})`;

  // Sand strip at bottom
  const sandHeight = 8;

  // Algae strip height
  const algaeFactor = Math.min(algaeLevel / 100, 1);
  const algaeHeight = algaeFactor * 20;

  return (
    <>
      {/* Tank frame (border) */}
      <Rect
        x={tankLeft}
        y={tankTop}
        width={tankWidth}
        height={tankHeight}
        stroke="#88aacc"
        strokeWidth={frameThickness}
        fill="transparent"
      />

      {/* Water fill */}
      <Rect
        x={innerLeft}
        y={innerTop}
        width={innerW}
        height={innerH}
        fill={waterColor}
        opacity={0.85}
      />

      {/* Sand at bottom */}
      <Rect
        x={innerLeft}
        y={innerTop + innerH - sandHeight}
        width={innerW}
        height={sandHeight}
        fill="#c2a868"
      />

      {/* Algae on bottom above sand */}
      {algaeHeight > 0 && (
        <Rect
          x={innerLeft}
          y={innerTop + innerH - sandHeight - algaeHeight}
          width={innerW}
          height={algaeHeight}
          fill="#4a8a3a"
          opacity={0.5}
        />
      )}

      {/* Water shimmer highlights */}
      {lightOn && (
        <>
          <Rect
            x={innerLeft + 8}
            y={innerTop + 4}
            width={innerW * 0.3}
            height={3}
            fill="#ffffff"
            opacity={0.15}
          />
          <Rect
            x={innerLeft + innerW * 0.5}
            y={innerTop + 8}
            width={innerW * 0.2}
            height={2}
            fill="#ffffff"
            opacity={0.1}
          />
        </>
      )}

      {/* Internal filter (sponge) */}
      {(() => {
        const filter = getFilter(filterId);
        if (!filter || filter.mount !== 'internal') return null;
        const { width: fw, height: fh, primaryColor, accentColor } = filter.visual;
        const fx = innerLeft + innerW - fw - 2;
        const fy = innerTop + innerH - sandHeight - fh;
        return (
          <Group opacity={lightOn ? 1 : 0.5}>
            <Rect x={fx} y={fy} width={fw} height={fh} fill={primaryColor} />
            <Rect x={fx + 2} y={fy + 2} width={fw - 4} height={2} fill={accentColor} />
            <Rect x={fx + 2} y={fy + fh - 4} width={fw - 4} height={2} fill={accentColor} />
          </Group>
        );
      })()}

      {/* Glass border overlay */}
      <Rect
        x={tankLeft}
        y={tankTop}
        width={tankWidth}
        height={tankHeight}
        stroke="#aaccee"
        strokeWidth={1}
        fill="transparent"
      />

      {/* Dark overlay when light off */}
      {!lightOn && (
        <Rect
          x={innerLeft}
          y={innerTop}
          width={innerW}
          height={innerH}
          fill="#000022"
          opacity={0.35}
        />
      )}

      {/* Tank shadow on desk */}
      <Rect
        x={tankLeft + 4}
        y={tankTop + tankHeight}
        width={tankWidth - 8}
        height={4}
        fill="#000000"
        opacity={0.15}
      />
    </>
  );
};
