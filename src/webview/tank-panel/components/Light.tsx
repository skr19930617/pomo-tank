import React from 'react';
import { Rect, Line } from 'react-konva';

interface LightProps {
  tankLeft: number;
  tankWidth: number;
  lightTop: number;
  lightOn: boolean;
  lightGap: number;
}

export const Light: React.FC<LightProps> = ({ tankLeft, tankWidth, lightTop, lightOn }) => {
  const housingHeight = 6;
  const surfaceHeight = 10;

  // Wire positions: ~20% and ~80% of tank width
  const wireX1 = tankLeft + tankWidth * 0.2;
  const wireX2 = tankLeft + tankWidth * 0.8;
  const wireTopY = lightTop - 200; // far above (clipped by scene)

  return (
    <>
      {/* Suspension wires */}
      <Line
        points={[wireX1, wireTopY, wireX1, lightTop]}
        stroke="#667788"
        strokeWidth={2}
        opacity={0.7}
      />
      <Line
        points={[wireX2, wireTopY, wireX2, lightTop]}
        stroke="#667788"
        strokeWidth={2}
        opacity={0.7}
      />

      {/* Light housing (dark bar on top) */}
      <Rect x={tankLeft} y={lightTop} width={tankWidth} height={housingHeight} fill="#333344" />
      {/* Light surface */}
      <Rect
        x={tankLeft + 2}
        y={lightTop + housingHeight}
        width={tankWidth - 4}
        height={surfaceHeight}
        fill={lightOn ? '#eeeedd' : '#555566'}
      />
    </>
  );
};
