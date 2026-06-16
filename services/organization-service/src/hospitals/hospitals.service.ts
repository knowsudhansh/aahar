import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Hospital, Prisma } from '@prisma/client';
import { AuditLogService } from '../common/audit/audit-log.service';
import { getPageMeta, getPagination } from '../common/pagination';
import type { ActorContext } from '../common/request-context';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { HospitalSortField, ListHospitalsQueryDto } from './dto/list-hospitals-query.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { HospitalsRepository } from './hospitals.repository';

type HospitalClient = Prisma.TransactionClient;

function toHospitalResponse(hospital: Hospital) {
  return {
    address: hospital.address,
    billPrefix: hospital.billPrefix,
    city: hospital.city,
    createdAt: hospital.createdAt,
    deletedAt: hospital.deletedAt,
    gstApplicable: hospital.gstApplicable,
    hospitalCode: hospital.hospitalCode,
    hospitalName: hospital.hospitalName,
    id: hospital.id,
    isActive: hospital.isActive,
    state: hospital.state,
    updatedAt: hospital.updatedAt
  };
}

function getHospitalOrderBy(query: ListHospitalsQueryDto): Prisma.HospitalOrderByWithRelationInput {
  const sortBy: HospitalSortField = query.sortBy ?? 'createdAt';

  return {
    [sortBy]: query.sortOrder ?? 'desc'
  };
}

@Injectable()
export class HospitalsService {
  constructor(
    private readonly auditLog: AuditLogService,
    private readonly hospitals: HospitalsRepository,
  ) {}

  async list(query: ListHospitalsQueryDto) {
    const { limit, page } = getPagination(query);
    const where: Prisma.HospitalWhereInput = {
      deletedAt: null,
      ...(query.city ? { city: { contains: query.city, mode: 'insensitive' } } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.state ? { state: { contains: query.state, mode: 'insensitive' } } : {}),
      ...(query.search
        ? {
            OR: [
              { billPrefix: { contains: query.search, mode: 'insensitive' } },
              { city: { contains: query.search, mode: 'insensitive' } },
              { hospitalCode: { contains: query.search, mode: 'insensitive' } },
              { hospitalName: { contains: query.search, mode: 'insensitive' } },
              { state: { contains: query.search, mode: 'insensitive' } }
            ]
          }
        : {})
    };

    const [items, total] = await Promise.all([
      this.hospitals.findMany({
        orderBy: getHospitalOrderBy(query),
        skip: (page - 1) * limit,
        take: limit,
        where
      }),
      this.hospitals.count({ where })
    ]);

    return {
      items: items.map(toHospitalResponse),
      meta: getPageMeta(page, limit, total)
    };
  }

  async getById(id: string) {
    const hospital = await this.findActiveHospital(id);

    return toHospitalResponse(hospital);
  }

  async create(dto: CreateHospitalDto, context: ActorContext) {
    try {
      const created = await this.hospitals.transaction(async (tx) => {
        await this.assertUniqueHospital(dto.hospitalCode, dto.billPrefix, undefined, tx);

        const hospital = await this.hospitals.create(
          {
            address: dto.address,
            billPrefix: dto.billPrefix,
            city: dto.city,
            createdBy: context.actorId,
            gstApplicable: dto.gstApplicable ?? true,
            hospitalCode: dto.hospitalCode,
            hospitalName: dto.hospitalName,
            isActive: dto.isActive ?? true,
            state: dto.state,
            updatedBy: context.actorId
          },
          tx,
        );

        await this.auditLog.record(
          {
            action: 'HOSPITAL_CREATE',
            actorId: context.actorId,
            entityId: hospital.id,
            entityName: 'hospitals',
            hospitalId: hospital.id,
            ipAddress: context.ipAddress,
            newValue: toHospitalResponse(hospital)
          },
          tx,
        );

        return hospital;
      });

      return toHospitalResponse(created);
    } catch (error) {
      this.handlePrismaError(error, 'Hospital');
    }
  }

  async update(id: string, dto: UpdateHospitalDto, context: ActorContext) {
    try {
      const updated = await this.hospitals.transaction(async (tx) => {
        const existing = await this.findActiveHospital(id, tx);
        const data: Prisma.HospitalUpdateInput = {};

        if (dto.address !== undefined) {
          data.address = dto.address;
        }

        if (dto.billPrefix !== undefined) {
          data.billPrefix = dto.billPrefix;
        }

        if (dto.city !== undefined) {
          data.city = dto.city;
        }

        if (dto.gstApplicable !== undefined) {
          data.gstApplicable = dto.gstApplicable;
        }

        if (dto.hospitalCode !== undefined) {
          data.hospitalCode = dto.hospitalCode;
        }

        if (dto.hospitalName !== undefined) {
          data.hospitalName = dto.hospitalName;
        }

        if (dto.isActive !== undefined) {
          data.isActive = dto.isActive;
        }

        if (dto.state !== undefined) {
          data.state = dto.state;
        }

        await this.assertUniqueHospital(
          dto.hospitalCode !== undefined && dto.hospitalCode !== existing.hospitalCode
            ? dto.hospitalCode
            : undefined,
          dto.billPrefix !== undefined && dto.billPrefix !== existing.billPrefix
            ? dto.billPrefix
            : undefined,
          id,
          tx,
        );

        if (Object.keys(data).length > 0) {
          data.updatedBy = context.actorId;
        }

        const hospital = Object.keys(data).length
          ? await this.hospitals.update(id, data, tx)
          : existing;

        await this.auditLog.record(
          {
            action:
              dto.isActive !== undefined && dto.isActive !== existing.isActive
                ? 'HOSPITAL_STATUS_CHANGE'
                : 'HOSPITAL_UPDATE',
            actorId: context.actorId,
            entityId: id,
            entityName: 'hospitals',
            hospitalId: id,
            ipAddress: context.ipAddress,
            newValue: toHospitalResponse(hospital),
            oldValue: toHospitalResponse(existing)
          },
          tx,
        );

        return hospital;
      });

      return toHospitalResponse(updated);
    } catch (error) {
      this.handlePrismaError(error, 'Hospital');
    }
  }

  async remove(id: string, context: ActorContext) {
    const existing = await this.findActiveHospital(id);

    await this.hospitals.transaction(async (tx) => {
      const deletedAt = new Date();

      await this.hospitals.softDeleteChildren(
        id,
        {
          deletedAt,
          updatedBy: context.actorId
        },
        tx,
      );
      await this.hospitals.update(
        id,
        {
          deletedAt,
          isActive: false,
          updatedBy: context.actorId
        },
        tx,
      );
      await this.auditLog.record(
        {
          action: 'HOSPITAL_DELETE',
          actorId: context.actorId,
          entityId: id,
          entityName: 'hospitals',
          hospitalId: id,
          ipAddress: context.ipAddress,
          oldValue: toHospitalResponse(existing)
        },
        tx,
      );
    });

    return {
      id
    };
  }

  private async assertUniqueHospital(
    hospitalCode: string | undefined,
    billPrefix: string | undefined,
    excludeId: string | undefined,
    client: HospitalClient,
  ): Promise<void> {
    const [hospitalWithCode, hospitalWithBillPrefix] = await Promise.all([
      hospitalCode ? this.hospitals.findByCode(hospitalCode, excludeId, client) : null,
      billPrefix ? this.hospitals.findByBillPrefix(billPrefix, excludeId, client) : null
    ]);

    if (hospitalWithCode) {
      throw new ConflictException('Hospital code already exists');
    }

    if (hospitalWithBillPrefix) {
      throw new ConflictException('Bill prefix already exists');
    }
  }

  private async findActiveHospital(id: string, client?: HospitalClient): Promise<Hospital> {
    const hospital = await this.hospitals.findActiveById(id, client);

    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    return hospital;
  }

  private handlePrismaError(error: unknown, entityName: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException(`${entityName} already exists`);
    }

    throw error;
  }
}
