import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../api/client';

// Joins `driver:{staffId}` in the deliveries namespace so a new dispatch or
// a status change (e.g. a manager updating it from the Management
// Dashboard) shows up without polling. `refreshPulse` increments on either
// event - the list page just refetches from `GET /deliveries/me` on pulse
// rather than trying to patch individual deliveries in place, since a
// fresh assignment needs the full order (customer, address, items) that
// the socket event itself doesn't carry.
export function useDeliverySocket(driverStaffId: string) {
  const [connected, setConnected] = useState(false);
  const [refreshPulse, setRefreshPulse] = useState(0);

  useEffect(() => {
    const socket = io(`${API_BASE_URL}/deliveries`, { transports: ['websocket'] });
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('watch-driver', { driverStaffId });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('delivery-assigned', () => setRefreshPulse((p) => p + 1));
    socket.on('delivery-status-changed', () => setRefreshPulse((p) => p + 1));
    return () => {
      socket.disconnect();
    };
  }, [driverStaffId]);

  return { connected, refreshPulse };
}
