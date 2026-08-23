// A deduction that leaves stock at/below its reorder threshold fires this -
// the Management Dashboard's Inventory tab surfaces it as a banner/list.
// No push/SMS for this in v1: it's a management-facing signal, not a
// customer- or floor-staff-facing one (see the plan doc's §14).
export const INVENTORY_LOW_STOCK = 'inventory.low_stock';

export interface InventoryLowStockEvent {
  branchId: string;
  inventoryItemId: string;
  name: string;
  currentStock: string;
  reorderThreshold: string;
}
