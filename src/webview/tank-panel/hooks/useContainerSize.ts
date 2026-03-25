import { useState, useEffect, useRef, useCallback } from 'react';

interface ContainerSize {
  width: number;
  height: number;
}

/**
 * Observes the width of a container element via ResizeObserver and derives
 * the height from a fixed aspect ratio.
 *
 * Returns a fallback size immediately so the first render is never empty.
 *
 * @param aspectRatio - height / width ratio (e.g. 0.818 for 180/220).
 * @param fallbackWidth - CSS-pixel width used before the first observation.
 * @param minWidth - Minimum CSS-pixel width (default 120).
 */
export function useContainerSize(
  aspectRatio: number,
  fallbackWidth: number,
  minWidth = 120,
): { ref: React.RefObject<HTMLDivElement | null>; size: ContainerSize } {
  const ref = useRef<HTMLDivElement | null>(null);

  const derive = useCallback(
    (cssW: number): ContainerSize => {
      const w = Math.max(Math.floor(cssW), minWidth);
      return { width: w, height: Math.floor(w * aspectRatio) };
    },
    [aspectRatio, minWidth],
  );

  // Start with a usable fallback so the first render shows content.
  const [size, setSize] = useState<ContainerSize>(() => derive(fallbackWidth));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Measure immediately in case the element already has a width.
    const rect = el.getBoundingClientRect();
    if (rect.width > 0) {
      setSize(derive(rect.width));
    }

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize((prev) => {
            const next = derive(w);
            return prev.width === next.width && prev.height === next.height ? prev : next;
          });
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [derive]);

  return { ref, size };
}
