import { apiFetch } from './client';
import type {
  AccountingSummary,
  AuthTokens,
  Branch,
  Delivery,
  KitchenStation,
  MenuCategory,
  MenuItem,
  Order,
  Restaurant,
  RestaurantTable,
  Role,
  Staff,
  TableStatus,
} from './types';

// --- Auth ---
export function login(email: string, password: string): Promise<AuthTokens> {
  return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

// --- Restaurants / Branches ---
export function fetchRestaurant(id: string): Promise<Restaurant> {
  return apiFetch(`/restaurants/${id}`);
}

export function fetchBranches(restaurantId: string): Promise<Branch[]> {
  return apiFetch(`/branches?restaurantId=${restaurantId}`);
}

export function createBranch(input: { restaurantId: string; name: string; address: string; phone?: string }): Promise<Branch> {
  return apiFetch('/branches', { method: 'POST', body: JSON.stringify(input) });
}

// --- Staff ---
export function fetchStaff(branchId: string): Promise<Staff[]> {
  return apiFetch(`/staff?branchId=${branchId}`);
}

export interface CreateStaffInput {
  restaurantId: string;
  branchId: string;
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
  password?: string;
  pin?: string;
}

export function createStaff(input: CreateStaffInput): Promise<Staff> {
  return apiFetch('/staff', { method: 'POST', body: JSON.stringify(input) });
}

// --- Kitchen stations ---
export function fetchStations(branchId: string): Promise<KitchenStation[]> {
  return apiFetch(`/kitchen-stations?branchId=${branchId}`);
}

export function createStation(input: { branchId: string; name: string; isExpo?: boolean }): Promise<KitchenStation> {
  return apiFetch('/kitchen-stations', { method: 'POST', body: JSON.stringify(input) });
}

// --- Tables ---
export function fetchTables(branchId: string): Promise<RestaurantTable[]> {
  return apiFetch(`/tables?branchId=${branchId}`);
}

export function createTable(input: { branchId: string; number: string; zone?: string; capacity?: number }): Promise<RestaurantTable> {
  return apiFetch('/tables', { method: 'POST', body: JSON.stringify(input) });
}

export function fetchTableQr(tableId: string): Promise<{ url: string; qrPngDataUrl: string }> {
  return apiFetch(`/tables/${tableId}/qr`);
}

export function setTableStatus(tableId: string, status: Exclude<TableStatus, 'occupied'>): Promise<RestaurantTable> {
  return apiFetch(`/tables/${tableId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

// --- Menu ---
export function fetchCategories(branchId: string): Promise<MenuCategory[]> {
  return apiFetch(`/menu/categories?branchId=${branchId}`);
}

export function createCategory(input: { branchId: string; name: string; sortOrder?: number }): Promise<MenuCategory> {
  return apiFetch('/menu/categories', { method: 'POST', body: JSON.stringify(input) });
}

export function updateCategory(id: string, input: { name?: string; sortOrder?: number }): Promise<MenuCategory> {
  return apiFetch(`/menu/categories/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteCategory(id: string): Promise<void> {
  return apiFetch(`/menu/categories/${id}`, { method: 'DELETE' });
}

export function fetchAllItemsForAdmin(branchId: string): Promise<MenuItem[]> {
  return apiFetch(`/menu/admin/items?branchId=${branchId}`);
}

export interface CreateItemInput {
  branchId: string;
  categoryId: string;
  kitchenStationId: string;
  name: string;
  description?: string;
  basePrice: string;
  availableDineIn?: boolean;
  availablePickup?: boolean;
  availableDelivery?: boolean;
  prepTimeMinutes?: number;
  variants?: { name: string; priceDelta: string; isDefault?: boolean }[];
  modifierGroups?: {
    name: string;
    isRequired?: boolean;
    minSelect?: number;
    maxSelect?: number;
    options?: { name: string; priceDelta: string }[];
  }[];
}

export function createItem(input: CreateItemInput): Promise<MenuItem> {
  return apiFetch('/menu/items', { method: 'POST', body: JSON.stringify(input) });
}

export interface UpdateItemInput {
  categoryId?: string;
  kitchenStationId?: string;
  name?: string;
  description?: string;
  basePrice?: string;
  availableDineIn?: boolean;
  availablePickup?: boolean;
  availableDelivery?: boolean;
  prepTimeMinutes?: number;
}

export function updateItem(id: string, input: UpdateItemInput): Promise<MenuItem> {
  return apiFetch(`/menu/items/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteItem(id: string): Promise<void> {
  return apiFetch(`/menu/items/${id}`, { method: 'DELETE' });
}

export function setItemAvailability(id: string, isAvailable: boolean): Promise<MenuItem> {
  return apiFetch(`/menu/items/${id}/availability`, { method: 'PATCH', body: JSON.stringify({ isAvailable }) });
}

// --- Orders / Dispatch ---
export function fetchActiveOrders(branchId: string): Promise<Order[]> {
  return apiFetch(`/orders/active?branchId=${branchId}`);
}

export function createDelivery(input: { orderId: string; branchId: string; address: string }): Promise<Delivery> {
  return apiFetch('/deliveries', { method: 'POST', body: JSON.stringify(input) });
}

export function assignDriver(deliveryId: string, driverStaffId: string): Promise<Delivery> {
  return apiFetch(`/deliveries/${deliveryId}/assign-driver`, { method: 'PATCH', body: JSON.stringify({ driverStaffId }) });
}

export function fetchDeliveriesForBranch(branchId: string): Promise<Delivery[]> {
  return apiFetch(`/deliveries?branchId=${branchId}`);
}

// --- Accounting ---
export function fetchAccountingSummary(branchId: string, from: string, to: string): Promise<AccountingSummary> {
  return apiFetch(`/accounting/summary?branchId=${branchId}&from=${from}&to=${to}`);
}
