import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrimaryUpiProvider } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePaymentMachineDto {
  @ApiProperty({ example: 'd2d2f99b-0d2d-4c94-8c8a-21d4f90c4f80' })
  @IsUUID()
  hospitalId!: string;

  @ApiProperty({ example: '23f9a533-5456-42a5-a926-28084c5f6d4f' })
  @IsUUID()
  posDeviceId!: string;

  @ApiProperty({ example: 'Pine Labs Terminal 1' })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ example: 'PLSN00112233' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @ApiPropertyOptional({ example: 'MERCHANT001' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  pinelabMerchantId?: string;

  @ApiPropertyOptional({
    description:
      'Sensitive setup value. Responses mask this field; production should move it to Key Vault or encrypted storage.',
    example: 'secret-token',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  pinelabSecurityToken?: string;

  @ApiPropertyOptional({ example: 'IMEI001122334455' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pinelabImei?: string;

  @ApiPropertyOptional({ example: 'MAXPOS001' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  pinelabMerchantStorePosCode?: string;

  @ApiPropertyOptional({ enum: PrimaryUpiProvider })
  @IsEnum(PrimaryUpiProvider)
  @IsOptional()
  primaryUpi?: PrimaryUpiProvider;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
