import { useEffect } from 'react';
import type Konva from 'konva';

/**
 * Force a Konva Stage redraw when the document transitions from hidden → visible.
 *
 * Browsers (including VSCode's Chromium webview) can evict canvas bitmaps while
 * a tab/webview is backgrounded.  requestAnimationFrame callbacks are also paused,
 * so nothing repaints the canvas until we explicitly ask Konva to redraw.
 */
export function useVisibilityResume(stageRef: React.RefObject<Konva.Stage | null>): void {
  useEffect(() => {
    const onVisibilityChange = () => {
      if (!document.hidden) {
        // Small delay lets RAF loops resume first, then we force a
        // full redraw to ensure the canvas bitmap is repainted.
        requestAnimationFrame(() => {
          stageRef.current?.batchDraw();
        });
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [stageRef]);
}
