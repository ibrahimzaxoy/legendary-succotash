import { useSyncExternalStore } from 'react';
import { getSession, subscribe } from '../state/sessionStore';

export function useSession() {
  return useSyncExternalStore(subscribe, getSession);
}
