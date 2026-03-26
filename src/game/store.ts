import {
  type GameState,
  type Fish,
  type Tank,
  STORE_ITEMS,
  TANK_BASE_CAPACITY,
  TANK_SIZE_ORDER,
  TankSizeTier,
  StoreItemType,
  HealthState,
  generateFishId,
} from './state';
import { getGenus, getSpecies, parseSpeciesStoreId } from './species';
import { getFilter } from './filters';

export interface PurchaseResult {
  success: boolean;
  message?: string;
}

// ── Capacity Helpers ──

export function calculateCurrentCost(fish: Fish[]): number {
  return fish
    .filter((f) => f.healthState !== HealthState.Dead)
    .reduce((sum, f) => {
      const genus = getGenus(f.genusId);
      return sum + (genus ? genus.capacityCost : 0);
    }, 0);
}

export function calculateMaxCapacity(tank: Tank): number {
  const base = TANK_BASE_CAPACITY[tank.sizeTier];
  const bonus = getFilter(tank.filterId)?.capacityBonus ?? 0;
  return base + bonus;
}

// ── Purchase Logic ──

export function canPurchase(
  state: GameState,
  itemId: string,
): { allowed: boolean; reason?: string } {
  const item = STORE_ITEMS[itemId];
  if (!item) {
    return { allowed: false, reason: 'Item not found.' };
  }

  // Check pomo balance
  if (state.player.pomoBalance < item.pomoCost) {
    return {
      allowed: false,
      reason: `Not enough pomo. Need ${item.pomoCost}, have ${state.player.pomoBalance}.`,
    };
  }

  // Check prerequisites
  if (item.prerequisite.requiredUnlocks) {
    for (const req of item.prerequisite.requiredUnlocks) {
      if (!state.player.unlockedItems.includes(req)) {
        return {
          allowed: false,
          reason: `Requires unlocking ${STORE_ITEMS[req]?.name || req} first.`,
        };
      }
    }
  }

  if (item.prerequisite.minTankSize) {
    const currentIdx = TANK_SIZE_ORDER.indexOf(state.tank.sizeTier);
    const requiredIdx = TANK_SIZE_ORDER.indexOf(item.prerequisite.minTankSize);
    if (currentIdx < requiredIdx) {
      return {
        allowed: false,
        reason: `Requires ${item.prerequisite.minTankSize} tank or larger.`,
      };
    }
  }

  // Type-specific checks
  if (item.type === StoreItemType.TankUpgrade) {
    if (state.player.unlockedItems.includes(itemId)) {
      return { allowed: false, reason: 'Already owned.' };
    }
  }

  if (item.type === StoreItemType.Filter) {
    if (state.player.unlockedItems.includes(itemId)) {
      return { allowed: false, reason: 'Already owned.' };
    }
  }

  if (item.type === StoreItemType.FishSpecies) {
    // Parse composite ID to get genus for capacity check
    const parsed = parseSpeciesStoreId(itemId);
    const genus = parsed ? getGenus(parsed.genusId) : undefined;
    const addCost = genus ? genus.capacityCost : 1;

    const currentCost = calculateCurrentCost(state.fish);
    const maxCapacity = calculateMaxCapacity(state.tank);

    if (currentCost + addCost > maxCapacity) {
      return {
        allowed: false,
        reason: `Not enough capacity (${currentCost}/${maxCapacity}).`,
      };
    }

    // Check species min tank size
    if (genus) {
      const currentIdx = TANK_SIZE_ORDER.indexOf(state.tank.sizeTier);
      const requiredIdx = TANK_SIZE_ORDER.indexOf(genus.minTankSize);
      if (currentIdx < requiredIdx) {
        return {
          allowed: false,
          reason: `${genus.displayName} needs a ${genus.minTankSize} tank or larger.`,
        };
      }
    }
  }

  return { allowed: true };
}

export function executePurchase(
  state: GameState,
  itemId: string,
): { state: GameState; result: PurchaseResult } {
  const check = canPurchase(state, itemId);
  if (!check.allowed) {
    return {
      state,
      result: { success: false, message: check.reason },
    };
  }

  const item = STORE_ITEMS[itemId];
  const newState: GameState = JSON.parse(JSON.stringify(state));

  // Deduct pomo
  newState.player.pomoBalance -= item.pomoCost;

  switch (item.type) {
    case StoreItemType.TankUpgrade: {
      const sizeMap: Record<string, TankSizeTier> = {
        tank_small: TankSizeTier.Small,
        tank_medium: TankSizeTier.Medium,
        tank_large: TankSizeTier.Large,
        tank_xl: TankSizeTier.XL,
      };
      const newSize = sizeMap[itemId];
      if (newSize) {
        newState.tank.sizeTier = newSize;
      }
      newState.player.unlockedItems.push(itemId);
      break;
    }

    case StoreItemType.Filter: {
      newState.tank.filterId = itemId;
      newState.player.unlockedItems.push(itemId);
      break;
    }

    case StoreItemType.FishSpecies: {
      // Parse composite ID to get exact genus + species
      const parsed = parseSpeciesStoreId(itemId);
      if (!parsed) break;

      const genus = getGenus(parsed.genusId);
      const speciesConfig = getSpecies(parsed.genusId, parsed.speciesId);

      const initialSizeMm = speciesConfig
        ? speciesConfig.minSizeMm + Math.random() * (speciesConfig.minSizeMm * 0.2)
        : 20;
      const lifespanWeeks = speciesConfig
        ? Math.round(
            (speciesConfig.minLifespanYears +
              Math.random() *
                (speciesConfig.maxLifespanYears - speciesConfig.minLifespanYears)) *
              52,
          )
        : 208;

      const newFish: Fish = {
        id: generateFishId(),
        genusId: parsed.genusId as Fish['genusId'],
        speciesId: parsed.speciesId,
        healthState: HealthState.Healthy,
        sicknessTick: 0,
        bodyLengthMm: initialSizeMm,
        ageWeeks: 0,
        lifespanWeeks,
        maintenanceQuality: 1.0,
        purchasedAt: Date.now(),
      };
      newState.fish.push(newFish);

      // Suppress unused variable warning for genus (used for capacity in canPurchase)
      void genus;
      break;
    }
  }

  return {
    state: newState,
    result: { success: true, message: 'Purchased!' },
  };
}

export function getStoreSnapshot(state: GameState): Array<{
  id: string;
  name: string;
  type: StoreItemType;
  pomoCost: number;
  affordable: boolean;
  meetsPrerequisites: boolean;
  capacityCost?: number;
}> {
  return Object.values(STORE_ITEMS).map((item) => {
    const check = canPurchase(state, item.id);
    const parsed = item.type === StoreItemType.FishSpecies ? parseSpeciesStoreId(item.id) : null;
    const genus = parsed ? getGenus(parsed.genusId) : null;
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      pomoCost: item.pomoCost,
      affordable: state.player.pomoBalance >= item.pomoCost,
      meetsPrerequisites: check.allowed,
      capacityCost: genus ? genus.capacityCost : undefined,
    };
  });
}
