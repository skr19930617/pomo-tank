import { StoreItemType, type FilterConfig, type FilterId } from '../../shared/types';
import { basicSponge } from './basic-sponge';
import { hangOnBack } from './hang-on-back';
import { canister } from './canister';
import { premiumCanister } from './premium-canister';

const ALL_FILTERS: FilterConfig[] = [basicSponge, hangOnBack, canister, premiumCanister];

export const FILTER_REGISTRY: Map<FilterId, FilterConfig> = new Map(
  ALL_FILTERS.map((f) => [f.id, f]),
);

export function getFilter(id: FilterId | null | undefined): FilterConfig | undefined {
  if (!id) return undefined;
  return FILTER_REGISTRY.get(id);
}

export function getAllFilters(): FilterConfig[] {
  return ALL_FILTERS;
}

/**
 * Build store items for purchasable filters (skip filters with pomoCost = 0).
 * Returns a Record keyed by FilterId.
 */
export function buildFilterStoreItems(): Record<
  string,
  {
    id: string;
    name: string;
    type: StoreItemType;
    pomoCost: number;
    prerequisite: FilterConfig['prerequisite'];
    description: string;
  }
> {
  const items: Record<
    string,
    {
      id: string;
      name: string;
      type: StoreItemType;
      pomoCost: number;
      prerequisite: FilterConfig['prerequisite'];
      description: string;
    }
  > = {};

  for (const filter of ALL_FILTERS) {
    if (filter.pomoCost <= 0) continue;
    items[filter.id] = {
      id: filter.id,
      name: filter.displayName,
      type: StoreItemType.Filter,
      pomoCost: filter.pomoCost,
      prerequisite: filter.prerequisite,
      description: filter.description,
    };
  }

  return items;
}
