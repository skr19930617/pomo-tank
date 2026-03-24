import React from 'react';
import { Rect, Line } from 'react-konva';

interface DeskProps {
  sceneWidth: number;
  deskTop: number;
  deskHeight: number;
}

export const Desk: React.FC<DeskProps> = ({ sceneWidth, deskTop, deskHeight }) => {
  const grainLines: number[] = [];
  for (let i = 4; i < deskHeight; i += 6) {
    grainLines.push(i);
  }

  return (
    <>
      {/* Desk surface */}
      <Rect x={0} y={deskTop} width={sceneWidth} height={deskHeight} fill="#6b4226" />
      {/* Desk top edge highlight */}
      <Rect x={0} y={deskTop} width={sceneWidth} height={3} fill="#8b6240" />
      {/* Wood grain lines */}
      {grainLines.map((offset, i) => (
        <Line
          key={`grain-${i}`}
          points={[0, deskTop + offset, sceneWidth, deskTop + offset]}
          stroke="#5a3520"
          strokeWidth={1}
          opacity={0.4}
        />
      ))}
    </>
  );
};
