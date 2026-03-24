import React from "react";
import { Group, Rect, Text } from "react-konva";
import { HealthState } from "../../../shared/types";
import type { FishSpeciesId } from "../../../shared/types";

const FISH_COLORS: Record<FishSpeciesId, string> = {
  guppy: "#ff9944",
  neon_tetra: "#44ddff",
  corydoras: "#aa8855",
  betta: "#dd4488",
  angelfish: "#eedd44",
};

interface FishProps {
  x: number;
  y: number;
  dx: number;
  speciesId: FishSpeciesId;
  healthState: HealthState;
  hungerLevel: number;
  frameCount: number;
}

export const FishSprite: React.FC<FishProps> = ({
  x,
  y,
  dx,
  speciesId,
  healthState,
  hungerLevel,
  frameCount,
}) => {
  const color = FISH_COLORS[speciesId];
  const isDead = healthState === HealthState.Dead;
  const isSick = healthState === HealthState.Sick;
  const facingLeft = dx < 0;
  const alpha = isDead ? 0.4 : 1;

  // Fish body dimensions
  const bodyW = 16;
  const bodyH = 8;
  const tailW = 6;
  const tailH = 8;
  const finW = 4;
  const finH = 5;

  // Tail wag animation
  const wagOffset = Math.sin(frameCount * 0.15) * 2;

  // Speech bubble for hungry/sick fish
  const showBubble =
    !isDead && (hungerLevel > 70 || isSick) && frameCount % 120 < 80;
  const bubbleText = isSick ? "..." : "!";

  // Mirror horizontally when facing left
  const scaleX = facingLeft ? -1 : 1;

  return (
    <Group x={x} y={y} scaleX={scaleX} opacity={alpha}>
      {/* Tail */}
      <Rect
        x={-bodyW / 2 - tailW}
        y={-tailH / 2 + wagOffset}
        width={tailW}
        height={tailH}
        fill={color}
        opacity={0.8}
      />

      {/* Body */}
      <Rect
        x={-bodyW / 2}
        y={-bodyH / 2}
        width={bodyW}
        height={bodyH}
        fill={color}
        cornerRadius={2}
      />

      {/* Dorsal fin */}
      <Rect
        x={-2}
        y={-bodyH / 2 - finH + 1}
        width={finW}
        height={finH}
        fill={color}
        opacity={0.7}
      />

      {/* Belly highlight */}
      <Rect
        x={-bodyW / 2 + 2}
        y={1}
        width={bodyW - 4}
        height={3}
        fill="#ffffff"
        opacity={0.25}
      />

      {/* Eye */}
      <Rect
        x={bodyW / 2 - 4}
        y={-2}
        width={3}
        height={3}
        fill="#ffffff"
      />
      <Rect
        x={bodyW / 2 - 3}
        y={-1}
        width={2}
        height={2}
        fill="#111111"
      />

      {/* Speech bubble */}
      {showBubble && (
        <Group x={0} y={-bodyH / 2 - 14} scaleX={scaleX}>
          <Rect
            x={-8}
            y={-6}
            width={16}
            height={12}
            fill="#ffffff"
            cornerRadius={3}
            opacity={0.9}
          />
          <Text
            x={-8}
            y={-5}
            width={16}
            height={12}
            text={bubbleText}
            fontSize={9}
            fill="#333333"
            align="center"
            verticalAlign="middle"
          />
        </Group>
      )}
    </Group>
  );
};
