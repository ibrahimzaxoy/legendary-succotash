import { apiFetch } from './client';
import type { GuestSessionState, MenuCategory, MenuItem, Order, OrderItemInput, TableScanResult } from './types';

export function scanTable(tableId: string, token: string): Promise<TableScanResult> {
  return apiFetch(`/tables/${tableId}/scan?tk=${encodeURIComponent(token)}`);
}

export function fetchCategories(branchId: string): Promise<MenuCategory[]> {
  return apiFetch(`/menu/categories?branchId=${branchId}`);
}

export function fetchDineInItems(branchId: string): Promise<MenuItem[]> {
  return apiFetch(`/menu/items?branchId=${branchId}&channel=dineIn`);
}

export function findActiveOrderForTable(branchId: string, tableId: string): Promise<Order | null> {
  return apiFetch(`/orders/active-for-table?branchId=${branchId}&tableId=${tableId}`);
}

export function fetchOrder(orderId: string): Promise<Order> {
  return apiFetch(`/orders/${orderId}`);
}

export function createDineInOrder(branchId: string, tableId: string, items: OrderItemInput[]): Promise<Order> {
  return apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify({ branchId, tableId, channel: 'dine_in_qr', items }),
  });
}

export function addItemsToOrder(orderId: string, items: OrderItemInput[]): Promise<Order> {
  return apiFetch(`/orders/${orderId}/items`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export function requestBill(orderId: string): Promise<{ requested: boolean }> {
  return apiFetch(`/orders/${orderId}/request-bill`, { method: 'POST' });
}

// --- Shared table session (multi-guest QR ordering) ---

export function joinTableSession(tableId: string, deviceToken: string): Promise<GuestSessionState> {
  return apiFetch('/table-sessions/join', { method: 'POST', body: JSON.stringify({ tableId, deviceToken }) });
}

export function fetchTableSessionState(sessionId: string, guestId: string): Promise<GuestSessionState> {
  return apiFetch(`/table-sessions/${sessionId}?guestId=${guestId}`);
}

export function addSharedCartItem(
  sessionId: string,
  input: { guestId: string; menuItemId: string; menuItemVariantId?: string; modifierOptionIds?: string[]; quantity: number; notes?: string },
): Promise<GuestSessionState['cartItems'][number]> {
  return apiFetch(`/table-sessions/${sessionId}/cart-items`, { method: 'POST', body: JSON.stringify(input) });
}

export function removeSharedCartItem(sessionId: string, itemId: string, guestId: string): Promise<void> {
  return apiFetch(`/table-sessions/${sessionId}/cart-items/${itemId}?guestId=${guestId}`, { method: 'DELETE' });
}

export function submitTableSession(sessionId: string): Promise<Order> {
  return apiFetch(`/table-sessions/${sessionId}/submit`, { method: 'POST' });
}
