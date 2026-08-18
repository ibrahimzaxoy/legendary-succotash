import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/client';
import type { OrderItemStatus } from '../api/types';

export interface ItemStatusEvent {
  orderId: string;
  orderItemId: string;
  status: OrderItemStatus;
}

// Joins the same `order:{id}` room the OrdersGateway broadcasts kitchen
// updates into, so this screen updates live without polling - the guest
// sees "cooking" flip to "ready" the moment the kitchen bumps it.
//
// Whole-order readiness is deliberately *not* tracked here as a standalone
// flag driven by the backend's one-time "order-ready" event: appending a
// fresh item to an already-ready order would leave that flag stuck true.
// Callers should derive readiness from the current per-item statuses
// (see OrderStatusView) instead, which self-corrects as items change.
export function useOrderSocket(orderId: string | null) {
  const [itemStatusUpdates, setItemStatusUpdates] = useState<Record<string, OrderItemStatus>>({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const socket = io(`${API_BASE_URL}/orders`, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => socket.emit('watch-order', { orderId }));

    socket.on('item-status-changed', (evt: ItemStatusEvent) => {
      if (evt.orderId !== orderId) return;
      setItemStatusUpdates((prev) => ({ ...prev, [evt.orderItemId]: evt.status }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderId]);

  return { itemStatusUpdates };
}
