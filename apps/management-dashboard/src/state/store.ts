import { clearSession, loadSelectedBranch, loadSession, saveSelectedBranch, saveSession, type Session } from '../utils/storage';

type Listener = () => void;

let session: Session | null = loadSession();
let selectedBranchId: string = loadSelectedBranch();
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((l) => l());
}

export function getSession(): Session | null {
  return session;
}

export function setSession(next: Session | null): void {
  session = next;
  if (next) saveSession(next);
  else clearSession();
  notify();
}

export function getSelectedBranchId(): string {
  return selectedBranchId;
}

export function setSelectedBranchId(branchId: string): void {
  selectedBranchId = branchId;
  saveSelectedBranch(branchId);
  notify();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
