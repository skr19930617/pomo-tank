import type { FilterConfig } from '../../shared/types';

export const hangOnBack: FilterConfig = {
  id: 'hang_on_back',
  displayName: 'Hang-On-Back Filter',
  capacityBonus: 3,
  pomoCost: 50,
  prerequisite: {},
  description: 'A solid upgrade. Capacity bonus: +3.',
  mount: 'hang_on_back',
  visual: {
    relativeSize: 0.8,
    primaryColor: '#555577',
    accentColor: '#7777aa',
    width: 14,
    height: 20,
  },
};
