import { useSyncExternalStore } from 'react';
import { getStaffSession, subscribe } from '../state/store';

export function useStaffSession() {
  return useSyncExternalStore(subscribe, getStaffSession);
}
