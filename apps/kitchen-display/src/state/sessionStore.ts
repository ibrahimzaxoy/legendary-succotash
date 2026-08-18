import { clearSession, loadSession, saveSession, type KdsSession } from '../utils/storage';

type Listener = () => void;

let session: KdsSession | null = loadSession();
const listeners = new Set<Listener>();

export function getSession(): KdsSession | null {
  return session;
}

export function setSession(next: KdsSession | null): void {
  session = next;
  if (next) saveSession(next);
  else clearSession();
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
