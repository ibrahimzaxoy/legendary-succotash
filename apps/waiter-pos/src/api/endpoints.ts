import { apiFetch } from './client';
import type {
  AttendanceRecord,
  AuthTokens,
  Branch,
  CashDrawerSession,
  MenuCategory,
  MenuItem,
  OrderDto,
  OrderItemInput,
  RestaurantTable,
  StaffLoginOption,
  TableStatus,
} from './types';

// --- Auth / device setup (manager login used once during setup) ---
export function loginWithPassword(email: string, password: string): Promise<AuthTokens> {
  return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, { auth: false });
}

export function fetchBranches(restaurantId: string): Promise<Branch[]> {
  return apiFetch(`/branches?restaurantId=${restaurantId}`);
}

// --- Staff PIN login (every shift) ---
export function fetchStaffLoginOptions(branchId: string): Promise<StaffLoginOption[]> {
  return apiFetch(`/staff/branch/${branchId}/login-options`, {}, { auth: false });
}

export function loginWithPin(staffId: string, pin: string): Promise<AuthTokens> {
  return apiFetch('/auth/login/pin', { method: 'POST', body: JSON.stringify({ staffId, pin }) }, { auth: false });
}

// --- Floor ---
export function fetchTables(branchId: string): Promise<RestaurantTable[]> {
  return apiFetch(`/tables?branchId=${branchId}`);
}

export function setTableStatus(tableId: string, status: Exclude<TableStatus, 'occupied'>): Promise<RestaurantTable> {
  return apiFetch(`/tables/${tableId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export function fetchActiveOrders(branchId: string): Promise<OrderDto[]> {
  return apiFetch(`/orders/active?branchId=${branchId}`);
}

// --- Menu ---
export function fetchCategories(branchId: string): Promise<MenuCategory[]> {
  return apiFetch(`/menu/categories?branchId=${branchId}`);
}

export function fetchDineInItems(branchId: string): Promise<MenuItem[]> {
  return apiFetch(`/menu/items?branchId=${branchId}&channel=dineIn`);
}

// --- Orders ---
export function createOrder(branchId: string, tableId: string, waiterStaffId: string, items: OrderItemInput[]): Promise<OrderDto> {
  return apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify({ branchId, tableId, waiterStaffId, channel: 'dine_in_waiter', items }),
  });
}

export function addItemsToOrder(orderId: string, waiterStaffId: string, items: OrderItemInput[]): Promise<OrderDto> {
  return apiFetch(`/orders/${orderId}/items`, {
    method: 'POST',
    body: JSON.stringify({ waiterStaffId, items }),
  });
}

export function fetchOrder(orderId: string): Promise<OrderDto> {
  return apiFetch(`/orders/${orderId}`);
}

export function markServed(orderId: string): Promise<OrderDto> {
  return apiFetch(`/orders/${orderId}/serve`, { method: 'PATCH' });
}

// --- Attendance (self-service clock in/out) ---
export function fetchMyOpenAttendance(): Promise<AttendanceRecord | null> {
  return apiFetch('/attendance/me/open');
}

export function clockIn(): Promise<AttendanceRecord> {
  return apiFetch('/attendance/clock-in', { method: 'POST' });
}

export function clockOut(): Promise<AttendanceRecord> {
  return apiFetch('/attendance/clock-out', { method: 'POST' });
}

// --- Cash drawer (cashier role) ---
export function fetchMyOpenCashDrawer(): Promise<CashDrawerSession | null> {
  return apiFetch('/payments/cash-drawer-sessions/mine/open');
}

export function openCashDrawer(branchId: string, openingFloat: string): Promise<CashDrawerSession> {
  return apiFetch('/payments/cash-drawer-sessions/open', { method: 'POST', body: JSON.stringify({ branchId, openingFloat }) });
}

export function closeCashDrawer(id: string, countedClosingCash: string, varianceNote?: string): Promise<CashDrawerSession> {
  return apiFetch(`/payments/cash-drawer-sessions/${id}/close`, {
    method: 'PATCH',
    body: JSON.stringify({ countedClosingCash, varianceNote }),
  });
}
