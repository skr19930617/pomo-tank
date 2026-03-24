import {
  type GameState,
  type Fish,
  STORE_ITEMS,
  FISH_SPECIES,
  FILTERS,
  TANK_CAPACITY,
  TANK_SIZE_ORDER,
  TankSizeTier,
  StoreItemType,
  HealthState,
  generateFishId,
} from "./state";

export interface PurchaseResult {
  success: boolean;
  message?: string;
  warning?: string;
}

export function canPurchase(
  state: GameState,
  itemId: string,
): { allowed: boolean; reason?: string } {
  const item = STORE_ITEMS[itemId];
  if (!item) {
    return { allowed: false, reason: "Item not found." };
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
    const requiredIdx = TANK_SIZE_ORDER.indexOf(
      item.prerequisite.minTankSize,
    );
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
      return { allowed: false, reason: "Already owned." };
    }
  }

  if (item.type === StoreItemType.Filter) {
    if (state.player.unlockedItems.includes(itemId)) {
      return { allowed: false, reason: "Already owned." };
    }
  }

  if (item.type === StoreItemType.FishSpecies) {
    // Check tank capacity
    const livingFish = state.fish.filter(
      (f) => f.healthState !== HealthState.Dead,
    );
    const capacity = TANK_CAPACITY[state.tank.sizeTier];
    if (livingFish.length >= capacity) {
      return { allowed: false, reason: "Tank is full." };
    }

    // Check species min tank size
    const species = FISH_SPECIES[itemId];
    if (species) {
      const currentIdx = TANK_SIZE_ORDER.indexOf(state.tank.sizeTier);
      const requiredIdx = TANK_SIZE_ORDER.indexOf(species.minTankSize);
      if (currentIdx < requiredIdx) {
        return {
          allowed: false,
          reason: `${species.name} needs a ${species.minTankSize} tank or larger.`,
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
  let newState: GameState = JSON.parse(JSON.stringify(state));

  // Deduct pomo
  newState.player.pomoBalance -= item.pomoCost;

  let warning: string | undefined;

  switch (item.type) {
    case StoreItemType.TankUpgrade: {
      // Upgrade to the corresponding tank size
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
      // Equip the new filter
      newState.tank.filterId = itemId;
      newState.player.unlockedItems.push(itemId);
      break;
    }

    case StoreItemType.FishSpecies: {
      // Add a new fish of this species
      const newFish: Fish = {
        id: generateFishId(),
        speciesId: itemId,
        hungerLevel: 0,
        healthState: HealthState.Healthy,
        sicknessTick: 0,
      };
      newState.fish.push(newFish);

      // Check schooling warning
      const species = FISH_SPECIES[itemId];
      if (species && species.schoolingMin > 1) {
        const count = newState.fish.filter(
          (f) =>
            f.speciesId === itemId &&
            f.healthState !== HealthState.Dead,
        ).length;
        if (count < species.schoolingMin) {
          warning = `${species.name} prefers groups of ${species.schoolingMin}+. You have ${count}.`;
        }
      }
      break;
    }
  }

  return {
    state: newState,
    result: {
      success: true,
      message: warning ? `Purchased! ${warning}` : "Purchased!",
      warning,
    },
  };
}

export function getCurrentLoad(state: GameState): number {
  return state.fish.filter(
    (f) => f.healthState !== HealthState.Dead,
  ).length;
}

export function getCapacity(sizeTier: TankSizeTier): number {
  return TANK_CAPACITY[sizeTier];
}

export function getStoreSnapshot(state: GameState): Array<{
  id: string;
  name: string;
  type: StoreItemType;
  pomoCost: number;
  affordable: boolean;
  meetsPrerequisites: boolean;
}> {
  return Object.values(STORE_ITEMS).map((item) => {
    const check = canPurchase(state, item.id);
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      pomoCost: item.pomoCost,
      affordable: state.player.pomoBalance >= item.pomoCost,
      meetsPrerequisites: check.allowed,
    };
  });
}
