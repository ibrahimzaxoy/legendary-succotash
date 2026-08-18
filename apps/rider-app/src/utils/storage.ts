import type { StaffSummary } from '../api/types';

const DEVICE_KEY = 'rider-app:device';
const STAFF_SESSION_KEY = 'rider-app:staff-session';

// A phone is provisioned to one branch once (by a manager/owner) and stays
// that way - a driver only ever works one branch's deliveries, but a
// different driver can sign in on the same phone across shifts.
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
