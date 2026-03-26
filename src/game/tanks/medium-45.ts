import type { TankConfig } from '../../shared/types';

export const medium45: TankConfig = {
  id: 'medium_45',
  displayName: '45cm Tank',
  widthMm: 450,
  heightMm: 300,
  depthMm: 240,
  baseCapacity: 14,
  pomoCost: 100,
  prerequisite: { requiredUnlocks: ['small_30'] },
  description: 'Room to grow. Base capacity: 14.',
  renderWidth: 320,
  renderHeight: 240,
};
