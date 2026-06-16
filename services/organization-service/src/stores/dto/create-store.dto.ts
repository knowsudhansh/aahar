import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty()
  @IsUUID()
  hospitalId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiProperty({ example: 'Main F&B Store' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  storeName!: string;

  @ApiProperty({ example: 'STORE001' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  storeCode!: string;

  @ApiPropertyOptional({ example: 'MRP' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  storeType?: string;

  @ApiPropertyOptional({ example: 'Ground Floor' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
