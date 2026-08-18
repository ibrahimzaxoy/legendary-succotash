import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../api/client';
import type { OrderItemStatus } from '../api/types';

interface ItemStatusEvent {
  orderId: string;
  orderItemId: string;
  status: OrderItemStatus;
}

// Joins the same `order:{id}` room the table PWA and Waiter POS use, so a
// delivery/pickup customer sees the same live kitchen progress.
export function useOrderSocket(orderId: string) {
  const [itemStatusUpdates, setItemStatusUpdates] = useState<Record<string, OrderItemStatus>>({});

  useEffect(() => {
    const socket = io(`${API_BASE_URL}/orders`, { transports: ['websocket'] });
    socket.on('connect', () => socket.emit('watch-order', { orderId }));
    socket.on('item-status-changed', (evt: ItemStatusEvent) => {
      if (evt.orderId !== orderId) return;
      setItemStatusUpdates((prev) => ({ ...prev, [evt.orderItemId]: evt.status }));
    });
    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  return { itemStatusUpdates };
}
