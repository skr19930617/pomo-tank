import React from "react";
import { Rect } from "react-konva";

interface LightProps {
  tankLeft: number;
  tankWidth: number;
  lightTop: number;
  lightOn: boolean;
}

export const Light: React.FC<LightProps> = ({
  tankLeft,
  tankWidth,
  lightTop,
  lightOn,
}) => {
  const housingHeight = 6;
  const surfaceHeight = 10;

  return (
    <>
      {/* Light housing (dark bar on top) */}
      <Rect
        x={tankLeft}
        y={lightTop}
        width={tankWidth}
        height={housingHeight}
        fill="#333344"
      />
      {/* Light surface */}
      <Rect
        x={tankLeft + 2}
        y={lightTop + housingHeight}
        width={tankWidth - 4}
        height={surfaceHeight}
        fill={lightOn ? "#eeeedd" : "#555566"}
      />
      {/* Light glow when on */}
      {lightOn && (
        <Rect
          x={tankLeft + 4}
          y={lightTop + housingHeight + surfaceHeight}
          width={tankWidth - 8}
          height={4}
          fill="#ffffcc"
          opacity={0.3}
        />
      )}
    </>
  );
};
