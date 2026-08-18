import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../api/client';
import { fetchActiveItemsForStation, updateItemStatus } from '../api/endpoints';
import { ticketFromAddedEvent, ticketFromOrderItemDto } from '../api/ticket';
import type { Ticket, TicketItemAddedEvent, TicketItemStatus, TicketItemStatusChangedEvent } from '../api/types';

const DONE_STATUSES: TicketItemStatus[] = ['ready', 'served', 'cancelled'];
// How long a bumped-to-ready ticket stays on screen as a visible
// confirmation before clearing itself off the rail.
const REMOVE_DONE_AFTER_MS = 4000;

export function useStationTickets(branchId: string, stationId: string) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const removalTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const scheduleRemoval = (orderItemId: string) => {
    const timers = removalTimers.current;
    const existing = timers.get(orderItemId);
    if (existing) clearTimeout(existing);
    timers.set(
      orderItemId,
      setTimeout(() => {
        setTickets((prev) => prev.filter((t) => t.orderItemId !== orderItemId));
        timers.delete(orderItemId);
      }, REMOVE_DONE_AFTER_MS),
    );
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchActiveItemsForStation(branchId, stationId)
      .then((items) => {
        if (cancelled) return;
        setTickets(items.map(ticketFromOrderItemDto));
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Couldn’t load tickets.');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [branchId, stationId]);

  useEffect(() => {
    const socket = io(`${API_BASE_URL}/kitchen`, { transports: ['websocket'] });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-station', { branchId, stationId });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    socket.on('ticket-item-added', (evt: TicketItemAddedEvent) => {
      setTickets((prev) => (prev.some((t) => t.orderItemId === evt.orderItemId) ? prev : [...prev, ticketFromAddedEvent(evt)]));
    });

    socket.on('ticket-item-status-changed', (evt: TicketItemStatusChangedEvent) => {
      setTickets((prev) => prev.map((t) => (t.orderItemId === evt.orderItemId ? { ...t, status: evt.status } : t)));
      if (DONE_STATUSES.includes(evt.status)) scheduleRemoval(evt.orderItemId);
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, stationId]);

  useEffect(() => {
    const timers = removalTimers.current;
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  const bump = async (orderItemId: string, nextStatus: TicketItemStatus) => {
    const previous = tickets;
    setTickets((prev) => prev.map((t) => (t.orderItemId === orderItemId ? { ...t, status: nextStatus } : t)));
    if (DONE_STATUSES.includes(nextStatus)) scheduleRemoval(orderItemId);
    try {
      await updateItemStatus(orderItemId, nextStatus);
    } catch {
      setTickets(previous); // couldn't reach the server - undo the optimistic bump
      setError('Couldn’t update that ticket - check the connection and try again.');
    }
  };

  return { tickets, loading, connected, error, bump, dismissError: () => setError(null) };
}
