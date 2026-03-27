import { StoreItemType, type TankConfig, type TankId } from '../../shared/types';
import { nano20 } from './nano-20';
import { small30 } from './small-30';
import { medium45 } from './medium-45';
import { large60 } from './large-60';
import { xl90 } from './xl-90';

const ALL_TANKS: TankConfig[] = [nano20, small30, medium45, large60, xl90];

export const TANK_REGISTRY: Map<TankId, TankConfig> = new Map(
  ALL_TANKS.map((t) => [t.id, t]),
);

export function getTank(id: TankId | null | undefined): TankConfig | undefined {
  if (!id) return undefined;
  return TANK_REGISTRY.get(id);
}

export function getAllTanks(): TankConfig[] {
  return ALL_TANKS;
}

/**
 * Build store items for purchasable tanks (skip tanks with pomoCost = 0).
 */
export function buildTankStoreItems(): Record<string, {
  id: string;
  name: string;
  type: StoreItemType;
  pomoCost: number;
  prerequisite: TankConfig['prerequisite'];
  description: string;
}> {
  const items: Record<string, {
    id: string;
    name: string;
    type: StoreItemType;
    pomoCost: number;
    prerequisite: TankConfig['prerequisite'];
    description: string;
  }> = {};

  for (const tank of ALL_TANKS) {
    if (tank.pomoCost <= 0) continue;
    items[tank.id] = {
      id: tank.id,
      name: tank.displayName,
      type: StoreItemType.TankUpgrade,
      pomoCost: tank.pomoCost,
      prerequisite: tank.prerequisite,
      description: tank.description,
    };
  }

  return items;
}
