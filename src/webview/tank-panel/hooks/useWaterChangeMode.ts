import { useState, useCallback } from 'react';

// ── Phase type ──

export type WaterChangePhase = 'idle' | 'ready' | 'draining' | 'paused' | 'filling';

// ── Animation constants (milliseconds) ──

export const DRAIN_DURATION_MS = 6000;
export const PAUSE_DURATION_MS = 2000;
export const FILL_DURATION_MS = 6000;
export const MIN_WATER_RATIO = 0.30;
export const NORMAL_WATER_RATIO = 0.90;

/** Lowest water level = NORMAL * MIN = 0.9 * 0.3 = 0.27 */
const MIN_WATER_LEVEL = NORMAL_WATER_RATIO * MIN_WATER_RATIO;

// ── Easing ──

/** Ease-in-out quadratic: slow start, fast middle, slow end */
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ── Water color helpers (mirrors Tank.tsx formula) ──

function dirtinessToRgb(dirtiness: number): [number, number, number] {
  const d = Math.min(dirtiness / 100, 1);
  return [
    Math.round(60 + d * 80),
    Math.round(140 + d * -40),
    Math.round(200 + d * -60),
  ];
}

function lerpRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

// ── Mutable animation state ──

interface AnimState {
  phase: WaterChangePhase;
  /** Timestamp (ms) when current phase started */
  phaseStartMs: number;
  snapshotDirtiness: number;
  snapshotAlgae: number;
  /** When true, animation just finished — hold final color until forceReset */
  pendingCompletion: boolean;
}

function createAnimState(): AnimState {
  return {
    phase: 'idle',
    phaseStartMs: 0,
    snapshotDirtiness: 0,
    snapshotAlgae: 0,
    pendingCompletion: false,
  };
}

// Module-level mutable state (same pattern as useFeedingMode)
let animState: AnimState = createAnimState();
/** Last timestamp used for rendering — updated each updateAnimation call */
let lastNowMs = 0;

// ── Compute helpers (pure functions reading animState) ──

function phaseElapsedMs(): number {
  return lastNowMs - animState.phaseStartMs;
}

function computeWaterLevel(): number {
  const { phase } = animState;
  if (phase === 'idle' || phase === 'ready') return NORMAL_WATER_RATIO;

  const elapsed = phaseElapsedMs();

  if (phase === 'draining') {
    const t = Math.min(elapsed / DRAIN_DURATION_MS, 1);
    return NORMAL_WATER_RATIO - (NORMAL_WATER_RATIO - MIN_WATER_LEVEL) * easeInOut(t);
  }
  if (phase === 'paused') return MIN_WATER_LEVEL;
  if (phase === 'filling') {
    const t = Math.min(elapsed / FILL_DURATION_MS, 1);
    return MIN_WATER_LEVEL + (NORMAL_WATER_RATIO - MIN_WATER_LEVEL) * easeInOut(t);
  }
  return NORMAL_WATER_RATIO;
}

function computeWaterColor(): string | null {
  // Hold final color after completion until forceReset
  if (animState.pendingCompletion) {
    const endDirtiness = Math.max(0, animState.snapshotDirtiness - 50);
    const endRgb = dirtinessToRgb(endDirtiness);
    return `rgb(${endRgb[0]}, ${endRgb[1]}, ${endRgb[2]})`;
  }
  if (animState.phase !== 'filling') return null;

  const elapsed = phaseElapsedMs();
  const t = Math.min(elapsed / FILL_DURATION_MS, 1);

  const startRgb = dirtinessToRgb(animState.snapshotDirtiness);
  const endDirtiness = Math.max(0, animState.snapshotDirtiness - 50);
  const endRgb = dirtinessToRgb(endDirtiness);

  return lerpRgb(startRgb, endRgb, t);
}

// ── Hook return type ──

export interface UseWaterChangeModeResult {
  phase: WaterChangePhase;
  waterLevelRatio: number;
  waterColorOverride: string | null;
  snapshotDirtiness: number;
  /** True after animation completes, before forceReset is called */
  pendingCompletion: boolean;
  startReady: () => void;
  cancelReady: () => void;
  startDraining: (waterDirtiness: number, algaeLevel: number) => void;
  /** Called each animation frame. Returns true when animation is complete. */
  updateAnimation: () => boolean;
  forceReset: () => void;
}

// ── Hook ──

export function useWaterChangeMode(): UseWaterChangeModeResult {
  const [phase, setPhase] = useState<WaterChangePhase>('idle');
  const [, setTick] = useState(0);

  const startReady = useCallback(() => {
    animState.phase = 'ready';
    setPhase('ready');
  }, []);

  const cancelReady = useCallback(() => {
    animState = createAnimState();
    setPhase('idle');
  }, []);

  const startDraining = useCallback((waterDirtiness: number, algaeLevel: number) => {
    animState.phase = 'draining';
    animState.phaseStartMs = performance.now();
    animState.snapshotDirtiness = waterDirtiness;
    animState.snapshotAlgae = algaeLevel;
    lastNowMs = animState.phaseStartMs;
    setPhase('draining');
  }, []);

  const forceReset = useCallback(() => {
    animState = createAnimState();
    setPhase('idle');
  }, []);

  const updateAnimation = useCallback((): boolean => {
    if (animState.phase === 'idle' || animState.phase === 'ready') return false;

    const now = performance.now();
    lastNowMs = now;

    // Loop to carry overflow through phase boundaries (handles hidden-tab resume)
    let advanced = true;
    while (advanced) {
      advanced = false;
      const elapsed = now - animState.phaseStartMs;

      if (animState.phase === 'draining' && elapsed >= DRAIN_DURATION_MS) {
        animState.phase = 'paused';
        animState.phaseStartMs += DRAIN_DURATION_MS; // carry overflow
        advanced = true;
      } else if (animState.phase === 'paused' && elapsed >= PAUSE_DURATION_MS) {
        animState.phase = 'filling';
        animState.phaseStartMs += PAUSE_DURATION_MS;
        advanced = true;
      } else if (animState.phase === 'filling' && elapsed >= FILL_DURATION_MS) {
        // Mark completion but preserve snapshot for final color hold
        animState.phase = 'idle';
        animState.pendingCompletion = true;
        setPhase('idle');
        setTick((t) => t + 1);
        return true;
      }
    }

    // Update React phase if it changed during the loop
    setPhase(animState.phase);

    setTick((t) => t + 1); // force re-render to pick up new computed values
    return false;
  }, []);

  return {
    phase,
    waterLevelRatio: computeWaterLevel(),
    waterColorOverride: computeWaterColor(),
    snapshotDirtiness: animState.snapshotDirtiness,
    pendingCompletion: animState.pendingCompletion,
    startReady,
    cancelReady,
    startDraining,
    updateAnimation,
    forceReset,
  };
}
