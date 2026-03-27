import { useState, useCallback } from 'react';

// ── Type definitions ──

export type FeedingPhase = 'idle' | 'targeting' | 'animating';

export interface FoodParticle {
  id: number;
  x: number;
  y: number;
  opacity: number;
  vy: number;
  alive: boolean;
}

export interface FoodCan {
  x: number;
  y: number;
  rotation: number;
  visible: boolean;
}

export interface AttractionTarget {
  x: number;
  y: number;
  active: boolean;
  startFrame: number;
}

// ── Particle constants ──

const PARTICLE_COUNT_MIN = 5;
const PARTICLE_COUNT_MAX = 8;
const PARTICLE_SPREAD_X = 3; // ±px from drop point
const PARTICLE_VY_MIN = 0.15;
const PARTICLE_VY_MAX = 0.25;
const PARTICLE_FADE_SPEED = 0.02; // opacity decrease per frame after reaching bottom
const PARTICLE_SPAWN_FRAME = 15; // can tilt frame when particles start spawning

// ── Can animation constants ──

const CAN_TILT_FRAMES = 30; // frames to tilt from 0° to 45°
const CAN_HOLD_FRAMES = 30; // frames to hold at 45°
const CAN_MAX_ROTATION = 45;
const CAN_OFFSET_Y = -10; // px above water surface

/** EaseOutQuad: decelerating curve */
function easeOutQuad(t: number): number {
  return t * (2 - t);
}

/** Mutable animation state — mutated directly per frame, not tracked by React. */
interface AnimState {
  particles: FoodParticle[];
  can: FoodCan | null;
  drop: { x: number; y: number } | null;
  bottomY: number; // tank bottom Y (sand line) — particles stop and fade here
  startFrame: number;
  spawned: boolean;
}

function createAnimState(): AnimState {
  return { particles: [], can: null, drop: null, bottomY: 999, startFrame: 0, spawned: false };
}

function spawnParticles(drop: { x: number; y: number }): FoodParticle[] {
  const count = PARTICLE_COUNT_MIN + Math.floor(Math.random() * (PARTICLE_COUNT_MAX - PARTICLE_COUNT_MIN + 1));
  const result: FoodParticle[] = [];
  for (let i = 0; i < count; i++) {
    result.push({
      id: i,
      x: drop.x + (Math.random() - 0.5) * 2 * PARTICLE_SPREAD_X,
      y: drop.y,
      opacity: 1,
      vy: PARTICLE_VY_MIN + Math.random() * (PARTICLE_VY_MAX - PARTICLE_VY_MIN),
      alive: true,
    });
  }
  return result;
}

/**
 * Advance animation state by one frame. Pure function on mutable state object.
 * Returns true when animation completes (all particles gone + can hidden).
 */
function tickAnimation(a: AnimState, frameCount: number): boolean {
  if (a.startFrame === 0) a.startFrame = frameCount;
  const elapsed = frameCount - a.startFrame;

  // Update can animation
  if (a.can && a.can.visible) {
    if (elapsed < CAN_TILT_FRAMES) {
      const t = elapsed / CAN_TILT_FRAMES;
      a.can.rotation = easeOutQuad(t) * CAN_MAX_ROTATION;
    } else if (elapsed < CAN_TILT_FRAMES + CAN_HOLD_FRAMES) {
      a.can.rotation = CAN_MAX_ROTATION;
    } else {
      a.can.visible = false;
    }
  }

  // Spawn particles when can has tilted enough
  if (!a.spawned && elapsed >= PARTICLE_SPAWN_FRAME && a.drop) {
    a.particles = spawnParticles(a.drop);
    a.spawned = true;
  }

  // Update particles — sink until reaching bottom, then fade out
  let anyAlive = false;
  for (const p of a.particles) {
    if (!p.alive) continue;
    if (p.y < a.bottomY) {
      // Still falling
      p.y += p.vy;
      if (p.y > a.bottomY) p.y = a.bottomY;
    } else {
      // Reached bottom — fade out
      p.opacity = Math.max(0, p.opacity - PARTICLE_FADE_SPEED);
    }
    if (p.opacity <= 0) {
      p.alive = false;
    } else {
      anyAlive = true;
    }
  }

  // Complete: can hidden + no alive particles (and particles were spawned)
  return a.spawned && !anyAlive && !!a.can && !a.can.visible;
}

function computeAttractionTarget(a: AnimState): AttractionTarget | null {
  const alive = a.particles.filter((p) => p.alive);
  if (alive.length === 0) return null;
  let sumX = 0;
  let sumY = 0;
  for (const p of alive) {
    sumX += p.x;
    sumY += p.y;
  }
  return {
    x: sumX / alive.length,
    y: sumY / alive.length,
    active: true,
    startFrame: a.startFrame,
  };
}

export interface UseFeedingModeResult {
  phase: FeedingPhase;
  particles: FoodParticle[];
  canState: FoodCan | null;
  attractionTarget: AttractionTarget | null;
  startTargeting: () => void;
  cancelTargeting: () => void;
  confirmDrop: (x: number, waterSurfaceY: number, bottomY: number) => void;
  updateAnimation: (frameCount: number) => boolean;
  forceReset: () => void;
}

// Module-level mutable animation state — outside React's tracking.
// Only one feeding mode instance exists at a time (single webview).
let animState: AnimState = createAnimState();

export function useFeedingMode(): UseFeedingModeResult {
  const [phase, setPhase] = useState<FeedingPhase>('idle');
  // Bump to force re-render after animation ticks (so particles/can state is fresh)
  const [, setTick] = useState(0);

  const startTargeting = useCallback(() => {
    setPhase('targeting');
  }, []);

  const cancelTargeting = useCallback(() => {
    setPhase('idle');
  }, []);

  const forceReset = useCallback(() => {
    animState = createAnimState();
    setPhase('idle');
  }, []);

  const confirmDrop = useCallback((x: number, waterSurfaceY: number, bottomY: number) => {
    animState = createAnimState();
    animState.drop = { x, y: waterSurfaceY };
    animState.bottomY = bottomY;
    animState.can = {
      x,
      y: waterSurfaceY + CAN_OFFSET_Y,
      rotation: 0,
      visible: true,
    };
    setPhase('animating');
  }, []);

  const updateAnimation = useCallback(
    (frameCount: number): boolean => {
      // Guard: only tick when animState has active drop (i.e., animating)
      if (!animState.drop) return false;
      const completed = tickAnimation(animState, frameCount);
      setTick((t) => t + 1); // force re-render to pick up new particle positions
      if (completed) {
        animState = createAnimState();
        setPhase('idle');
        return true;
      }
      return false;
    },
    [],
  );

  const attractionTarget = phase === 'animating' ? computeAttractionTarget(animState) : null;

  return {
    phase,
    particles: animState.particles,
    canState: animState.can,
    attractionTarget,
    startTargeting,
    cancelTargeting,
    confirmDrop,
    updateAnimation,
    forceReset,
  };
}
