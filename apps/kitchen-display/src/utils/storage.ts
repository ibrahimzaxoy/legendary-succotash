import type { StaffSummary } from '../api/types';

const SESSION_KEY = 'kds:session';

export interface KdsSession {
  accessToken: string;
  refreshToken: string;
  staff: StaffSummary;
  branchId: string;
  stationId: string | null; // null until the station picker step is completed
  stationName: string | null;
}

// A kitchen display is a shared, always-on device: it logs in once (during
// setup) and should stay signed in across shifts, restarts, and page
// reloads without prompting again - hence persisting the full session,
// including the refresh token, rather than just an in-memory access token.
export function saveSession(session: KdsSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): KdsSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as KdsSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
