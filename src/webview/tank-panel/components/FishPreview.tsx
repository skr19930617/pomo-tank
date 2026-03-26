import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';

// Sprite sheet layout: 6 columns × 2 rows = 12 frames, 64×64 per frame
const SPRITE_COLS = 6;
const FRAME_SIZE = 64;
const TOTAL_FRAMES = 12;
const SHEET_WIDTH = SPRITE_COLS * FRAME_SIZE; // 384
const SHEET_HEIGHT = 2 * FRAME_SIZE; // 128
const FPS = 8;

/** Display size for the preview (half a sprite frame) */
const PREVIEW_SIZE = 32;

interface FishPreviewProps {
  spriteUri: string | undefined;
}

export const FishPreview: React.FC<FishPreviewProps> = ({ spriteUri }) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % TOTAL_FRAMES);
    }, 1000 / FPS);
    return () => clearInterval(id);
  }, []);

  if (!spriteUri) return null;

  const scale = PREVIEW_SIZE / FRAME_SIZE;
  const col = frame % SPRITE_COLS;
  const row = Math.floor(frame / SPRITE_COLS);
  const bgX = -(col * FRAME_SIZE * scale);
  const bgY = -(row * FRAME_SIZE * scale);

  return (
    <Box
      sx={{
        width: PREVIEW_SIZE,
        height: PREVIEW_SIZE,
        backgroundImage: `url(${spriteUri})`,
        backgroundSize: `${SHEET_WIDTH * scale}px ${SHEET_HEIGHT * scale}px`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        display: 'inline-block',
        verticalAlign: 'middle',
        mr: '6px',
        flexShrink: 0,
      }}
    />
  );
};
