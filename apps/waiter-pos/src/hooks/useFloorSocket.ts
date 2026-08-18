import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../api/client';

// Joins the same `branch:{id}:floor` room the OrdersGateway broadcasts
// kitchen progress into, and calls `onSignal` (debounced) whenever
// something changes so the floor view can refetch. This app doesn't yet
// have a socket event for every transition (a cashier closing a check
// elsewhere, for instance, isn't broadcast) - see the README - so this is
// a "something happened, go check" signal layered on top of the periodic
// refresh in FloorView, not a fully event-sourced live floor.
export function useFloorSocket(branchId: string, onSignal: () => void): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSignalRef = useRef(onSignal);
  onSignalRef.current = onSignal;

  useEffect(() => {
    const socket = io(`${API_BASE_URL}/orders`, { transports: ['websocket'] });

    const debouncedSignal = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onSignalRef.current(), 400);
    };

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('watch-floor', { branchId });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('item-status-changed', debouncedSignal);
    socket.on('order-ready', debouncedSignal);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      socket.disconnect();
    };
  }, [branchId]);

  return { connected };
}
