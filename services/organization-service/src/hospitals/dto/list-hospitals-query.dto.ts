import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ActivePaginationQueryDto } from '../../common/dto/active-pagination-query.dto';

export const hospitalSortFields = [
  'hospitalName',
  'hospitalCode',
  'city',
  'state',
  'isActive',
  'createdAt',
  'updatedAt'
] as const;
export type HospitalSortField = (typeof hospitalSortFields)[number];

export class ListHospitalsQueryDto extends ActivePaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ default: 'createdAt', enum: hospitalSortFields })
  @IsIn(hospitalSortFields)
  @IsOptional()
  sortBy?: HospitalSortField;
}
