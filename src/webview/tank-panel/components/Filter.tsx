import React from 'react';
import { Rect, Group, Line } from 'react-konva';
import type { FilterId } from '../../../shared/types';
import { getFilter } from '../../../game/filters';

interface FilterProps {
  filterId: FilterId | null;
  tankWidth: number;
  tankHeight: number;
  lightOn: boolean;
}

/**
 * Renders external filter visuals (hang-on-back and canister mount types).
 * Positioned in the tank Group coordinate space.
 */
export const FilterVisual: React.FC<FilterProps> = ({
  filterId,
  tankWidth,
  tankHeight,
  lightOn,
}) => {
  const filter = getFilter(filterId);
  if (!filter || filter.mount === 'internal') return null;

  const { width: fw, height: fh, primaryColor, accentColor } = filter.visual;
  const opacity = lightOn ? 1 : 0.5;

  if (filter.mount === 'hang_on_back') {
    // Hang-on-back: straddles the right tank wall
    const fx = tankWidth - 2;
    const fy = tankHeight * 0.2;
    const aboveRim = fh * 0.4;
    const belowRim = fh * 0.6;

    return (
      <Group opacity={opacity}>
        {/* Main body (above tank rim) */}
        <Rect x={fx} y={fy - aboveRim} width={fw} height={aboveRim} fill={primaryColor} />
        {/* Submerged intake (below rim) */}
        <Rect x={fx + 2} y={fy} width={fw - 4} height={belowRim} fill={accentColor} />
        {/* Rim attachment line */}
        <Line points={[fx, fy, fx + fw, fy]} stroke={primaryColor} strokeWidth={2} />
        {/* Output nozzle (small rect at top) */}
        <Rect x={fx + fw - 4} y={fy - aboveRim - 3} width={4} height={3} fill={accentColor} />
      </Group>
    );
  }

  if (filter.mount === 'canister') {
    // Canister: on desk to the right of tank
    const fx = tankWidth + 6;
    const fy = tankHeight - fh;

    return (
      <Group opacity={opacity}>
        {/* Canister body */}
        <Rect x={fx} y={fy} width={fw} height={fh} fill={primaryColor} cornerRadius={2} />
        {/* Top cap */}
        <Rect x={fx - 1} y={fy} width={fw + 2} height={3} fill={accentColor} />
        {/* Bottom base */}
        <Rect x={fx - 1} y={fy + fh - 3} width={fw + 2} height={3} fill={accentColor} />
        {/* Intake tube (goes up to tank) */}
        <Line
          points={[fx + 3, fy, fx + 3, fy - 10, tankWidth + 1, fy - 10]}
          stroke={accentColor}
          strokeWidth={1.5}
        />
        {/* Output tube */}
        <Line
          points={[fx + fw - 3, fy, fx + fw - 3, fy - 6, tankWidth + 1, fy - 6]}
          stroke={primaryColor}
          strokeWidth={1.5}
        />
      </Group>
    );
  }

  return null;
};
