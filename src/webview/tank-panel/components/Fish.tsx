import React, { useEffect, useRef } from 'react';
import { Group, Sprite, Rect, Text } from 'react-konva';
import Konva from 'konva';
import { HealthState } from '../../../shared/types';
import type { GenusId } from '../../../shared/types';
import { SPRITE_FRAMES, SPRITE_FRAME_RATE, SPRITE_WIDTH } from './sprite-sheet-utils';
import type { SpriteImageMap } from '../hooks/useSpriteLoader';

interface FishProps {
  x: number;
  y: number;
  dx: number;
  genusId: GenusId;
  speciesId: string;
  healthState: HealthState;
  tankHunger: number;
  frameCount: number;
  displaySize: number;
  spriteImages: SpriteImageMap;
  feedingActive: boolean;
  hasFeedingAnim: boolean;
  onClick?: () => void;
}

export const FishSprite: React.FC<FishProps> = ({
  x,
  y,
  dx,
  genusId,
  speciesId,
  healthState,
  tankHunger,
  frameCount,
  displaySize,
  spriteImages,
  feedingActive,
  hasFeedingAnim,
  onClick,
}) => {
  const spriteRef = useRef<Konva.Sprite>(null);
  const isDead = healthState === HealthState.Dead;
  const isSick = healthState === HealthState.Sick;
  const isWeak = healthState === HealthState.Warning || isSick;
  const facingLeft = dx < 0;
  const alpha = isDead ? 0.4 : 1;

  // Determine which animation state to use
  let animState: 'swim' | 'weak' | 'feeding' = 'swim';
  if (isDead || isWeak) {
    animState = 'weak';
  }
  if (feedingActive && hasFeedingAnim && !isDead) {
    animState = 'feeding';
  }

  // Get the sprite image for current state
  const variantImages = spriteImages[genusId]?.[speciesId];
  const spriteImage = variantImages?.[animState] ?? variantImages?.['swim'] ?? null;

  // Build animations object with available states
  const animations: Record<string, number[]> = {};
  if (variantImages) {
    for (const state of ['swim', 'weak', 'feeding'] as const) {
      if (variantImages[state]) {
        animations[state] = SPRITE_FRAMES;
      }
    }
  }
  // Fallback: if requested animState not available, use swim
  if (!animations[animState]) {
    animState = 'swim';
  }

  const scale = displaySize / SPRITE_WIDTH;
  const halfSize = displaySize / 2;

  // Start/stop sprite animation
  useEffect(() => {
    const node = spriteRef.current;
    if (!node || !spriteImage) return;
    if (isDead) {
      // Freeze on last frame
      node.stop();
      node.frameIndex(11);
    } else {
      node.start();
    }
  }, [isDead, spriteImage, animState]);

  // Speech bubble for hungry/sick fish
  const showBubble = !isDead && (tankHunger > 70 || isSick) && frameCount % 120 < 80;
  const bubbleText = isSick ? '...' : '!';
  const scaleX = facingLeft ? -1 : 1;

  if (!spriteImage || Object.keys(animations).length === 0) {
    // Fallback: simple colored rectangle if no sprite loaded
    return (
      <Group x={x} y={y} scaleX={scaleX} opacity={alpha}>
        <Rect
          x={-halfSize / 2}
          y={-halfSize / 4}
          width={halfSize}
          height={halfSize / 2}
          fill="#888888"
          cornerRadius={2}
        />
      </Group>
    );
  }

  return (
    <Group x={x} y={y} opacity={alpha} onClick={onClick} onTap={onClick}>
      <Group scaleX={scaleX} offsetX={halfSize} offsetY={halfSize}>
        <Sprite
          ref={spriteRef}
          image={spriteImage}
          animations={animations}
          animation={animState}
          frameRate={SPRITE_FRAME_RATE}
          scaleX={scale}
          scaleY={scale}
        />
      </Group>

      {/* Speech bubble */}
      {showBubble && (
        <Group x={0} y={-halfSize - 8}>
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
