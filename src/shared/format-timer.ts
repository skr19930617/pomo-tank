/** Format total seconds into MM:SS or HH:MM:SS display string */
export function formatTimer(totalSec: number): string {
  const capped = Math.min(totalSec, 359999); // 99:59:59
  const hrs = Math.floor(capped / 3600);
  const min = Math.floor((capped % 3600) / 60);
  const sec = capped % 60;
  const mm = min.toString().padStart(2, '0');
  const ss = sec.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${hrs}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}
