/**
 * Fish growth and lifespan mechanics.
 * Sigmoid growth curve modulated by maintenance quality.
 */

import type { Fish } from './state';
import type { GenusConfig, SpeciesConfig } from '../shared/types';

/**
 * Compute effective lifespan based on maintenance quality.
 * At quality 1.0: 100% lifespan. At quality 0.0: 70% lifespan.
 */
export function computeEffectiveLifespan(baseLifespanWeeks: number, quality: number): number {
  return Math.round(baseLifespanWeeks * (0.7 + 0.3 * quality));
}

/**
 * Apply one week of growth to a fish. Returns updated fish fields.
 * - Increments age by 1 week
 * - Computes new body length via sigmoid curve
 * - Checks for natural death (age >= effective lifespan)
 */
export function growFish(fish: Fish, _genus: GenusConfig, species: SpeciesConfig): Partial<Fish> {
  const newAge = fish.ageWeeks + 1;
  const effectiveLifespan = computeEffectiveLifespan(fish.lifespanWeeks, fish.maintenanceQuality);

  // Sigmoid growth curve
  const ageRatio = newAge / fish.lifespanWeeks;
  const sigmoidProgress = 1 / (1 + Math.exp(-10 * (ageRatio - 0.4)));
  const qualityFactor = fish.maintenanceQuality;

  const targetSize =
    species.minSizeMm + (species.maxSizeMm - species.minSizeMm) * sigmoidProgress * qualityFactor;

  // Smooth interpolation, never shrink
  const newBodyLength = Math.max(
    fish.bodyLengthMm,
    fish.bodyLengthMm + (targetSize - fish.bodyLengthMm) * 0.3,
  );

  // Cap at max size
  const clampedBodyLength = Math.min(newBodyLength, species.maxSizeMm);

  const updates: Partial<Fish> = {
    ageWeeks: newAge,
    bodyLengthMm: clampedBodyLength,
  };

  // Natural death check
  if (newAge >= effectiveLifespan) {
    updates.healthState = 'Dead' as Fish['healthState'];
  }

  return updates;
}
