import { UserStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'EMP001' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  employeeCode!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: '9999999999' })
  @Matches(/^\d{10}$/)
  mobile!: string;

  @ApiPropertyOptional({ example: 'john@test.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty()
  @IsUUID()
  roleId!: string;

  @ApiPropertyOptional({ description: 'Accepted for API compatibility; user-location mapping is not in Sprint 1 schema.' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
