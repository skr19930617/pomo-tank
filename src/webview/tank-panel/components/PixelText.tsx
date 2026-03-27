import React from 'react';
import { Group, Rect } from 'react-konva';
import { PIXEL_FONT, CHAR_WIDTH, CHAR_HEIGHT, CHAR_GAP } from './pixel-font-data';

interface PixelTextProps {
  text: string;
  x: number;
  y: number;
  color?: string;
  opacity?: number;
  scale?: number;
}

export const PixelText: React.FC<PixelTextProps> = ({
  text,
  x,
  y,
  color = '#ffffff',
  opacity = 1,
  scale = 1,
}) => {
  const rects: React.ReactElement[] = [];
  let cursorX = 0;

  for (let ci = 0; ci < text.length; ci++) {
    const ch = text[ci];
    const bitmap = PIXEL_FONT[ch];
    if (!bitmap) {
      cursorX += CHAR_WIDTH + CHAR_GAP;
      continue;
    }
    for (let row = 0; row < CHAR_HEIGHT; row++) {
      for (let col = 0; col < CHAR_WIDTH; col++) {
        if (bitmap[row][col] === 1) {
          rects.push(
            <Rect
              key={`${ci}-${row}-${col}`}
              x={(cursorX + col) * scale}
              y={row * scale}
              width={scale}
              height={scale}
              fill={color}
            />,
          );
        }
      }
    }
    cursorX += CHAR_WIDTH + CHAR_GAP;
  }

  return (
    <Group x={x} y={y} opacity={opacity}>
      {rects}
    </Group>
  );
};
