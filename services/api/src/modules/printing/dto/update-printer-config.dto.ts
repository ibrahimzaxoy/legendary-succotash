import { IsBoolean, IsEnum, IsIP, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { PrinterConnectionType } from '../../../common/enums/printing.enum';

export class UpdatePrinterConfigDto {
  @IsOptional()
  @IsUUID()
  kitchenStationId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(PrinterConnectionType)
  connectionType?: PrinterConnectionType;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  @IsOptional()
  @IsInt()
  paperWidthMm?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
