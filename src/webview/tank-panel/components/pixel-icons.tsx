import React from 'react';

// Pixel icon data shared between HudOverlay (Konva) and Store (HTML DOM)

// prettier-ignore
export const COIN_ICON = [
  [0,0,1,1,1,0,0],
  [0,1,1,1,1,1,0],
  [1,1,1,1,0,1,1],
  [1,1,1,1,1,1,1],
  [1,1,1,1,0,1,1],
  [0,1,1,1,1,1,0],
  [0,0,1,1,1,0,0],
];
export const COIN_COLOR = '#ffcc00';

// prettier-ignore
export const FISH_ICON = [
  [0,0,1,0,0,0,0],
  [1,0,0,1,1,1,0],
  [1,1,1,1,1,1,1],
  [1,0,0,1,1,1,0],
  [0,0,1,0,0,0,0],
];
export const FISH_COLOR = '#44ddff';

/** Build a CSS box-shadow string from a pixel grid. Each pixel = scale px. */
function buildBoxShadow(grid: number[][], color: string, scale: number): string {
  const shadows: string[] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === 1) {
        shadows.push(`${c * scale}px ${r * scale}px 0 ${color}`);
      }
    }
  }
  return shadows.join(',');
}

interface PixelIconProps {
  icon: number[][];
  color: string;
  scale?: number;
}

export const PixelIcon: React.FC<PixelIconProps> = ({ icon, color, scale = 2 }) => {
  const w = icon[0].length;
  const h = icon.length;
  return (
    <div
      style={{
        width: scale,
        height: scale,
        boxShadow: buildBoxShadow(icon, color, scale),
        display: 'inline-block',
        verticalAlign: 'middle',
        marginRight: (w - 1) * scale + 4,
        marginBottom: (h - 1) * scale,
      }}
    />
  );
};
