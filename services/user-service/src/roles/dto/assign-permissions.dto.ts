import { ArrayNotEmpty, ArrayUnique, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionsDto {
  @ApiProperty({ isArray: true, type: String })
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds!: string[];
}
