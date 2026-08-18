import {
  clearStaffSession,
  loadDevice,
  loadStaffSession,
  saveDevice,
  saveStaffSession,
  type Device,
  type StaffSession,
} from '../utils/storage';

type Listener = () => void;

let device: Device | null = loadDevice();
let staffSession: StaffSession | null = loadStaffSession();
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((l) => l());
}

export function getDevice(): Device | null {
  return device;
}

export function setDevice(next: Device): void {
  device = next;
  saveDevice(next);
  notify();
}

export function getStaffSession(): StaffSession | null {
  return staffSession;
}

export function setStaffSession(next: StaffSession | null): void {
  staffSession = next;
  if (next) saveStaffSession(next);
  else clearStaffSession();
  notify();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
