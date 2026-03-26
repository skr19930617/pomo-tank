import React from 'react';
import { Group, Rect, Text } from 'react-konva';

interface FishTooltipProps {
  x: number;
  y: number;
  speciesName: string;
  customName?: string;
  bodyLengthMm: number;
  ageWeeks: number;
  healthState: string;
  maintenanceQuality: number;
}

function formatAge(weeks: number): string {
  if (weeks < 8) return `${weeks}w`;
  const months = Math.floor(weeks / 4.33);
  return `${months}mo`;
}

function qualityStars(quality: number): string {
  const stars = Math.max(1, Math.min(5, Math.ceil(quality * 5)));
  return '\u2605'.repeat(stars) + '\u2606'.repeat(5 - stars);
}

export const FishTooltip: React.FC<FishTooltipProps> = ({
  x,
  y,
  speciesName,
  customName,
  bodyLengthMm,
  ageWeeks,
  healthState,
  maintenanceQuality,
}) => {
  const w = 90;
  const h = 48;
  const px = Math.max(2, x - w / 2);
  const py = y - h - 12;

  const sizeTxt = `${Math.round(bodyLengthMm)}mm | ${formatAge(ageWeeks)}`;
  const careTxt = `Care ${qualityStars(maintenanceQuality)}`;

  return (
    <Group x={px} y={py}>
      <Rect width={w} height={h} fill="#1a1a2e" cornerRadius={3} opacity={0.95} />
      <Rect x={0.5} y={0.5} width={w - 1} height={h - 1} stroke="#445566" strokeWidth={1} cornerRadius={3} />
      <Text x={4} y={4} width={w - 8} text={customName || speciesName} fontSize={8} fill="#eeeeff" />
      <Text x={4} y={15} width={w - 8} text={sizeTxt} fontSize={7} fill="#aabbcc" />
      <Text x={4} y={25} width={w - 8} text={healthState} fontSize={7} fill={healthState === 'Healthy' ? '#88cc88' : '#cc8888'} />
      <Text x={4} y={35} width={w - 8} text={careTxt} fontSize={7} fill="#ccaa66" />
    </Group>
  );
};
