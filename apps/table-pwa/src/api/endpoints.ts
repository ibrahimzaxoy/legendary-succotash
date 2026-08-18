import { apiFetch } from './client';
import type { MenuCategory, MenuItem, Order, OrderItemInput, TableScanResult } from './types';

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
