import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePosDeviceDto {
  @ApiProperty({ example: 'd2d2f99b-0d2d-4c94-8c8a-21d4f90c4f80' })
  @IsUUID()
  hospitalId!: string;

  @ApiProperty({ example: 'Main Cafeteria POS' })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'POS001' })
  @IsString()
  @MaxLength(50)
  code!: string;

  @ApiPropertyOptional({ example: 'Main cafeteria entity' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  entity?: string;

  @ApiPropertyOptional({ example: 'MAX-LKO-POS-01' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  hostName?: string;

  @ApiPropertyOptional({
    description: 'Restaurants this POS device can operate for.',
    example: ['0f7e08c8-66d9-4a50-994a-7e5c91565f9d'],
    type: [String],
  })
  @ArrayUnique()
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  restaurantIds?: string[];

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isKotPrintEnabled?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isInvoicePrintEnabled?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
