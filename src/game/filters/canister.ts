import type { FilterConfig } from '../../shared/types';

export const canister: FilterConfig = {
  id: 'canister',
  displayName: 'Canister Filter',
  capacityBonus: 6,
  pomoCost: 150,
  prerequisite: {},
  description: 'Professional-grade filtration. Capacity bonus: +6.',
  mount: 'canister',
  visual: {
    relativeSize: 1.0,
    primaryColor: '#446644',
    accentColor: '#668866',
    width: 16,
    height: 24,
  },
};
