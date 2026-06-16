import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateHospitalDto {
  @ApiProperty({ example: 'Max Healthcare' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  hospitalName!: string;

  @ApiProperty({ example: 'MAX' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  hospitalCode!: string;

  @ApiPropertyOptional({ example: 'Saket, New Delhi' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: 'New Delhi' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Delhi' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  gstApplicable?: boolean;

  @ApiPropertyOptional({ example: 'MAX' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  billPrefix?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
