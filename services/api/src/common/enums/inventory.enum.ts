export enum InventoryUnit {
  KG = 'kg',
  G = 'g',
  L = 'l',
  ML = 'ml',
  EACH = 'each',
}

export enum InventoryAdjustmentReason {
  PURCHASE_RECEIPT = 'purchase_receipt',
  ORDER_DEDUCTION = 'order_deduction',
  WASTE = 'waste',
  MANUAL_CORRECTION = 'manual_correction',
  STOCKTAKE = 'stocktake',
}
