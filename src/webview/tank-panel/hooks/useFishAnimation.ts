import { useEffect, useRef, useState, useCallback } from 'react';
import type { GameStateSnapshot } from '../../../game/state';
import { HealthState } from '../../../shared/types';

export interface AnimatedFishData {
  x: number;
  y: number;
  dx: number;
}

interface FishAnimState {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export interface FishBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

const BASE_SPEED = 1.0;
const SICK_SPEED = 0.3;
const LIGHT_OFF_MULT = 0.5;
const DRIFT_CHANCE = 0.02;

export function useFishAnimation(
  fish: GameStateSnapshot['fish'] | undefined,
  lightOn: boolean,
  bounds: FishBounds,
): { animatedFish: Map<string, AnimatedFishData>; frameCount: number } {
  const stateRef = useRef<Map<string, FishAnimState>>(new Map());
  const [animState, setAnimState] = useState<{
    fish: Map<string, AnimatedFishData>;
    frameCount: number;
  }>({ fish: new Map(), frameCount: 0 });
  const rafRef = useRef<number>(0);

  // Sync fish list — add new fish, remove gone ones
  const syncFish = useCallback(() => {
    if (!fish) return;
    const current = stateRef.current;
    const ids = new Set(fish.map((f) => f.id));

    // Remove fish no longer present
    for (const key of current.keys()) {
      if (!ids.has(key)) {
        current.delete(key);
      }
    }

    // Add new fish with random positions inside bounds
    for (const f of fish) {
      if (!current.has(f.id)) {
        current.set(f.id, {
          x: bounds.left + Math.random() * (bounds.width - 20) + 10,
          y: bounds.top + Math.random() * (bounds.height - 20) + 10,
          dx: (Math.random() - 0.5) * 2,
          dy: (Math.random() - 0.5) * 1,
        });
      }
    }
  }, [fish, bounds]);

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

      for (const f of fish) {
        const s = stateRef.current.get(f.id);
        if (!s) continue;

        const isDead = f.healthState === HealthState.Dead;

        if (isDead) {
          // Dead fish float to top
          s.x += s.dx * 0.1;
          s.y += (bounds.top + 20 - s.y) * 0.02;
          s.dx *= 0.99;
        } else {
          const speedMul =
            (f.healthState === HealthState.Sick ? SICK_SPEED : BASE_SPEED) *
            (lightOn ? 1 : LIGHT_OFF_MULT);

          // Random drift
          if (Math.random() < DRIFT_CHANCE) {
            s.dx += (Math.random() - 0.5) * 0.8;
            s.dy += (Math.random() - 0.5) * 0.4;
          }

          // Clamp velocity
          const maxV = 1.5 * speedMul;
          s.dx = Math.max(-maxV, Math.min(maxV, s.dx));
          s.dy = Math.max(-maxV * 0.6, Math.min(maxV * 0.6, s.dy));

          s.x += s.dx * speedMul;
          s.y += s.dy * speedMul;

          // Bounce off tank walls (with margin for fish body)
          const margin = 12;
          if (s.x < bounds.left + margin) {
            s.x = bounds.left + margin;
            s.dx = Math.abs(s.dx);
          }
          if (s.x > bounds.left + bounds.width - margin) {
            s.x = bounds.left + bounds.width - margin;
            s.dx = -Math.abs(s.dx);
          }
          if (s.y < bounds.top + margin) {
            s.y = bounds.top + margin;
            s.dy = Math.abs(s.dy);
          }
          if (s.y > bounds.top + bounds.height - margin) {
            s.y = bounds.top + bounds.height - margin;
            s.dy = -Math.abs(s.dy);
          }
        }

        result.set(f.id, { x: s.x, y: s.y, dx: s.dx });
      }

      setAnimState({ fish: result, frameCount: frameCounter });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [fish, lightOn, bounds, syncFish]);

  return { animatedFish: animState.fish, frameCount: animState.frameCount };
}
