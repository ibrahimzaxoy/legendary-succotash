import { apiFetch } from './client';
import type {
  AccountingSummary,
  AttendanceRecord,
  AuthTokens,
  Branch,
  CashDrawerSession,
  Delivery,
  Expense,
  ExpenseCategory,
  KitchenStation,
  MenuCategory,
  MenuItem,
  Order,
  PayRate,
  PayrollAdvance,
  PayrollLine,
  PayrollRun,
  PaymentMethod,
  PurchaseOrder,
  PurchaseOrderReceipt,
  Restaurant,
  RestaurantTable,
  Role,
  ShiftAssignment,
  ShiftTemplate,
  Staff,
  Supplier,
  SupplierBalance,
  SupplierPayment,
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

// --- Attendance: shift templates & roster ---
export function fetchShiftTemplates(branchId: string): Promise<ShiftTemplate[]> {
  return apiFetch(`/shift-templates?branchId=${branchId}`);
}

export function createShiftTemplate(input: { branchId: string; name: string; startTime: string; endTime: string; daysOfWeek: number[] }): Promise<ShiftTemplate> {
  return apiFetch('/shift-templates', { method: 'POST', body: JSON.stringify(input) });
}

export function deactivateShiftTemplate(id: string): Promise<ShiftTemplate> {
  return apiFetch(`/shift-templates/${id}/deactivate`, { method: 'PATCH' });
}

export function fetchRoster(branchId: string, from: string, to: string): Promise<ShiftAssignment[]> {
  return apiFetch(`/shift-assignments?branchId=${branchId}&from=${from}&to=${to}`);
}

export function createShiftAssignment(input: { branchId: string; staffId: string; shiftTemplateId: string; date: string }): Promise<ShiftAssignment> {
  return apiFetch('/shift-assignments', { method: 'POST', body: JSON.stringify(input) });
}

export function deleteShiftAssignment(id: string): Promise<void> {
  return apiFetch(`/shift-assignments/${id}`, { method: 'DELETE' });
}

// --- Attendance: records & reporting ---
export function fetchAttendanceRecords(branchId: string, from: string, to: string): Promise<AttendanceRecord[]> {
  return apiFetch(`/attendance?branchId=${branchId}&from=${from}&to=${to}`);
}

export function fetchHoursSummary(branchId: string, from: string, to: string): Promise<Record<string, number>> {
  return apiFetch(`/attendance/hours-summary?branchId=${branchId}&from=${from}&to=${to}`);
}

export function fetchAbsences(branchId: string, date: string): Promise<ShiftAssignment[]> {
  return apiFetch(`/attendance/absences?branchId=${branchId}&date=${date}`);
}

// --- Payroll ---
export function fetchPayRates(staffId: string): Promise<PayRate[]> {
  return apiFetch(`/pay-rates/staff/${staffId}`);
}

export function setPayRate(input: { staffId: string; payType: 'hourly' | 'monthly'; baseRate: string; overtimeMultiplier?: string; effectiveFrom?: string }): Promise<PayRate> {
  return apiFetch('/pay-rates', { method: 'POST', body: JSON.stringify(input) });
}

export function fetchPayrollAdvances(staffId: string): Promise<PayrollAdvance[]> {
  return apiFetch(`/payroll-advances/staff/${staffId}`);
}

export function issueAdvance(input: { staffId: string; branchId: string; amount: string; reason?: string }): Promise<PayrollAdvance> {
  return apiFetch('/payroll-advances', { method: 'POST', body: JSON.stringify(input) });
}

export function fetchPayrollRuns(branchId: string): Promise<PayrollRun[]> {
  return apiFetch(`/payroll-runs?branchId=${branchId}`);
}

export function generatePayrollRun(input: { branchId: string; periodStart: string; periodEnd: string }): Promise<PayrollRun> {
  return apiFetch('/payroll-runs', { method: 'POST', body: JSON.stringify(input) });
}

export function fetchPayrollLines(runId: string): Promise<PayrollLine[]> {
  return apiFetch(`/payroll-runs/${runId}/lines`);
}

export function addPayrollAdjustment(lineId: string, input: { type: 'bonus' | 'deduction'; amount: string; note?: string }): Promise<PayrollLine> {
  return apiFetch(`/payroll-lines/${lineId}/adjustments`, { method: 'POST', body: JSON.stringify(input) });
}

export function finalizePayrollRun(id: string): Promise<PayrollRun> {
  return apiFetch(`/payroll-runs/${id}/finalize`, { method: 'PATCH' });
}

export function markPayrollRunPaid(id: string): Promise<PayrollRun> {
  return apiFetch(`/payroll-runs/${id}/mark-paid`, { method: 'PATCH' });
}

// --- Expenses ---
export function fetchExpenseCategories(restaurantId: string): Promise<ExpenseCategory[]> {
  return apiFetch(`/expenses/categories?restaurantId=${restaurantId}`);
}

export function createExpenseCategory(input: { restaurantId: string; name: string }): Promise<ExpenseCategory> {
  return apiFetch('/expenses/categories', { method: 'POST', body: JSON.stringify(input) });
}

export function fetchExpenses(branchId: string, from?: string, to?: string): Promise<Expense[]> {
  const range = from && to ? `&from=${from}&to=${to}` : '';
  return apiFetch(`/expenses?branchId=${branchId}${range}`);
}

export function logExpense(input: { branchId: string; categoryId: string; amount: string; description: string; receiptNote?: string; spentAt?: string }): Promise<Expense> {
  return apiFetch('/expenses', { method: 'POST', body: JSON.stringify(input) });
}

// --- Purchasing: suppliers ---
export function fetchSuppliers(restaurantId: string): Promise<Supplier[]> {
  return apiFetch(`/suppliers?restaurantId=${restaurantId}`);
}

export function createSupplier(input: { restaurantId: string; name: string; contactName?: string; phone?: string; email?: string; address?: string; paymentTermsDays?: number }): Promise<Supplier> {
  return apiFetch('/suppliers', { method: 'POST', body: JSON.stringify(input) });
}

export function fetchSupplierBalance(id: string): Promise<SupplierBalance> {
  return apiFetch(`/suppliers/${id}/balance`);
}

export function fetchSupplierPayments(id: string): Promise<SupplierPayment[]> {
  return apiFetch(`/suppliers/${id}/payments`);
}

// --- Purchasing: purchase orders ---
export interface PurchaseOrderItemInput {
  itemName: string;
  unit?: string;
  quantityOrdered: string;
  unitCost: string;
}

export function fetchPurchaseOrders(branchId: string): Promise<PurchaseOrder[]> {
  return apiFetch(`/purchase-orders?branchId=${branchId}`);
}

export function fetchPurchaseOrder(id: string): Promise<PurchaseOrder> {
  return apiFetch(`/purchase-orders/${id}`);
}

export function createPurchaseOrder(input: { branchId: string; supplierId: string; expectedAt?: string; notes?: string; items: PurchaseOrderItemInput[] }): Promise<PurchaseOrder> {
  return apiFetch('/purchase-orders', { method: 'POST', body: JSON.stringify(input) });
}

export function placePurchaseOrder(id: string): Promise<PurchaseOrder> {
  return apiFetch(`/purchase-orders/${id}/place`, { method: 'PATCH' });
}

export function cancelPurchaseOrder(id: string): Promise<PurchaseOrder> {
  return apiFetch(`/purchase-orders/${id}/cancel`, { method: 'PATCH' });
}

export function fetchPurchaseOrderReceipts(id: string): Promise<PurchaseOrderReceipt[]> {
  return apiFetch(`/purchase-orders/${id}/receipts`);
}

export function receivePurchaseOrder(id: string, input: { note?: string; lines: { purchaseOrderItemId: string; quantityReceived: string }[] }): Promise<PurchaseOrderReceipt> {
  return apiFetch(`/purchase-orders/${id}/receive`, { method: 'POST', body: JSON.stringify(input) });
}

export function recordSupplierPayment(input: { branchId: string; supplierId: string; purchaseOrderId?: string; amount: string; method: PaymentMethod; note?: string }): Promise<SupplierPayment> {
  return apiFetch('/supplier-payments', { method: 'POST', body: JSON.stringify(input) });
}

// --- Cash drawer ---
export function fetchCashDrawerSessions(branchId: string): Promise<CashDrawerSession[]> {
  return apiFetch(`/payments/cash-drawer-sessions?branchId=${branchId}`);
}
