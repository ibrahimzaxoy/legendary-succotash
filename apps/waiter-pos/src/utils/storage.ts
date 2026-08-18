import type { StaffSummary } from '../api/types';

const DEVICE_KEY = 'waiter-pos:device';
const STAFF_SESSION_KEY = 'waiter-pos:staff-session';

// A tablet is provisioned to one branch once (by a manager/owner) and stays
// that way indefinitely - separate from whichever individual waiter is
// currently signed in, since staff clock in/out on the same shared device
// throughout a shift.
export interface Device {
  branchId: string;
  branchName: string;
}

export interface StaffSession {
  accessToken: string;
  refreshToken: string;
  staff: StaffSummary;
}

export function saveDevice(device: Device): void {
  localStorage.setItem(DEVICE_KEY, JSON.stringify(device));
}

export function loadDevice(): Device | null {
  const raw = localStorage.getItem(DEVICE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Device;
  } catch {
    return null;
  }
}

export function saveStaffSession(session: StaffSession): void {
  localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(session));
}

export function loadStaffSession(): StaffSession | null {
  const raw = localStorage.getItem(STAFF_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StaffSession;
  } catch {
    return null;
  }
}

export function clearStaffSession(): void {
  localStorage.removeItem(STAFF_SESSION_KEY);
}
