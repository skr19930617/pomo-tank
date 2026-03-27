import type { TankConfig } from '../../shared/types';

export const xl90: TankConfig = {
  id: 'xl_90',
  displayName: '90cm Tank',
  widthMm: 900,
  heightMm: 450,
  depthMm: 350,
  baseCapacity: 32,
  pomoCost: 500,
  prerequisite: { requiredUnlocks: ['large_60'] },
  description: 'The ultimate tank. Base capacity: 32.',
  renderWidth: 400,
  renderHeight: 300,
};
