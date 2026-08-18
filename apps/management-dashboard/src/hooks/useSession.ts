import { useSyncExternalStore } from 'react';
import { getSession, subscribe } from '../state/store';

export function useSession() {
  return useSyncExternalStore(subscribe, getSession);
}
