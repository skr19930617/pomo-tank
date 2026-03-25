import React, { useState, useCallback } from 'react';
import { Group, Rect } from 'react-konva';

interface PixelButtonProps {
  x: number;
  y: number;
  /** 2D bitmap array for the icon (e.g. 8×8). 1 = filled pixel. */
  icon: number[][];
  /** Overall button size in logical pixels. */
  size: number;
  color: string;
  activeColor: string;
  iconColor?: string;
  disabled?: boolean;
  /** If true, button is currently in active/feedback state. */
  isActive?: boolean;
  onClick?: () => void;
}

export const PixelButton: React.FC<PixelButtonProps> = ({
  x,
  y,
  icon,
  size,
  color,
  activeColor,
  iconColor = '#ffffff',
  disabled = false,
  isActive = false,
  onClick,
}) => {
  const [pressed, setPressed] = useState(false);

  const handleClick = useCallback(() => {
    if (!disabled && onClick) {
      onClick();
    }
  }, [disabled, onClick]);

  const bg = disabled ? '#333340' : isActive || pressed ? activeColor : color;
  const fgColor = disabled ? '#555566' : iconColor;

  const iconH = icon.length;
  const iconW = iconH > 0 ? icon[0].length : 0;
  const offsetX = Math.floor((size - iconW) / 2);
  const offsetY = Math.floor((size - iconH) / 2);

  const rects: React.ReactElement[] = [];
  for (let row = 0; row < iconH; row++) {
    for (let col = 0; col < iconW; col++) {
      if (icon[row][col] === 1) {
        rects.push(
          <Rect
            key={`${row}-${col}`}
            x={offsetX + col}
            y={offsetY + row}
            width={1}
            height={1}
            fill={fgColor}
          />,
        );
      }
    }
  }

  return (
    <Group
      x={x}
      y={y}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={handleClick}
      onTap={handleClick}
    >
      {/* Background */}
      <Rect x={0} y={0} width={size} height={size} fill={bg} cornerRadius={1} />
      {/* Border */}
      <Rect
        x={0}
        y={0}
        width={size}
        height={size}
        stroke={disabled ? '#444450' : '#666688'}
        strokeWidth={0.5}
        cornerRadius={1}
        listening={false}
      />
      {/* Icon pixels */}
      {rects}
    </Group>
  );
};
