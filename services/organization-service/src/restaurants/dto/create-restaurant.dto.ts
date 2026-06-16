import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength
} from 'class-validator';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateRestaurantDto {
  @ApiProperty()
  @IsUUID()
  hospitalId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  kitchenId?: string;

  @ApiProperty({ example: 'Main Cafeteria' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  restaurantName!: string;

  @ApiProperty({ example: 'CAF001' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  restaurantCode!: string;

  @ApiPropertyOptional({ example: 'GST123456' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  gstNumber?: string;

  @ApiPropertyOptional({ example: 'ABCDE1234F' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  panNumber?: string;

  @ApiPropertyOptional({ example: 'FSSAI123456' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  fssaiNumber?: string;

  @ApiPropertyOptional({ example: 'Ground Floor' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: '07:00' })
  @IsOptional()
  @Matches(timePattern, { message: 'openingTime must use HH:mm format.' })
  openingTime?: string;

  @ApiPropertyOptional({ example: '23:00' })
  @IsOptional()
  @Matches(timePattern, { message: 'closingTime must use HH:mm format.' })
  closingTime?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  normalDiscountApplicable?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  staffDiscountApplicable?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  onlineOrderingEnabled?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  inRoomDiningEnabled?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  b2cQrEnabled?: boolean;

  @ApiPropertyOptional({ example: 'max@upi' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  upiId?: string;

  @ApiPropertyOptional({ example: 'HDFC Bank' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bankName?: string;

  @ApiPropertyOptional({ example: 'Saket' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bankBranch?: string;

  @ApiPropertyOptional({ example: 'BU001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sunBu?: string;

  @ApiPropertyOptional({ example: 'T1' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sunT1?: string;

  @ApiPropertyOptional({ example: 'T2' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sunT2?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
