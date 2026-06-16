import { Module } from '@nestjs/common';
import { AuditLogService } from './audit/audit-log.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
  exports: [AuditLogService, PrismaService],
  providers: [AuditLogService, PrismaService]
})
export class CommonModule {}
