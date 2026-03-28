import { useState, useCallback } from 'react';

// ── Phase type ──

export type MossCleaningPhase = 'idle' | 'active' | 'completing';

// ── Sponge cursor (16×16 pixel art, data URI) ──

/** Generate a 16×16 sponge cursor as a CSS `url(data:...)` value. */
function buildSpongeCursorUri(): string {
  // 16×16 bitmap: 0=transparent, 1=outline(#5a4a2a), 2=body(#e8c84a), 3=hole(#a08830)
  // prettier-ignore
  const bitmap: number[][] = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0],
    [0,1,2,2,3,3,2,2,2,3,3,2,2,2,1,0],
    [0,1,2,2,3,3,2,2,2,3,3,2,2,2,1,0],
    [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
    [0,1,2,2,2,2,3,3,2,2,2,2,2,2,1,0],
    [0,1,2,2,2,2,3,3,2,2,2,2,2,2,1,0],
    [0,1,2,2,3,3,2,2,2,3,3,2,2,2,1,0],
    [0,1,2,2,3,3,2,2,2,3,3,2,2,2,1,0],
    [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
    [0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ];
  const colors: Record<number, [number, number, number, number]> = {
    0: [0, 0, 0, 0],
    1: [90, 74, 42, 255],
    2: [232, 200, 74, 255],
    3: [160, 136, 48, 255],
  };
  const size = 16;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const c = colors[bitmap[y][x]] ?? colors[0];
      const i = (y * size + x) * 4;
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = c[3];
    }
  }
  // Build minimal PNG manually (uncompressed)
  // For simplicity, use a BMP data URI via canvas-like encoding
  // Actually, we'll build a raw pixel string and use an inline SVG approach
  // Simplest: build a base64-encoded BMP
  return buildBmpDataUri(bitmap, colors, size);
}

function buildBmpDataUri(
  bitmap: number[][],
  colors: Record<number, [number, number, number, number]>,
  size: number,
): string {
  // BMP with alpha: BITMAPV4HEADER (108 bytes) + pixel data
  const headerSize = 14 + 108; // file header + DIB header
  const rowSize = size * 4; // 32bpp, no padding needed for 16px
  const pixelDataSize = rowSize * size;
  const fileSize = headerSize + pixelDataSize;

  const buf = new ArrayBuffer(fileSize);
  const view = new DataView(buf);

  // BMP file header (14 bytes)
  view.setUint8(0, 0x42); view.setUint8(1, 0x4D); // 'BM'
  view.setUint32(2, fileSize, true);
  view.setUint32(10, headerSize, true); // pixel data offset

  // BITMAPV4HEADER (108 bytes)
  view.setUint32(14, 108, true); // header size
  view.setInt32(18, size, true); // width
  view.setInt32(22, -size, true); // height (negative = top-down)
  view.setUint16(26, 1, true); // planes
  view.setUint16(28, 32, true); // bpp
  view.setUint32(30, 3, true); // compression = BI_BITFIELDS
  view.setUint32(34, pixelDataSize, true);
  // Masks: R, G, B, A
  view.setUint32(54, 0x00FF0000, true); // red mask
  view.setUint32(58, 0x0000FF00, true); // green mask
  view.setUint32(62, 0x000000FF, true); // blue mask
  view.setUint32(66, 0xFF000000, true); // alpha mask

  // Pixel data
  let offset = headerSize;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const c = colors[bitmap[y][x]] ?? colors[0];
      // BMP BGRA order
      view.setUint8(offset, c[2]);     // B
      view.setUint8(offset + 1, c[1]); // G
      view.setUint8(offset + 2, c[0]); // R
      view.setUint8(offset + 3, c[3]); // A
      offset += 4;
    }
  }

  // Convert to base64
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `url("data:image/bmp;base64,${btoa(binary)}") 8 6, auto`;
}

/** Precomputed sponge cursor CSS value. */
export const SPONGE_CURSOR = buildSpongeCursorUri();

// ── Tuning constants ──

/** Moss reduction per pixel of drag distance. */
const DISTANCE_COEFFICIENT = 0.05;
/** Moss reduction per second while dragging (time correction). */
const TIME_COEFFICIENT = 0.5;
/** Fixed moss reduction on a single click (no drag). */
const CLICK_FIXED_REDUCTION = 0.5;
/** Duration of sparkle effect on completion (ms). */
const COMPLETION_EFFECT_DURATION = 800;

// ── Mutable animation state (module-level, same pattern as useWaterChangeMode) ──

interface MossCleaningAnimState {
  phase: MossCleaningPhase;
  isDragging: boolean;
  hasMoved: boolean;
  lastMouseX: number;
  lastMouseY: number;
  dragStartTimeMs: number;
  /** Accumulated reduction since last flush to extension. */
  pendingReduction: number;
  /** Timestamp when completing phase started. */
  completingStartMs: number;
  /** Current algae level (tracked locally for instant feedback). */
  localAlgaeLevel: number;
  /** Initial algae level when cleaning started. */
  initialAlgaeLevel: number;
  /** Whether completion message has been sent (one-shot latch). */
  completionSent: boolean;
}

function createAnimState(): MossCleaningAnimState {
  return {
    phase: 'idle',
    isDragging: false,
    hasMoved: false,
    lastMouseX: 0,
    lastMouseY: 0,
    dragStartTimeMs: 0,
    pendingReduction: 0,
    completingStartMs: 0,
    localAlgaeLevel: 0,
    initialAlgaeLevel: 0,
    completionSent: false,
  };
}

let animState: MossCleaningAnimState = createAnimState();

// ── Sparkle effect state ──

export interface SparkleParticle {
  x: number;
  y: number;
  size: number;
  opacity: number;
}

let sparkleParticles: SparkleParticle[] = [];

// ── Bubble effect state ──

export interface BubbleParticle {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  createdAt: number;
}

/** Bubble lifetime in ms. */
const BUBBLE_LIFETIME_MS = 400;
/** Max concurrent bubbles. */
const MAX_BUBBLES = 20;
/** Bubbles spawned per drag event. */
const BUBBLES_PER_MOVE = 2;

let bubbleParticles: BubbleParticle[] = [];

function spawnBubbles(x: number, y: number, now: number): void {
  for (let i = 0; i < BUBBLES_PER_MOVE; i++) {
    if (bubbleParticles.length >= MAX_BUBBLES) {
      bubbleParticles.shift(); // remove oldest
    }
    bubbleParticles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      radius: 1 + Math.random() * 2,
      opacity: 0.6 + Math.random() * 0.3,
      createdAt: now,
    });
  }
}

function updateBubbles(now: number): void {
  bubbleParticles = bubbleParticles.filter((b) => {
    const age = now - b.createdAt;
    if (age >= BUBBLE_LIFETIME_MS) return false;
    b.opacity = (1 - age / BUBBLE_LIFETIME_MS) * 0.7;
    b.y -= 0.3; // float upward
    return true;
  });
}

function generateSparkles(tankWidth: number, tankHeight: number): SparkleParticle[] {
  const particles: SparkleParticle[] = [];
  const frame = 3;
  for (let i = 0; i < 5; i++) {
    particles.push({
      x: frame + Math.random() * (tankWidth - frame * 2),
      y: frame + Math.random() * (tankHeight - frame * 2),
      size: 3 + Math.random() * 4,
      opacity: 1,
    });
  }
  return particles;
}

// ── Hook return type ──

export interface UseMossCleaningModeResult {
  phase: MossCleaningPhase;
  localAlgaeLevel: number;
  sparkles: SparkleParticle[];
  bubbles: BubbleParticle[];
  startCleaning: (currentAlgaeLevel: number) => void;
  cancelCleaning: () => void;
  onMouseDown: (x: number, y: number) => void;
  onMouseMove: (x: number, y: number, deltaTimeMs: number) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  /** Called each animation frame. Returns pending reduction to flush (0 if none). */
  updateAnimation: (tankWidth: number, tankHeight: number) => number;
  /** True if algae reached 0 this frame (caller should send mossCleaningComplete). */
  isJustCompleted: () => boolean;
  /** Get total reduction applied since cleaning started (for cancel message). */
  getTotalReduction: () => number;
}

// ── Hook ──

export function useMossCleaningMode(): UseMossCleaningModeResult {
  const [phase, setPhase] = useState<MossCleaningPhase>('idle');
  const [, setTick] = useState(0);

  const startCleaning = useCallback((currentAlgaeLevel: number) => {
    animState = createAnimState();
    animState.phase = 'active';
    animState.localAlgaeLevel = currentAlgaeLevel;
    animState.initialAlgaeLevel = currentAlgaeLevel;
    sparkleParticles = [];
    bubbleParticles = [];
    setPhase('active');
  }, []);

  const cancelCleaning = useCallback(() => {
    animState = createAnimState();
    sparkleParticles = [];
    bubbleParticles = [];
    setPhase('idle');
  }, []);

  const onMouseDown = useCallback((x: number, y: number) => {
    if (animState.phase !== 'active') return;
    animState.isDragging = true;
    animState.lastMouseX = x;
    animState.lastMouseY = y;
    animState.dragStartTimeMs = performance.now();
    // hasMoved will be set to true on first onMouseMove; if still false on mouseUp, apply click reduction
  }, []);

  const onMouseMove = useCallback((x: number, y: number, deltaTimeMs: number) => {
    if (animState.phase !== 'active' || !animState.isDragging) return;

    animState.hasMoved = true;
    const dx = x - animState.lastMouseX;
    const dy = y - animState.lastMouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const distReduction = distance * DISTANCE_COEFFICIENT;
    const timeReduction = (deltaTimeMs / 1000) * TIME_COEFFICIENT;
    const totalReduction = distReduction + timeReduction;

    animState.pendingReduction += totalReduction;
    animState.localAlgaeLevel = Math.max(0, animState.localAlgaeLevel - totalReduction);
    animState.lastMouseX = x;
    animState.lastMouseY = y;

    // Spawn bubbles at drag position
    spawnBubbles(x, y, performance.now());
  }, []);

  const onMouseUp = useCallback(() => {
    if (animState.isDragging && !animState.hasMoved) {
      // Click-only (no drag movement): apply fixed micro reduction
      animState.pendingReduction += CLICK_FIXED_REDUCTION;
      animState.localAlgaeLevel = Math.max(0, animState.localAlgaeLevel - CLICK_FIXED_REDUCTION);
    }
    animState.isDragging = false;
    animState.hasMoved = false;
  }, []);

  const onMouseLeave = useCallback(() => {
    animState.isDragging = false;
  }, []);

  const isJustCompleted = useCallback((): boolean => {
    if (animState.phase === 'completing' && !animState.completionSent) {
      animState.completionSent = true;
      return true;
    }
    return false;
  }, []);

  const updateAnimation = useCallback((tankWidth: number, tankHeight: number): number => {
    if (animState.phase === 'idle') return 0;

    const now = performance.now();

    // Update bubble particles
    updateBubbles(now);

    // Check if algae reached 0 → transition to completing
    if (animState.phase === 'active' && animState.localAlgaeLevel <= 0) {
      animState.phase = 'completing';
      animState.completingStartMs = now;
      animState.isDragging = false;
      sparkleParticles = generateSparkles(tankWidth, tankHeight);
      setPhase('completing');
    }

    // Update sparkle particles during completing phase
    if (animState.phase === 'completing') {
      const elapsed = now - animState.completingStartMs;
      if (elapsed >= COMPLETION_EFFECT_DURATION) {
        // Completing done → back to idle
        animState = createAnimState();
        sparkleParticles = [];
        bubbleParticles = [];
        setPhase('idle');
      } else {
        // Fade out sparkles
        const progress = elapsed / COMPLETION_EFFECT_DURATION;
        for (const p of sparkleParticles) {
          p.opacity = 1 - progress;
        }
      }
    }

    // Flush pending reduction
    const reduction = animState.pendingReduction;
    animState.pendingReduction = 0;

    setTick((t) => t + 1); // force re-render
    return reduction;
  }, []);

  return {
    phase,
    localAlgaeLevel: animState.localAlgaeLevel,
    sparkles: sparkleParticles,
    bubbles: bubbleParticles,
    startCleaning,
    cancelCleaning,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    updateAnimation,
    isJustCompleted,
    getTotalReduction: () => animState.initialAlgaeLevel - animState.localAlgaeLevel,
  };
}
