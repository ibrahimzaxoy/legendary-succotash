import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../api/client';
import type { OrderItemStatus } from '../api/types';

interface ItemStatusEvent {
  orderId: string;
  orderItemId: string;
  status: OrderItemStatus;
}

interface OrderReadyEvent {
  orderId: string;
}

// Joins the same `order:{id}` room the table PWA uses, so a waiter sees the
// same live kitchen progress a guest ordering via QR would.
//
// `readyPulse` increments once each time the backend flips the *order*
// (not just an item) to ready - the signal OrderDetail uses to refetch the
// authoritative order.status, since "Mark served" is gated server-side on
// that field. Deriving it purely from item statuses client-side isn't
// enough: the frontend and backend could disagree if a modifier-only
// order arrived with zero items, or on the exact tick order.status flips,
// and markServed would then 400 even though the button looked enabled.
export function useOrderSocket(orderId: string) {
  const [itemStatusUpdates, setItemStatusUpdates] = useState<Record<string, OrderItemStatus>>({});
  const [readyPulse, setReadyPulse] = useState(0);

  useEffect(() => {
    const socket = io(`${API_BASE_URL}/orders`, { transports: ['websocket'] });
    socket.on('connect', () => socket.emit('watch-order', { orderId }));
    socket.on('item-status-changed', (evt: ItemStatusEvent) => {
      if (evt.orderId !== orderId) return;
      setItemStatusUpdates((prev) => ({ ...prev, [evt.orderItemId]: evt.status }));
    });
    socket.on('order-ready', (evt: OrderReadyEvent) => {
      if (evt.orderId !== orderId) return;
      setReadyPulse((p) => p + 1);
    });
    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  return { itemStatusUpdates, readyPulse };
}
