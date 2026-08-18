import type { StaffSummary } from '../api/types';

const SESSION_KEY = 'dashboard:session';
const SELECTED_BRANCH_KEY = 'dashboard:selected-branch';

export interface Session {
  accessToken: string;
  refreshToken: string;
  staff: StaffSummary;
}

export function saveSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// "" means "All branches" (only meaningful for owner/admin, who aren't
// scoped to one branch already).
export function saveSelectedBranch(branchId: string): void {
  localStorage.setItem(SELECTED_BRANCH_KEY, branchId);
}

export function loadSelectedBranch(): string {
  return localStorage.getItem(SELECTED_BRANCH_KEY) ?? '';
}
