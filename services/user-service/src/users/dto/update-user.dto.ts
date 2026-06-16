import { UserStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: '9999999999' })
  @IsOptional()
  @Matches(/^\d{10}$/)
  mobile?: string;

  @ApiPropertyOptional({ example: 'john@test.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiPropertyOptional({ description: 'Accepted for API compatibility; user-location mapping is not in Sprint 1 schema.' })
  @IsOptional()
  @IsUUID()
  locationId?: string;
}
