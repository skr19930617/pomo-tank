import { useMemo, useRef, useSyncExternalStore } from 'react';
import { POMO_THRESHOLD_MS } from '../../../shared/types';

interface TimerState {
  displaySeconds: number;
  isOvertime: boolean;
  isPaused: boolean;
}

/**
 * Client-side timer that interpolates between state updates (60s tick interval)
 * to provide 1-second precision display.
 *
 * Uses useSyncExternalStore to avoid setState-in-effect lint issues.
 */
export function useTimer(
  timeSinceLastMaintenance: number,
  lightOn: boolean,
): TimerState {
  const baseRef = useRef({ serverMs: 0, clientTs: 0 });
  const lastServerMs = useRef(-1);

  // Update base when server value changes (no setState needed)
  if (timeSinceLastMaintenance !== lastServerMs.current) {
    lastServerMs.current = timeSinceLastMaintenance;
    baseRef.current = { serverMs: timeSinceLastMaintenance, clientTs: Date.now() };
  }

  const subscribe = useMemo(() => {
    let listeners: Array<() => void> = [];
    let rafId: number | null = null;

    const notify = () => listeners.forEach((l) => l());

    const start = () => {
      if (rafId !== null) return;
      let lastSec = -1;
      const tick = () => {
        const base = baseRef.current;
        const elapsed = Date.now() - base.clientTs;
        const sec = Math.floor((base.serverMs + elapsed) / 1000);
        if (sec !== lastSec) {
          lastSec = sec;
          notify();
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    return (callback: () => void) => {
      listeners.push(callback);
      if (lightOn) start();
      return () => {
        listeners = listeners.filter((l) => l !== callback);
        if (listeners.length === 0) stop();
      };
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightOn, timeSinceLastMaintenance]);

  const getSnapshot = (): number => {
    if (!lightOn) {
      return Math.floor(baseRef.current.serverMs / 1000);
    }
    const base = baseRef.current;
    const elapsed = Date.now() - base.clientTs;
    return Math.floor((base.serverMs + elapsed) / 1000);
  };

  const displaySeconds = useSyncExternalStore(subscribe, getSnapshot);
  const isPaused = !lightOn;
  const isOvertime = displaySeconds * 1000 >= POMO_THRESHOLD_MS;

  return { displaySeconds, isOvertime, isPaused };
}
