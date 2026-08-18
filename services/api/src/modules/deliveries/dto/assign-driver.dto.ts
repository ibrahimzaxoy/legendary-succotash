import { IsUUID } from 'class-validator';

// Manual v1 dispatch: a branch dispatcher/manager picks an available
// in-house driver from the Management Dashboard's live orders view.
export class AssignDriverDto {
  @IsUUID()
  driverStaffId: string;
}
