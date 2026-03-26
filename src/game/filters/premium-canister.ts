import type { FilterConfig } from '../../shared/types';

export const premiumCanister: FilterConfig = {
  id: 'premium_canister',
  displayName: 'Premium Canister Filter',
  capacityBonus: 10,
  pomoCost: 400,
  prerequisite: {},
  description: 'The best money can buy. Capacity bonus: +10.',
  mount: 'canister',
  visual: {
    relativeSize: 1.3,
    primaryColor: '#334455',
    accentColor: '#ccaa44',
    width: 20,
    height: 28,
  },
};
