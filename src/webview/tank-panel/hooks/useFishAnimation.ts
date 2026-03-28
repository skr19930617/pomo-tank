import { useEffect, useRef, useState, useCallback } from 'react';
import type { GameStateSnapshot } from '../../../game/state';
import { getGenus } from '../../../game/species';
import { HealthState, Personality, SWIM_LAYER_RANGES, type TankId } from '../../../shared/types';
import { getTank } from '../../../game/tanks';
import type { AttractionTarget } from './useFeedingMode';

export interface AnimatedFishData {
  x: number;
  y: number;
  dx: number;
  displaySize: number;
}

interface FishAnimState {
  x: number;
  y: number;
  dx: number;
  dy: number;
  /** Frame when fish arrived near food (0 = not arrived yet). */
  foodArrivedFrame: number;
}

export interface FishBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

const BASE_SPEED = 0.5;
const SICK_SPEED = 0.15;
const LIGHT_OFF_MULT = 0.5;
const DRIFT_CHANCE = 0.02;

// ── Boids-style schooling parameters ──
const SCHOOL_SEPARATION_DIST = 18; // px — fish repel if closer than this
const SCHOOL_NEIGHBOR_DIST = 60; // px — fish only influence each other within this radius
const SCHOOL_SEPARATION_FORCE = 0.04; // strength of repulsion when too close
const SCHOOL_ALIGNMENT_FORCE = 0.02; // strength of velocity matching
const SCHOOL_COHESION_FORCE = 0.003; // gentle pull toward group center

// ── Food attraction parameters ──
const FOOD_ATTRACTION_FORCE = 0.015; // pull toward food
const FOOD_SPEED_BOOST = 1.4; // multiply base speed when chasing food
const FOOD_ARRIVAL_DIST = 10; // px — considered "arrived" at food
const FOOD_LINGER_FRAMES = 40; // frames to linger near food before resuming free swim

/** Frames to delay before reacting to food, keyed by personality. */
export const PERSONALITY_REACTION_DELAY: Record<Personality, number> = {
  [Personality.active]: 0,
  [Personality.social]: 30,
  [Personality.calm]: 60,
  [Personality.timid]: 90,
};

/** Convert mm body length to px for rendering. */
function mmToPx(fishMm: number, tankWidthMm: number, tankRenderWidthPx: number): number {
  return (fishMm / tankWidthMm) * tankRenderWidthPx;
}

export function useFishAnimation(
  fish: GameStateSnapshot['fish'] | undefined,
  lightOn: boolean,
  bounds: FishBounds,
  tankId?: string,
  attractionTarget?: AttractionTarget | null,
): { animatedFish: Map<string, AnimatedFishData>; frameCount: number } {
  const stateRef = useRef<Map<string, FishAnimState>>(new Map());
  const [animState, setAnimState] = useState<{
    fish: Map<string, AnimatedFishData>;
    frameCount: number;
  }>({ fish: new Map(), frameCount: 0 });
  const rafRef = useRef<number>(0);
  const attractionRef = useRef<AttractionTarget | null | undefined>(attractionTarget);
  useEffect(() => { attractionRef.current = attractionTarget; }, [attractionTarget]);
  const boundsRef = useRef<FishBounds>(bounds);
  useEffect(() => { boundsRef.current = bounds; }, [bounds]);

  // Sync fish list — add new fish, remove gone ones
  const syncFish = useCallback(() => {
    if (!fish) return;
    const current = stateRef.current;
    const ids = new Set(fish.map((f) => f.id));

    // If no overlap between current and new fish IDs, clear entirely (handles reset)
    if (current.size > 0) {
      let hasOverlap = false;
      for (const id of ids) {
        if (current.has(id)) {
          hasOverlap = true;
          break;
        }
      }
      if (!hasOverlap) {
        current.clear();
      }
    }

    // Remove fish no longer present
    for (const key of current.keys()) {
      if (!ids.has(key)) {
        current.delete(key);
      }
    }

    // Add new fish with random positions inside swim zone
    for (const f of fish) {
      if (!current.has(f.id)) {
        const genus = getGenus(f.genusId);
        const swimRange = genus
          ? SWIM_LAYER_RANGES[genus.swimLayer]
          : { min: 0.1, max: 0.9 };
        const b = boundsRef.current;
        const zoneMinY = b.top + b.height * swimRange.min;
        const zoneMaxY = b.top + b.height * swimRange.max;

        current.set(f.id, {
          x: b.left + Math.random() * (b.width - 20) + 10,
          y: zoneMinY + Math.random() * (zoneMaxY - zoneMinY),
          dx: (Math.random() - 0.5) * 2,
          dy: (Math.random() - 0.5) * 1,
          foodArrivedFrame: 0,
        });
      }
    }
  }, [fish]);

  useEffect(() => {
    syncFish();
    let frameCounter = 0;

    const tick = () => {
      if (!fish) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      frameCounter += 1;
      const result = new Map<string, AnimatedFishData>();

      // Compute tank dimensions for mm→px conversion
      const tankCfg = getTank(tankId as TankId | undefined);
      const tankWidthMm = tankCfg?.widthMm ?? 250;
      const tankRenderWidth = tankCfg?.renderWidth ?? 110;

      // ── Schooling: build per-genus neighbor lists for boids ──
      const schoolingFish = new Map<string, Array<{ id: string; s: FishAnimState }>>();
      for (const f of fish) {
        if (f.healthState === HealthState.Dead) continue;
        const genus = getGenus(f.genusId);
        if (!genus?.schooling) continue;
        const s = stateRef.current.get(f.id);
        if (!s) continue;
        const list = schoolingFish.get(f.genusId) ?? [];
        list.push({ id: f.id, s });
        schoolingFish.set(f.genusId, list);
      }

      for (const f of fish) {
        const s = stateRef.current.get(f.id);
        if (!s) continue;

        const isDead = f.healthState === HealthState.Dead;
        const genus = getGenus(f.genusId);

        // Compute display size from mm
        const displaySize = mmToPx(f.bodyLengthMm, tankWidthMm, tankRenderWidth);

        if (isDead) {
          // Dead fish freeze in place
        } else {
          const speciesSpeed = genus?.baseSpeed ?? 1.0;
          const healthMul =
            f.healthState === HealthState.Sick || f.healthState === HealthState.Warning
              ? SICK_SPEED
              : BASE_SPEED;
          const speedMul = speciesSpeed * healthMul * (lightOn ? 1 : LIGHT_OFF_MULT);

          // ── Boids schooling: separation + alignment + cohesion ──
          const neighbors = schoolingFish.get(f.genusId);
          if (neighbors && neighbors.length >= 2) {
            let sepX = 0, sepY = 0;
            let alignDx = 0, alignDy = 0;
            let cohX = 0, cohY = 0;
            let neighborCount = 0;

            for (const other of neighbors) {
              if (other.id === f.id) continue;
              const distX = s.x - other.s.x;
              const distY = s.y - other.s.y;
              const dist = Math.sqrt(distX * distX + distY * distY);
              if (dist < 0.1) continue; // avoid division by zero

              if (dist < SCHOOL_NEIGHBOR_DIST) {
                neighborCount++;
                // Alignment: match neighbor velocity
                alignDx += other.s.dx;
                alignDy += other.s.dy;
                // Cohesion: steer toward neighbor position
                cohX += other.s.x;
                cohY += other.s.y;

                // Separation: push away if too close
                if (dist < SCHOOL_SEPARATION_DIST) {
                  const repel = (SCHOOL_SEPARATION_DIST - dist) / SCHOOL_SEPARATION_DIST;
                  sepX += (distX / dist) * repel;
                  sepY += (distY / dist) * repel;
                }
              }
            }

            if (neighborCount > 0) {
              // Separation
              s.dx += sepX * SCHOOL_SEPARATION_FORCE;
              s.dy += sepY * SCHOOL_SEPARATION_FORCE;
              // Alignment: steer toward average heading
              alignDx /= neighborCount;
              alignDy /= neighborCount;
              s.dx += (alignDx - s.dx) * SCHOOL_ALIGNMENT_FORCE;
              s.dy += (alignDy - s.dy) * SCHOOL_ALIGNMENT_FORCE;
              // Cohesion: gentle pull toward group center
              cohX /= neighborCount;
              cohY /= neighborCount;
              s.dx += (cohX - s.x) * SCHOOL_COHESION_FORCE;
              s.dy += (cohY - s.y) * SCHOOL_COHESION_FORCE;
            }
          }

          // ── Food attraction: pull toward food particles ──
          let chasingFood = false;
          const target = attractionRef.current;
          if (target?.active && genus) {
            const personality = genus.personality as Personality;
            const delay = PERSONALITY_REACTION_DELAY[personality] ?? 60;
            if (frameCounter - target.startFrame >= delay) {
              const distToFoodX = target.x - s.x;
              const distToFoodY = target.y - s.y;
              const distToFood = Math.sqrt(distToFoodX * distToFoodX + distToFoodY * distToFoodY);

              if (s.foodArrivedFrame === 0 && distToFood < FOOD_ARRIVAL_DIST) {
                // Just arrived near food — record frame
                s.foodArrivedFrame = frameCounter;
              }

              if (s.foodArrivedFrame === 0) {
                // Still approaching — apply attraction force
                s.dx += distToFoodX * FOOD_ATTRACTION_FORCE;
                s.dy += distToFoodY * FOOD_ATTRACTION_FORCE;
                chasingFood = true;
              } else if (frameCounter - s.foodArrivedFrame < FOOD_LINGER_FRAMES) {
                // Lingering near food — slow down, slight drift
                s.dx *= 0.9;
                s.dy *= 0.9;
              }
              // After linger period: free swim resumes naturally (no force applied)
            }
          } else {
            // No food target — reset arrival state
            s.foodArrivedFrame = 0;
          }

          // Random drift (suppressed while chasing food)
          if (!chasingFood && Math.random() < DRIFT_CHANCE) {
            s.dx += (Math.random() - 0.5) * 0.8;
            s.dy += (Math.random() - 0.5) * 0.4;
          }

          // Speed boost when chasing food
          const effectiveSpeed = chasingFood ? speedMul * FOOD_SPEED_BOOST : speedMul;

          // Clamp velocity (equal ratio for X and Y so fish move naturally in both axes)
          const maxV = 1.5 * effectiveSpeed;
          s.dx = Math.max(-maxV, Math.min(maxV, s.dx));
          s.dy = Math.max(-maxV, Math.min(maxV, s.dy));

          s.x += s.dx * effectiveSpeed;
          s.y += s.dy * effectiveSpeed;

          // Bounce off tank walls — use sprite half-size as margin so fish stay fully inside
          const halfSize = displaySize / 2;
          const xMargin = Math.max(halfSize, 4);
          const yMargin = Math.max(halfSize, 4);
          const b = boundsRef.current;
          if (s.x < b.left + xMargin) {
            s.x = b.left + xMargin;
            s.dx = Math.abs(s.dx);
          }
          if (s.x > b.left + b.width - xMargin) {
            s.x = b.left + b.width - xMargin;
            s.dx = -Math.abs(s.dx);
          }

          // Swim layer constraints — use sprite half-size so fish don't poke above water
          const swimRange = genus
            ? SWIM_LAYER_RANGES[genus.swimLayer]
            : { min: 0.1, max: 0.9 };
          const zoneMinY = b.top + b.height * swimRange.min;
          const zoneMaxY = b.top + b.height * swimRange.max;
          if (s.y < zoneMinY + yMargin) {
            s.y = zoneMinY + yMargin;
            s.dy = Math.abs(s.dy);
          }
          if (s.y > zoneMaxY - yMargin) {
            s.y = zoneMaxY - yMargin;
            s.dy = -Math.abs(s.dy);
          }
        }

        result.set(f.id, { x: s.x, y: s.y, dx: s.dx, displaySize });
      }

      setAnimState({ fish: result, frameCount: frameCounter });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [fish, lightOn, syncFish, tankId]);

  return { animatedFish: animState.fish, frameCount: animState.frameCount };
}
