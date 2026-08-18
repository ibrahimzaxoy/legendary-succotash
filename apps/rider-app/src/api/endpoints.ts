import { apiFetch } from './client';
import type { AuthTokens, Branch, Delivery, DeliveryStatus, OrderDto, StaffLoginOption } from './types';

export interface StaffSelf {
  id: string;
  fullName: string;
  onShift: boolean;
}

// --- Auth / device setup (manager login used once during setup) ---
export function loginWithPassword(email: string, password: string): Promise<AuthTokens> {
  return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, { auth: false });
}

export function fetchBranches(restaurantId: string): Promise<Branch[]> {
  return apiFetch(`/branches?restaurantId=${restaurantId}`);
}

// --- Driver PIN login (every shift) ---
export function fetchStaffLoginOptions(branchId: string): Promise<StaffLoginOption[]> {
  return apiFetch(`/staff/branch/${branchId}/login-options`, {}, { auth: false });
}

export function loginWithPin(staffId: string, pin: string): Promise<AuthTokens> {
  return apiFetch('/auth/login/pin', { method: 'POST', body: JSON.stringify({ staffId, pin }) }, { auth: false });
}

// --- Shift ---
export function fetchStaffSelf(staffId: string): Promise<StaffSelf> {
  return apiFetch(`/staff/${staffId}`);
}

export function setMyShift(onShift: boolean): Promise<StaffSelf> {
  return apiFetch('/staff/me/shift', { method: 'PATCH', body: JSON.stringify({ onShift }) });
}

// --- Deliveries ---
export function fetchMyDeliveries(): Promise<Delivery[]> {
  return apiFetch('/deliveries/me');
}

export function updateDeliveryStatus(deliveryId: string, status: DeliveryStatus): Promise<Delivery> {
  return apiFetch(`/deliveries/${deliveryId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export function fetchOrder(orderId: string): Promise<OrderDto> {
  return apiFetch(`/orders/${orderId}`);
}
