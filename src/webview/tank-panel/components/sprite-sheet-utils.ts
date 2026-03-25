// Sprite sheet constants and helpers for Konva Sprite component

export const SPRITE_WIDTH = 64;
export const SPRITE_HEIGHT = 64;
export const SPRITE_COLS = 6;
export const SPRITE_ROWS = 2;
export const SPRITE_FRAME_COUNT = SPRITE_COLS * SPRITE_ROWS; // 12
export const SPRITE_FRAME_RATE = 8;

/**
 * Build Konva Sprite `animations` format: flat array of [x, y, w, h] per frame.
 * Returns a single animation sequence for a 6x2 grid, 64x64 per frame.
 */
export function buildFrameArray(): number[] {
  const frames: number[] = [];
  for (let row = 0; row < SPRITE_ROWS; row++) {
    for (let col = 0; col < SPRITE_COLS; col++) {
      frames.push(col * SPRITE_WIDTH, row * SPRITE_HEIGHT, SPRITE_WIDTH, SPRITE_HEIGHT);
    }
  }
  return frames;
}

// Precomputed frame array (shared across all sprites)
export const SPRITE_FRAMES = buildFrameArray();
