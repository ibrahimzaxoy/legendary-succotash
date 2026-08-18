import { IsBoolean } from 'class-validator';

// Used for the "86" toggle - kitchen/manager marks an item unavailable and
// it disappears from ordering across every channel in real time.
export class SetAvailabilityDto {
  @IsBoolean()
  isAvailable: boolean;
}
