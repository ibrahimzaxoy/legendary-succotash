const SESSION_KEY = 'table-order:session';

export interface TableSession {
  tableId: string;
  token: string;
  branchId: string;
  tableNumber: string;
}

// Persisted so that re-opening the installed PWA icon (no query string,
// since app icons launch at "/") returns to the table last scanned,
// instead of a dead end. Scanning a different table's QR always overwrites this.
export function saveTableSession(session: TableSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadTableSession(): TableSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TableSession;
  } catch {
    return null;
  }
}

// Anonymous per-table guest identity for the shared table-session cart (see
// GuestSessionState) - keyed by tableId so re-scanning the same table's QR
// on the same phone rejoins as the same guest (see TableSessionsService.join
// on the backend), while scanning a *different* table starts a fresh identity.
function guestDeviceTokenKey(tableId: string): string {
  return `table-order:guest-device-token:${tableId}`;
}

export function loadOrCreateGuestDeviceToken(tableId: string): string {
  const key = guestDeviceTokenKey(tableId);
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const token = crypto.randomUUID();
  localStorage.setItem(key, token);
  return token;
}
