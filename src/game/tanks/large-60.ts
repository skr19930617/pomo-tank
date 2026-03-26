import type { TankConfig } from '../../shared/types';

export const large60: TankConfig = {
  id: 'large_60',
  displayName: '60cm Tank',
  widthMm: 600,
  heightMm: 360,
  depthMm: 300,
  baseCapacity: 22,
  pomoCost: 250,
  prerequisite: { requiredUnlocks: ['medium_45'] },
  description: 'A proper aquarium. Base capacity: 22.',
  renderWidth: 370,
  renderHeight: 278,
};
