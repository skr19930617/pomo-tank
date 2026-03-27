import type { FilterConfig } from '../../shared/types';

export const basicSponge: FilterConfig = {
  id: 'basic_sponge',
  displayName: 'Basic Sponge',
  capacityBonus: 0,
  pomoCost: 0,
  prerequisite: {},
  description: 'A simple sponge filter. No capacity bonus.',
  mount: 'internal',
  visual: {
    relativeSize: 0.6,
    primaryColor: '#66aa66',
    accentColor: '#448844',
    width: 10,
    height: 12,
  },
};
