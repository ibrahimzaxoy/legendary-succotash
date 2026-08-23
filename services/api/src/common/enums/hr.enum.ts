export enum ShiftAssignmentStatus {
  SCHEDULED = 'scheduled',
  SWAPPED = 'swapped',
  CANCELLED = 'cancelled',
}

export enum ClockMethod {
  PIN = 'pin',
}

export enum AttendanceStatus {
  PRESENT = 'present',
  LATE = 'late',
  EARLY_LEAVE = 'early_leave',
  UNSCHEDULED = 'unscheduled',
  ABSENT = 'absent',
}

export enum PayType {
  HOURLY = 'hourly',
  MONTHLY = 'monthly',
}

export enum PayrollRunStatus {
  DRAFT = 'draft',
  FINALIZED = 'finalized',
  PAID = 'paid',
}

export enum PayrollAdjustmentType {
  BONUS = 'bonus',
  DEDUCTION = 'deduction',
}

export enum PayrollAdvanceStatus {
  ACTIVE = 'active',
  SETTLED = 'settled',
}
