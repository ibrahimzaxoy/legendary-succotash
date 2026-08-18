import { IsIn } from 'class-validator';
import { TableStatus } from '../../../common/enums/order.enum';

// OCCUPIED is deliberately not settable here - it's system-derived the
// moment a dine-in order is created for a table (see OrdersService), not
// something staff toggle by hand. Staff can only move a table between the
// states that reflect the floor, not the order lifecycle.
const STAFF_SETTABLE_STATUSES = [TableStatus.FREE, TableStatus.NEEDS_CLEANING, TableStatus.RESERVED] as const;

export class SetTableStatusDto {
  @IsIn(STAFF_SETTABLE_STATUSES)
  status: (typeof STAFF_SETTABLE_STATUSES)[number];
}
