/**
 * Maintenance quality tracking using Exponential Moving Average (EMA).
 * Quality score is 0.0 (worst) to 1.0 (best), stored per fish.
 */

const EMA_ALPHA = 0.1;

/**
 * Compute a quality snapshot from current tank conditions.
 * All values are 0-100; lower is better.
 * Returns 0.0 (all at 100) to 1.0 (all at 0).
 */
export function computeQualitySnapshot(
  hunger: number,
  dirtiness: number,
  algae: number,
): number {
  return 1.0 - (hunger + dirtiness + algae) / 300;
}

/**
 * Blend a new quality snapshot into the cumulative quality score using EMA.
 */
export function updateQuality(
  currentQuality: number,
  snapshot: number,
  alpha: number = EMA_ALPHA,
): number {
  return currentQuality * (1 - alpha) + snapshot * alpha;
}
