export type UrgencyTier = 'fresh' | 'warning' | 'late';

const WARNING_AFTER_MINUTES = 5;
const LATE_AFTER_MINUTES = 10;

export function elapsedMinutes(createdAt: string, now: number): number {
  return Math.max(0, (now - new Date(createdAt).getTime()) / 60000);
}

export function urgencyTier(minutes: number): UrgencyTier {
  if (minutes >= LATE_AFTER_MINUTES) return 'late';
  if (minutes >= WARNING_AFTER_MINUTES) return 'warning';
  return 'fresh';
}

export function formatElapsed(minutes: number): string {
  const whole = Math.floor(minutes);
  return whole < 1 ? '<1 min' : `${whole} min`;
}
