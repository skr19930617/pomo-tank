import React from 'react';
import { Group, Circle, Rect } from 'react-konva';
import type { FoodParticle, FoodCan } from '../hooks/useFeedingMode';

// ── Food can pixel art (8×8 bitmap, similar to ActionBar icons) ──
// prettier-ignore
const CAN_BITMAP: number[][] = [
  [0,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1],
];

const CAN_SIZE = 8; // logical px
const CAN_PIXEL = 1; // px per bitmap cell
const CAN_COLOR = '#8B7355';
const CAN_LABEL_COLOR = '#d4a574';

interface FoodOverlayProps {
  particles: FoodParticle[];
  canState: FoodCan | null;
}

export const FoodOverlay: React.FC<FoodOverlayProps> = ({ particles, canState }) => {
  return (
    <Group>
      {/* Food can */}
      {canState && canState.visible && (
        <Group
          x={canState.x}
          y={canState.y}
          rotation={canState.rotation}
          offsetX={CAN_SIZE * CAN_PIXEL / 2}
          offsetY={CAN_SIZE * CAN_PIXEL}
        >
          {CAN_BITMAP.flatMap((row, ry) =>
            row.map((pixel, rx) => {
              if (!pixel) return null;
              // Use label color for inner pattern rows (3,5)
              const isLabel = ry === 3 || ry === 5;
              return (
                <Rect
                  key={`can-${ry}-${rx}`}
                  x={rx * CAN_PIXEL}
                  y={ry * CAN_PIXEL}
                  width={CAN_PIXEL}
                  height={CAN_PIXEL}
                  fill={isLabel ? CAN_LABEL_COLOR : CAN_COLOR}
                />
              );
            }),
          )}
        </Group>
      )}

      {/* Food particles */}
      {particles.map(
        (p) =>
          p.alive && (
            <Circle
              key={`food-${p.id}`}
              x={p.x}
              y={p.y}
              radius={1}
              fill="#d4a574"
              opacity={p.opacity}
            />
          ),
      )}
    </Group>
  );
};
