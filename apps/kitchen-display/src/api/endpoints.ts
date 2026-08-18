import { apiFetch } from './client';
import type { AuthTokens, Branch, KitchenStation, OrderItemDto, TicketItemStatus } from './types';

export function login(email: string, password: string): Promise<AuthTokens> {
  return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function fetchBranches(restaurantId: string): Promise<Branch[]> {
  return apiFetch(`/branches?restaurantId=${restaurantId}`);
}

export function fetchStations(branchId: string): Promise<KitchenStation[]> {
  return apiFetch(`/kitchen-stations?branchId=${branchId}`);
}

export function fetchActiveItemsForStation(branchId: string, stationId: string): Promise<OrderItemDto[]> {
  return apiFetch(`/orders/stations/${stationId}/items?branchId=${branchId}`);
}

export function updateItemStatus(orderItemId: string, status: TicketItemStatus): Promise<unknown> {
  return apiFetch(`/orders/items/${orderItemId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
