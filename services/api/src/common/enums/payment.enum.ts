export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  ONLINE = 'online',
  WALLET = 'wallet',
}

export enum PaymentStatus {
  PENDING = 'pending',
  CAPTURED = 'captured',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum DeliveryStatus {
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  EN_ROUTE = 'en_route',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

// One immutable ledger line per financial event - never mutated, only appended.
export enum LedgerEntryType {
  SALE = 'sale',
  TAX = 'tax',
  DISCOUNT = 'discount',
  TIP = 'tip',
  REFUND = 'refund',
}
