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
