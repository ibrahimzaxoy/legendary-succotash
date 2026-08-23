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

export enum CashDrawerSessionStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

export enum DeliveryStatus {
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  EN_ROUTE = 'en_route',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

// One immutable ledger line per financial event - never mutated, only appended.
// Cash-basis: these are all actual cash movements. Accrued-but-unpaid
// balances (an open purchase order, a draft/unpaid payroll run) live on
// their own source records, not here, until the moment they're settled.
export enum LedgerEntryType {
  SALE = 'sale',
  TAX = 'tax',
  DISCOUNT = 'discount',
  TIP = 'tip',
  REFUND = 'refund',
  EXPENSE = 'expense',
  PAYROLL_PAYOUT = 'payroll_payout',
  SUPPLIER_PAYMENT = 'supplier_payment',
  CASH_DRAWER_VARIANCE = 'cash_drawer_variance',
}
