export type Role = 'owner' | 'admin' | 'manager' | 'waiter' | 'cashier' | 'kitchen' | 'rider';

export interface StaffSummary {
  id: string;
  fullName: string;
  role: Role;
  restaurantId: string;
  branchId: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  staff: StaffSummary;
}

export interface Restaurant {
  id: string;
  name: string;
}

export interface Branch {
  id: string;
  restaurantId: string;
  name: string;
  address: string;
  phone: string | null;
}

export interface Staff {
  id: string;
  restaurantId: string;
  branchId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  active: boolean;
  onShift: boolean;
}

export type TableStatus = 'free' | 'occupied' | 'needs_cleaning' | 'reserved';

export interface RestaurantTable {
  id: string;
  branchId: string;
  number: string;
  zone: string | null;
  capacity: number;
  status: TableStatus;
}

export interface KitchenStation {
  id: string;
  branchId: string;
  name: string;
  isExpo: boolean;
  sortOrder: number;
}

export interface ModifierOption {
  id: string;
  name: string;
  priceDelta: string;
}

export interface ModifierGroup {
  id: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: ModifierOption[];
}

export interface MenuItemVariant {
  id: string;
  name: string;
  priceDelta: string;
  isDefault: boolean;
}

export interface MenuCategory {
  id: string;
  branchId: string;
  name: string;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  branchId: string;
  categoryId: string;
  kitchenStationId: string;
  name: string;
  description: string | null;
  basePrice: string;
  imageUrl: string | null;
  isAvailable: boolean;
  availableDineIn: boolean;
  availablePickup: boolean;
  availableDelivery: boolean;
  prepTimeMinutes: number;
  variants: MenuItemVariant[];
  modifierGroups: ModifierGroup[];
  kitchenStation: KitchenStation;
}

export type OrderChannel = 'mobile_delivery' | 'mobile_pickup' | 'dine_in_qr' | 'dine_in_waiter';
export type OrderStatus =
  | 'open'
  | 'in_kitchen'
  | 'ready'
  | 'served'
  | 'out_for_delivery'
  | 'completed'
  | 'paid'
  | 'closed'
  | 'cancelled';
export type OrderItemStatus = 'queued' | 'cooking' | 'ready' | 'served' | 'cancelled';

export interface OrderItem {
  id: string;
  nameSnapshot: string;
  quantity: number;
  status: OrderItemStatus;
}

export interface Order {
  id: string;
  branchId: string;
  channel: OrderChannel;
  status: OrderStatus;
  subtotal: string;
  total: string;
  customerName: string | null;
  deliveryAddress: string | null;
  tableId: string | null;
  table: RestaurantTable | null;
  items: OrderItem[];
  createdAt: string;
}

export type DeliveryStatus = 'assigned' | 'picked_up' | 'en_route' | 'delivered' | 'failed';

export interface Delivery {
  id: string;
  orderId: string;
  branchId: string;
  driverStaffId: string | null;
  address: string;
  status: DeliveryStatus;
}

export interface AccountingSummary {
  branchId: string;
  from: string;
  to: string;
  totals: Record<string, number>;
}

// --- Attendance ---

export interface ShiftTemplate {
  id: string;
  branchId: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  active: boolean;
}

export type ShiftAssignmentStatus = 'scheduled' | 'swapped' | 'cancelled';

export interface ShiftAssignment {
  id: string;
  branchId: string;
  staffId: string;
  staff: Staff;
  shiftTemplateId: string;
  shiftTemplate: ShiftTemplate;
  date: string;
  status: ShiftAssignmentStatus;
}

export type AttendanceStatus = 'present' | 'late' | 'early_leave' | 'unscheduled' | 'absent';

export interface AttendanceRecord {
  id: string;
  branchId: string;
  staffId: string;
  staff: Staff;
  shiftAssignmentId: string | null;
  clockInAt: string;
  clockOutAt: string | null;
  totalMinutesWorked: number | null;
  status: AttendanceStatus;
}

// --- Payroll ---

export type PayType = 'hourly' | 'monthly';

export interface PayRate {
  id: string;
  staffId: string;
  payType: PayType;
  baseRate: string;
  overtimeMultiplier: string;
  effectiveFrom: string;
}

export type PayrollAdvanceStatus = 'active' | 'settled';

export interface PayrollAdvance {
  id: string;
  staffId: string;
  branchId: string;
  amount: string;
  reason: string | null;
  remainingBalance: string;
  status: PayrollAdvanceStatus;
  issuedAt: string;
}

export type PayrollRunStatus = 'draft' | 'finalized' | 'paid';

export interface PayrollRun {
  id: string;
  branchId: string;
  periodStart: string;
  periodEnd: string;
  status: PayrollRunStatus;
  generatedAt: string;
  paidAt: string | null;
}

export type PayrollAdjustmentType = 'bonus' | 'deduction';

export interface PayrollAdjustment {
  id: string;
  payrollLineId: string;
  type: PayrollAdjustmentType;
  amount: string;
  note: string | null;
}

export interface PayrollLine {
  id: string;
  payrollRunId: string;
  staffId: string;
  staff: Staff;
  hoursWorked: string;
  overtimeHours: string;
  basePayAmount: string;
  overtimeAmount: string;
  bonusAmount: string;
  deductionAmount: string;
  advanceDeductionAmount: string;
  netPay: string;
  adjustments: PayrollAdjustment[];
}

// --- Expenses ---

export interface ExpenseCategory {
  id: string;
  restaurantId: string;
  name: string;
  isDefault: boolean;
}

export interface Expense {
  id: string;
  branchId: string;
  categoryId: string;
  category: ExpenseCategory;
  amount: string;
  description: string;
  receiptNote: string | null;
  loggedByStaffId: string;
  loggedBy: Staff;
  spentAt: string;
}

// --- Purchasing ---

export interface Supplier {
  id: string;
  restaurantId: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  paymentTermsDays: number;
  active: boolean;
}

export interface SupplierBalance {
  owed: number;
  paid: number;
  balance: number;
}

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  itemName: string;
  unit: string | null;
  quantityOrdered: string;
  quantityReceived: string;
  unitCost: string;
  lineTotal: string;
}

export interface PurchaseOrder {
  id: string;
  branchId: string;
  supplierId: string;
  supplier: Supplier;
  status: PurchaseOrderStatus;
  orderedAt: string | null;
  expectedAt: string | null;
  notes: string | null;
  items: PurchaseOrderItem[];
  createdAt: string;
}

export interface PurchaseOrderReceiptLine {
  id: string;
  purchaseOrderItemId: string;
  quantityReceived: string;
}

export interface PurchaseOrderReceipt {
  id: string;
  purchaseOrderId: string;
  receivedByStaffId: string | null;
  note: string | null;
  lines: PurchaseOrderReceiptLine[];
  receivedAt: string;
}

export type PaymentMethod = 'cash' | 'card' | 'online' | 'wallet';

export interface SupplierPayment {
  id: string;
  branchId: string;
  supplierId: string;
  purchaseOrderId: string | null;
  amount: string;
  method: PaymentMethod;
  note: string | null;
  paidAt: string;
}

// --- Inventory ---

export type InventoryUnit = 'kg' | 'g' | 'l' | 'ml' | 'each';

export interface InventoryItem {
  id: string;
  branchId: string;
  name: string;
  unit: InventoryUnit;
  currentStock: string;
  reorderThreshold: string;
  reorderQuantity: string;
  averageUnitCost: string;
  active: boolean;
}

export type InventoryAdjustmentReason = 'purchase_receipt' | 'order_deduction' | 'waste' | 'manual_correction' | 'stocktake';

export interface RecipeIngredient {
  id: string;
  menuItemId: string;
  menuItemVariantId: string | null;
  inventoryItemId: string;
  inventoryItem: InventoryItem;
  quantityRequired: string;
}

// --- Cash drawer ---

export type CashDrawerSessionStatus = 'open' | 'closed';

export interface CashDrawerSession {
  id: string;
  branchId: string;
  cashierStaffId: string;
  cashier: Staff;
  openingFloat: string;
  openedAt: string;
  closedAt: string | null;
  expectedClosingCash: string | null;
  countedClosingCash: string | null;
  variance: string | null;
  varianceNote: string | null;
  status: CashDrawerSessionStatus;
}

// --- Printing ---

export type PrinterConnectionType = 'network_tcp';
export type PrintJobType = 'kitchen_ticket' | 'pre_bill' | 'receipt';
export type PrintJobStatus = 'sent' | 'failed';

export interface PrinterConfig {
  id: string;
  branchId: string;
  kitchenStationId: string | null;
  name: string;
  connectionType: PrinterConnectionType;
  ipAddress: string;
  port: number;
  paperWidthMm: number;
  active: boolean;
}

export interface PrintJobLog {
  id: string;
  printerConfigId: string;
  jobType: PrintJobType;
  referenceId: string | null;
  status: PrintJobStatus;
  errorMessage: string | null;
  createdAt: string;
}
