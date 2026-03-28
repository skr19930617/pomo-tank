import React, { useMemo } from 'react';
import { Shape } from 'react-konva';

interface AlgaeOverlayProps {
  algaeLevel: number;
  tankWidth: number;
  tankHeight: number;
}

/** Fixed seed for deterministic dot generation. */
const PRNG_SEED = 0x5a7c_3e91;

/** Dot size range (px). */
const MIN_DOT_SIZE = 2;
const MAX_DOT_SIZE = 5;

/** Average dot area: π × (avgRadius)² where avgRadius = (MIN+MAX)/4 */
const AVG_DOT_RADIUS = (MIN_DOT_SIZE + MAX_DOT_SIZE) / 4;
const AVG_DOT_AREA = Math.PI * AVG_DOT_RADIUS * AVG_DOT_RADIUS;

/**
 * Target coverage at algaeLevel 100 (~90%).
 * Using the random overlap formula: coverage = 1 - e^(-n × dotArea / totalArea),
 * we solve for n: n = -ln(1 - coverage) × totalArea / dotArea
 */
const TARGET_COVERAGE = 0.9;

/** Tank frame thickness (must match Tank.tsx). */
const FRAME_THICKNESS = 3;

/** Sand strip height at bottom (must match Tank.tsx). */
const SAND_HEIGHT = 8;

/** Water fills 90% of inner height (must match Tank.tsx). */
const WATER_RATIO = 0.9;

/** Stage opacity breakpoints: [maxLevel, opacity]. */
const OPACITY_STAGES: [number, number][] = [
  [20, 0.3],
  [40, 0.4],
  [60, 0.5],
  [80, 0.6],
  [100, 0.7],
];

interface AlgaeDot {
  x: number;
  y: number;
  size: number;
  /** Minimum algaeLevel at which this dot becomes visible (1-100). */
  threshold: number;
}

/**
 * mulberry32 — lightweight 32-bit PRNG.
 * Returns a function that produces values in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b_79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x1_0000_0000;
  };
}

/** Interpolate opacity based on algaeLevel using stage breakpoints. */
function getOpacity(level: number): number {
  if (level <= 0) return 0;
  for (let i = 0; i < OPACITY_STAGES.length; i++) {
    const [maxLvl, opacity] = OPACITY_STAGES[i];
    if (level <= maxLvl) {
      const prevMax = i === 0 ? 0 : OPACITY_STAGES[i - 1][0];
      const prevOp = i === 0 ? 0.2 : OPACITY_STAGES[i - 1][1];
      const t = (level - prevMax) / (maxLvl - prevMax);
      return prevOp + t * (opacity - prevOp);
    }
  }
  return 0.7;
}

/**
 * Compute the number of dots needed for the target coverage given the drawable area.
 * Uses the random overlap formula: coverage = 1 - e^(-n × dotArea / totalArea)
 * Solved for n: n = -ln(1 - coverage) × totalArea / dotArea
 */
function computeMaxDots(drawableArea: number): number {
  return Math.ceil((-Math.log(1 - TARGET_COVERAGE) * drawableArea) / AVG_DOT_AREA);
}

/**
 * Generate all possible dot positions deterministically.
 * Each dot has a threshold (1-100) indicating when it appears.
 * Dot count is derived from drawable area to hit coverage targets at any tank size.
 */
function generateDots(tankWidth: number, tankHeight: number): AlgaeDot[] {
  const rand = mulberry32(PRNG_SEED);

  const innerW = tankWidth - FRAME_THICKNESS * 2;
  const innerH = tankHeight - FRAME_THICKNESS * 2;
  const waterH = innerH * WATER_RATIO;
  const waterTop = FRAME_THICKNESS + innerH - waterH;
  const sandTop = FRAME_THICKNESS + innerH - SAND_HEIGHT;

  const drawableArea = innerW * (sandTop - waterTop);
  const maxDots = computeMaxDots(drawableArea);

  const dots: AlgaeDot[] = [];
  for (let i = 0; i < maxDots; i++) {
    const x = FRAME_THICKNESS + rand() * innerW;
    const y = waterTop + rand() * (sandTop - waterTop);
    const size = MIN_DOT_SIZE + rand() * (MAX_DOT_SIZE - MIN_DOT_SIZE);
    // Threshold: dots are added cumulatively as algaeLevel increases.
    // Low-index dots appear at low levels, high-index dots at high levels.
    const threshold = Math.ceil(((i + 1) / maxDots) * 100);
    dots.push({ x, y, size, threshold });
  }
  return dots;
}

export const AlgaeOverlay: React.FC<AlgaeOverlayProps> = ({
  algaeLevel,
  tankWidth,
  tankHeight,
}) => {
  const dots = useMemo(() => generateDots(tankWidth, tankHeight), [tankWidth, tankHeight]);

  if (algaeLevel <= 0) return null;

  const clampedLevel = Math.min(algaeLevel, 100);
  const opacity = getOpacity(clampedLevel);

  return (
    <Shape
      sceneFunc={(context, shape) => {
        const ctx = context._context;
        ctx.fillStyle = '#4a8a3a';
        ctx.globalAlpha = opacity;
        for (const dot of dots) {
          if (dot.threshold > clampedLevel) continue;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        context.fillStrokeShape(shape);
      }}
      listening={false}
    />
  );
};
