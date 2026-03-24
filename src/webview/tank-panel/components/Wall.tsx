import React from 'react';
import { Rect, Line } from 'react-konva';

interface WallProps {
  sceneWidth: number;
  sceneHeight: number;
}

const WALL_COLORS = [
  '#2a2a3e',
  '#2c2c40',
  '#2e2e42',
  '#303045',
  '#323248',
  '#34344a',
  '#36364c',
  '#38384e',
];

export const Wall: React.FC<WallProps> = ({ sceneWidth, sceneHeight }) => {
  const stripeHeight = sceneHeight / WALL_COLORS.length;

  return (
    <>
      {WALL_COLORS.map((color, i) => (
        <Rect
          key={`wall-stripe-${i}`}
          x={0}
          y={i * stripeHeight}
          width={sceneWidth}
          height={stripeHeight + 1}
          fill={color}
        />
      ))}
      {/* Decorative shelf line */}
      <Line points={[0, 60, sceneWidth, 60]} stroke="#444460" strokeWidth={2} />
    </>
  );
};
