// ── Timer Color Theme ──
// Single source of truth for all timer visual constants.
// Edit these values to customize timer appearance.

/** White — normal focus timer (elapsed < focusMinutes) */
export const TIMER_COLOR_NORMAL = '#ffffff';

/** Yellow — focus time reached (elapsed >= focusMinutes) */
export const TIMER_COLOR_WARNING = '#ffcc44';

/** Red — overtime threshold exceeded (elapsed >= focusMinutes + OVERTIME_THRESHOLD_MINUTES) */
export const TIMER_COLOR_OVERTIME = '#ff4444';

/** Green — break countdown active */
export const TIMER_COLOR_BREAK = '#44dd44';

/** Minutes past focus duration before timer turns red (yellow → red transition) */
export const OVERTIME_THRESHOLD_MINUTES = 5;
