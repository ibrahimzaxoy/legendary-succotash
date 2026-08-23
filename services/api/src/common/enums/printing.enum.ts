export enum PrinterConnectionType {
  // LAN-only in v1 - see IMPLEMENTATION_PLAN.md §17. USB is a reserved
  // future value, not implemented.
  NETWORK_TCP = 'network_tcp',
}

export enum PrintJobType {
  KITCHEN_TICKET = 'kitchen_ticket',
  PRE_BILL = 'pre_bill',
  RECEIPT = 'receipt',
}

export enum PrintJobStatus {
  SENT = 'sent',
  FAILED = 'failed',
}
