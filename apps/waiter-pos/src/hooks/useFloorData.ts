import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchActiveOrders, fetchTables } from '../api/endpoints';
import { useFloorSocket } from './useFloorSocket';
import type { OrderDto, RestaurantTable } from '../api/types';

const POLL_INTERVAL_MS = 20000;

export function useFloorData(branchId: string) {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedOnce = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const [tableList, orderList] = await Promise.all([fetchTables(branchId), fetchActiveOrders(branchId)]);
      setTables(tableList);
      setOrders(orderList);
      setError(null);
    } catch {
      setError('Couldn’t refresh the floor - check the connection.');
    } finally {
      setLoading(false);
      loadedOnce.current = true;
    }
  }, [branchId]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const { connected } = useFloorSocket(branchId, refresh);

  const orderByTable = new Map<string, OrderDto>();
  for (const order of orders) {
    if (order.tableId) orderByTable.set(order.tableId, order);
  }

  return { tables, orderByTable, loading, error, connected, refresh };
}
