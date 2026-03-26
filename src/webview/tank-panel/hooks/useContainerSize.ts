import { useState, useEffect, useRef, useCallback } from 'react';

interface ContainerSize {
  width: number;
  height: number;
}

/**
 * Fit a scene with the given aspect ratio into available dimensions,
 * returning the largest size that fits while maintaining the ratio.
 */
export function fitScene(
  aspectRatio: number,
  availW: number,
  availH: number,
): { width: number; height: number } {
  const byWidth = { width: availW, height: availW * aspectRatio };
  if (byWidth.height <= availH) {
    return { width: Math.floor(byWidth.width), height: Math.floor(byWidth.height) };
  }
  const w = availH / aspectRatio;
  return { width: Math.floor(w), height: Math.floor(availH) };
}

/**
 * Tracks the size of a container element via window resize events.
 *
 * Returns two sizes:
 * - `size`: updates every frame (for CSS transform scaling)
 * - `renderSize`: debounced (for expensive canvas redraws)
 */
export function useContainerSize(
  fallbackWidth: number,
  fallbackHeight: number,
  minWidth = 120,
  minHeight = 80,
): {
  ref: React.RefObject<HTMLDivElement | null>;
  size: ContainerSize;
  renderSize: ContainerSize;
} {
  const ref = useRef<HTMLDivElement | null>(null);

  const clamp = useCallback(
    (cssW: number, cssH: number): ContainerSize => ({
      width: Math.max(Math.floor(cssW), minWidth),
      height: Math.max(Math.floor(cssH), minHeight),
    }),
    [minWidth, minHeight],
  );

  const [size, setSize] = useState<ContainerSize>(() => clamp(fallbackWidth, fallbackHeight));
  const [renderSize, setRenderSize] = useState<ContainerSize>(() =>
    clamp(fallbackWidth, fallbackHeight),
  );

  useEffect(() => {
    const measure = () => {
      const el = ref.current;
      const w = el ? el.getBoundingClientRect().width : window.innerWidth;
      const h = el ? el.getBoundingClientRect().height : window.innerHeight;
      if (w > 0 && h > 0) {
        setSize((prev) => {
          const next = clamp(w, h);
          return prev.width === next.width && prev.height === next.height ? prev : next;
        });
      }
    };

    measure();

    let rafId: number | null = null;
    const onResize = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        measure();
      });
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [clamp]);

  // Debounce renderSize — canvas only redraws when resize settles
  useEffect(() => {
    const timer = setTimeout(() => setRenderSize(size), 100);
    return () => clearTimeout(timer);
  }, [size]);

  return { ref, size, renderSize };
}
