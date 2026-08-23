import { apiFetch } from './client';
import type { Branch, LoyaltyPreview, MenuCategory, MenuItem, OrderChannel, OrderDto, OrderItemInput, PromoPreview, Restaurant } from './types';

export function fetchRestaurant(restaurantId: string): Promise<Restaurant> {
  return apiFetch(`/restaurants/${restaurantId}`);
}

export function fetchBranches(restaurantId: string): Promise<Branch[]> {
  return apiFetch(`/branches?restaurantId=${restaurantId}`);
}

export function fetchCategories(branchId: string): Promise<MenuCategory[]> {
  return apiFetch(`/menu/categories?branchId=${branchId}`);
}

export function fetchItems(branchId: string, channel: 'pickup' | 'delivery'): Promise<MenuItem[]> {
  return apiFetch(`/menu/items?branchId=${branchId}&channel=${channel}`);
}

export interface PlaceOrderInput {
  branchId: string;
  channel: OrderChannel;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  promoCode?: string;
  redeemLoyaltyPoints?: number;
  items: OrderItemInput[];
}

export function placeOrder(input: PlaceOrderInput): Promise<OrderDto> {
  return apiFetch('/orders', { method: 'POST', body: JSON.stringify(input) });
}

export function fetchOrder(orderId: string): Promise<OrderDto> {
  return apiFetch(`/orders/${orderId}`);
}

export function lookupLoyalty(branchId: string, phone: string): Promise<LoyaltyPreview | null> {
  return apiFetch(`/loyalty/accounts/lookup?branchId=${branchId}&phone=${encodeURIComponent(phone)}`);
}

export function validatePromoCode(branchId: string, code: string, subtotal: string): Promise<PromoPreview> {
  return apiFetch('/promotions/validate', { method: 'POST', body: JSON.stringify({ branchId, code, subtotal }) });
}
