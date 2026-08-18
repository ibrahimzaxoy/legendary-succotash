import { useSyncExternalStore } from 'react';
import { getDevice, subscribe } from '../state/store';

export function useDevice() {
  return useSyncExternalStore(subscribe, getDevice);
}
