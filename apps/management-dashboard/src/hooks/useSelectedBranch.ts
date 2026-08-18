import { useSyncExternalStore } from 'react';
import { getSelectedBranchId, subscribe } from '../state/store';

export function useSelectedBranchId(): string {
  return useSyncExternalStore(subscribe, getSelectedBranchId);
}
