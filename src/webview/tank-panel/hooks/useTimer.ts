import { useMemo, useRef, useSyncExternalStore } from 'react';
import { type TimerMode, DEFAULT_SESSION_MINUTES } from '../../../shared/types';
import {
  TIMER_COLOR_NORMAL,
  TIMER_COLOR_WARNING,
  TIMER_COLOR_OVERTIME,
  TIMER_COLOR_BREAK,
  OVERTIME_THRESHOLD_MINUTES,
} from '../../../shared/timer-theme';

export interface TimerState {
  displaySeconds: number;
  timerColor: string;
  isPaused: boolean;
  timerMode: TimerMode;
}

/**
 * Client-side timer that interpolates between state updates (60s tick interval)
 * to provide 1-second precision display.
 *
 * Supports focus (count-up) and break (countdown) modes with color state.
 */
export function useTimer(
  timeSinceLastMaintenance: number,
  lightOn: boolean,
  sessionMinutes: number = DEFAULT_SESSION_MINUTES,
  timerMode: TimerMode = 'focus',
  breakRemainingMs: number = 0,
): TimerState {
  const baseRef = useRef({ serverMs: 0, clientTs: 0 });
  const lastServerMs = useRef(-1);

  const breakBaseRef = useRef({ serverMs: 0, clientTs: 0 });
  const lastBreakMs = useRef(-1);

  // Update focus base when server value changes
  if (timeSinceLastMaintenance !== lastServerMs.current) {
    lastServerMs.current = timeSinceLastMaintenance;
    baseRef.current = { serverMs: timeSinceLastMaintenance, clientTs: Date.now() };
  }

  // Update break base when server value changes
  if (breakRemainingMs !== lastBreakMs.current) {
    lastBreakMs.current = breakRemainingMs;
    breakBaseRef.current = { serverMs: breakRemainingMs, clientTs: Date.now() };
  }

  const subscribe = useMemo(() => {
    let listeners: Array<() => void> = [];
    let rafId: number | null = null;

    const notify = () => listeners.forEach((l) => l());

    const start = () => {
      if (rafId !== null) return;
      let lastSec = -1;
      const tick = () => {
        let sec: number;
        if (timerMode === 'break') {
          const base = breakBaseRef.current;
          const elapsed = Date.now() - base.clientTs;
          sec = Math.max(0, Math.floor((base.serverMs - elapsed) / 1000));
        } else {
          const base = baseRef.current;
          const elapsed = Date.now() - base.clientTs;
          sec = Math.floor((base.serverMs + elapsed) / 1000);
        }
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
  }, [lightOn, timeSinceLastMaintenance, timerMode, breakRemainingMs]);

  const getSnapshot = (): number => {
    if (timerMode === 'break') {
      if (!lightOn) {
        return Math.max(0, Math.floor(breakBaseRef.current.serverMs / 1000));
      }
      const base = breakBaseRef.current;
      const elapsed = Date.now() - base.clientTs;
      return Math.max(0, Math.floor((base.serverMs - elapsed) / 1000));
    }
    // Focus mode: count up
    if (!lightOn) {
      return Math.floor(baseRef.current.serverMs / 1000);
    }
    const base = baseRef.current;
    const elapsed = Date.now() - base.clientTs;
    return Math.floor((base.serverMs + elapsed) / 1000);
  };

  const displaySeconds = useSyncExternalStore(subscribe, getSnapshot);
  const isPaused = !lightOn;

  // Compute timer color
  let timerColor: string;
  if (timerMode === 'break') {
    timerColor = TIMER_COLOR_BREAK;
  } else {
    const elapsedMs = displaySeconds * 1000;
    const focusMs = sessionMinutes * 60 * 1000;
    const overtimeMs = (sessionMinutes + OVERTIME_THRESHOLD_MINUTES) * 60 * 1000;
    if (elapsedMs >= overtimeMs) {
      timerColor = TIMER_COLOR_OVERTIME;
    } else if (elapsedMs >= focusMs) {
      timerColor = TIMER_COLOR_WARNING;
    } else {
      timerColor = TIMER_COLOR_NORMAL;
    }
  }

  return { displaySeconds, timerColor, isPaused, timerMode };
}
