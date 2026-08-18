const PROFILE_KEY = 'order-app:guest-profile';
const HISTORY_KEY = 'order-app:order-history';

// There's no customer account system - guests order without signing in -
// so "remember me" and "order history" are both scoped to this device via
// localStorage rather than a server-side account.
export interface GuestProfile {
  name: string;
  phone: string;
  address: string;
}

export function saveGuestProfile(profile: GuestProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadGuestProfile(): GuestProfile {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return { name: '', phone: '', address: '' };
  try {
    return { name: '', phone: '', address: '', ...JSON.parse(raw) };
  } catch {
    return { name: '', phone: '', address: '' };
  }
}

export interface HistoryEntry {
  orderId: string;
  branchName: string;
  channel: string;
  placedAt: string;
}

export function addToHistory(entry: HistoryEntry): void {
  const history = loadHistory();
  localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...history].slice(0, 20)));
}

export function loadHistory(): HistoryEntry[] {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}
