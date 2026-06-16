import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditLogService } from '../common/audit/audit-log.service';
import { getPageMeta, getPagination } from '../common/pagination';
import type { ActorContext } from '../common/request-context';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import {
  ListRestaurantsQueryDto,
  RestaurantSortField
} from './dto/list-restaurants-query.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { RestaurantsRepository, RestaurantWithRelations } from './restaurants.repository';

type RestaurantClient = Prisma.TransactionClient;

function toRestaurantResponse(restaurant: RestaurantWithRelations) {
  return {
    address: restaurant.address,
    b2cQrEnabled: restaurant.b2cQrEnabled,
    bankBranch: restaurant.bankBranch,
    bankName: restaurant.bankName,
    closingTime: restaurant.closingTime,
    createdAt: restaurant.createdAt,
    deletedAt: restaurant.deletedAt,
    fssaiNumber: restaurant.fssaiNumber,
    gstNumber: restaurant.gstNumber,
    hospital: {
      hospitalCode: restaurant.hospital.hospitalCode,
      hospitalName: restaurant.hospital.hospitalName,
      id: restaurant.hospital.id,
      isActive: restaurant.hospital.isActive
    },
    hospitalId: restaurant.hospitalId,
    id: restaurant.id,
    inRoomDiningEnabled: restaurant.inRoomDiningEnabled,
    isActive: restaurant.isActive,
    kitchen: restaurant.kitchen
      ? {
          id: restaurant.kitchen.id,
          isActive: restaurant.kitchen.isActive,
          kitchenCode: restaurant.kitchen.kitchenCode,
          kitchenName: restaurant.kitchen.kitchenName
        }
      : null,
    kitchenId: restaurant.kitchenId,
    location: restaurant.location
      ? {
          id: restaurant.location.id,
          isActive: restaurant.location.isActive,
          locationName: restaurant.location.locationName
        }
      : null,
    locationId: restaurant.locationId,
    normalDiscountApplicable: restaurant.normalDiscountApplicable,
    onlineOrderingEnabled: restaurant.onlineOrderingEnabled,
    openingTime: restaurant.openingTime,
    panNumber: restaurant.panNumber,
    restaurantCode: restaurant.restaurantCode,
    restaurantName: restaurant.restaurantName,
    staffDiscountApplicable: restaurant.staffDiscountApplicable,
    store: restaurant.store
      ? {
          id: restaurant.store.id,
          isActive: restaurant.store.isActive,
          storeCode: restaurant.store.storeCode,
          storeName: restaurant.store.storeName
        }
      : null,
    storeId: restaurant.storeId,
    sunBu: restaurant.sunBu,
    sunT1: restaurant.sunT1,
    sunT2: restaurant.sunT2,
    updatedAt: restaurant.updatedAt,
    upiId: restaurant.upiId
  };
}

function getRestaurantOrderBy(
  query: ListRestaurantsQueryDto,
): Prisma.RestaurantOrderByWithRelationInput {
  const sortBy: RestaurantSortField = query.sortBy ?? 'createdAt';

  return {
    [sortBy]: query.sortOrder ?? 'desc'
  };
}

@Injectable()
export class RestaurantsService {
  constructor(
    private readonly auditLog: AuditLogService,
    private readonly restaurants: RestaurantsRepository,
  ) {}

  async list(query: ListRestaurantsQueryDto) {
    const { limit, page } = getPagination(query);
    const where: Prisma.RestaurantWhereInput = {
      deletedAt: null,
      hospital: {
        deletedAt: null
      },
      ...(query.hospitalId ? { hospitalId: query.hospitalId } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.kitchenId ? { kitchenId: query.kitchenId } : {}),
      ...(query.locationId ? { locationId: query.locationId } : {}),
      ...(query.storeId ? { storeId: query.storeId } : {}),
      ...(query.search
        ? {
            OR: [
              { fssaiNumber: { contains: query.search, mode: 'insensitive' } },
              { gstNumber: { contains: query.search, mode: 'insensitive' } },
              { hospital: { hospitalName: { contains: query.search, mode: 'insensitive' } } },
              { kitchen: { kitchenName: { contains: query.search, mode: 'insensitive' } } },
              { location: { locationName: { contains: query.search, mode: 'insensitive' } } },
              { restaurantCode: { contains: query.search, mode: 'insensitive' } },
              { restaurantName: { contains: query.search, mode: 'insensitive' } },
              { store: { storeName: { contains: query.search, mode: 'insensitive' } } }
            ]
          }
        : {})
    };

    const [items, total] = await Promise.all([
      this.restaurants.findMany({
        orderBy: getRestaurantOrderBy(query),
        skip: (page - 1) * limit,
        take: limit,
        where
      }),
      this.restaurants.count({ where })
    ]);

    return {
      items: items.map(toRestaurantResponse),
      meta: getPageMeta(page, limit, total)
    };
  }

  async getById(id: string) {
    const restaurant = await this.findActiveRestaurant(id);

    return toRestaurantResponse(restaurant);
  }

  async create(dto: CreateRestaurantDto, context: ActorContext) {
    try {
      const created = await this.restaurants.transaction(async (tx) => {
        await this.assertActiveHospital(dto.hospitalId, tx);

        if (dto.locationId) {
          await this.assertActiveLocation(dto.locationId, dto.hospitalId, tx);
        }

        if (dto.storeId) {
          await this.assertActiveStore(dto.storeId, dto.hospitalId, tx);
        }

        if (dto.kitchenId) {
          await this.assertActiveKitchen(dto.kitchenId, dto.hospitalId, tx);
        }

        await this.assertUniqueRestaurantCode(
          dto.hospitalId,
          dto.restaurantCode,
          undefined,
          tx,
        );

        const restaurant = await this.restaurants.create(
          {
            address: dto.address,
            b2cQrEnabled: dto.b2cQrEnabled ?? false,
            bankBranch: dto.bankBranch,
            bankName: dto.bankName,
            closingTime: dto.closingTime,
            createdBy: context.actorId,
            fssaiNumber: dto.fssaiNumber,
            gstNumber: dto.gstNumber,
            hospitalId: dto.hospitalId,
            inRoomDiningEnabled: dto.inRoomDiningEnabled ?? false,
            isActive: dto.isActive ?? true,
            kitchenId: dto.kitchenId,
            locationId: dto.locationId,
            normalDiscountApplicable: dto.normalDiscountApplicable ?? false,
            onlineOrderingEnabled: dto.onlineOrderingEnabled ?? false,
            openingTime: dto.openingTime,
            panNumber: dto.panNumber,
            restaurantCode: dto.restaurantCode,
            restaurantName: dto.restaurantName,
            staffDiscountApplicable: dto.staffDiscountApplicable ?? false,
            storeId: dto.storeId,
            sunBu: dto.sunBu,
            sunT1: dto.sunT1,
            sunT2: dto.sunT2,
            updatedBy: context.actorId,
            upiId: dto.upiId
          },
          tx,
        );

        await this.auditLog.record(
          {
            action: 'RESTAURANT_CREATE',
            actorId: context.actorId,
            entityId: restaurant.id,
            entityName: 'restaurants',
            hospitalId: restaurant.hospitalId,
            ipAddress: context.ipAddress,
            newValue: toRestaurantResponse(restaurant)
          },
          tx,
        );

        return restaurant;
      });

      return toRestaurantResponse(created);
    } catch (error) {
      this.handlePrismaError(error, 'Restaurant');
    }
  }

  async update(id: string, dto: UpdateRestaurantDto, context: ActorContext) {
    try {
      const updated = await this.restaurants.transaction(async (tx) => {
        const existing = await this.findActiveRestaurant(id, tx);
        const data: Prisma.RestaurantUpdateInput = {};
        const hospitalId = dto.hospitalId ?? existing.hospitalId;
        const restaurantCode = dto.restaurantCode ?? existing.restaurantCode;
        const storeId = dto.storeId ?? existing.storeId;
        const kitchenId = dto.kitchenId ?? existing.kitchenId;

        if (dto.hospitalId !== undefined) {
          await this.assertActiveHospital(dto.hospitalId, tx);
          data.hospital = {
            connect: {
              id: dto.hospitalId
            }
          };
        }

        if (storeId) {
          await this.assertActiveStore(storeId, hospitalId, tx);
        }

        if (kitchenId) {
          await this.assertActiveKitchen(kitchenId, hospitalId, tx);
        }

        if (dto.address !== undefined) data.address = dto.address;
        if (dto.b2cQrEnabled !== undefined) data.b2cQrEnabled = dto.b2cQrEnabled;
        if (dto.bankBranch !== undefined) data.bankBranch = dto.bankBranch;
        if (dto.bankName !== undefined) data.bankName = dto.bankName;
        if (dto.closingTime !== undefined) data.closingTime = dto.closingTime;
        if (dto.fssaiNumber !== undefined) data.fssaiNumber = dto.fssaiNumber;
        if (dto.gstNumber !== undefined) data.gstNumber = dto.gstNumber;
        if (dto.inRoomDiningEnabled !== undefined) {
          data.inRoomDiningEnabled = dto.inRoomDiningEnabled;
        }
        if (dto.isActive !== undefined) data.isActive = dto.isActive;
        if (dto.kitchenId !== undefined) {
          data.kitchen = {
            connect: {
              id: dto.kitchenId
            }
          };
        }
        if (dto.locationId !== undefined) {
          await this.assertActiveLocation(dto.locationId, hospitalId, tx);
          data.location = {
            connect: {
              id: dto.locationId
            }
          };
        }
        if (dto.normalDiscountApplicable !== undefined) {
          data.normalDiscountApplicable = dto.normalDiscountApplicable;
        }
        if (dto.onlineOrderingEnabled !== undefined) {
          data.onlineOrderingEnabled = dto.onlineOrderingEnabled;
        }
        if (dto.openingTime !== undefined) data.openingTime = dto.openingTime;
        if (dto.panNumber !== undefined) data.panNumber = dto.panNumber;
        if (dto.restaurantCode !== undefined) data.restaurantCode = dto.restaurantCode;
        if (dto.restaurantName !== undefined) data.restaurantName = dto.restaurantName;
        if (dto.staffDiscountApplicable !== undefined) {
          data.staffDiscountApplicable = dto.staffDiscountApplicable;
        }
        if (dto.storeId !== undefined) {
          data.store = {
            connect: {
              id: dto.storeId
            }
          };
        }
        if (dto.sunBu !== undefined) data.sunBu = dto.sunBu;
        if (dto.sunT1 !== undefined) data.sunT1 = dto.sunT1;
        if (dto.sunT2 !== undefined) data.sunT2 = dto.sunT2;
        if (dto.upiId !== undefined) data.upiId = dto.upiId;

        if (dto.restaurantCode !== undefined || dto.hospitalId !== undefined) {
          await this.assertUniqueRestaurantCode(hospitalId, restaurantCode, id, tx);
        }

        if (Object.keys(data).length > 0) {
          data.updatedBy = context.actorId;
        }

        const restaurant = Object.keys(data).length
          ? await this.restaurants.update(id, data, tx)
          : existing;

        await this.auditLog.record(
          {
            action:
              dto.isActive !== undefined && dto.isActive !== existing.isActive
                ? 'RESTAURANT_STATUS_CHANGE'
                : 'RESTAURANT_UPDATE',
            actorId: context.actorId,
            entityId: id,
            entityName: 'restaurants',
            hospitalId: restaurant.hospitalId,
            ipAddress: context.ipAddress,
            newValue: toRestaurantResponse(restaurant),
            oldValue: toRestaurantResponse(existing)
          },
          tx,
        );

        return restaurant;
      });

      return toRestaurantResponse(updated);
    } catch (error) {
      this.handlePrismaError(error, 'Restaurant');
    }
  }

  async remove(id: string, context: ActorContext) {
    const existing = await this.findActiveRestaurant(id);

    await this.restaurants.transaction(async (tx) => {
      const deletedAt = new Date();

      await this.restaurants.softDeleteCounters(
        id,
        {
          deletedAt,
          updatedBy: context.actorId
        },
        tx,
      );
      await this.restaurants.update(
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
          action: 'RESTAURANT_DELETE',
          actorId: context.actorId,
          entityId: id,
          entityName: 'restaurants',
          hospitalId: existing.hospitalId,
          ipAddress: context.ipAddress,
          oldValue: toRestaurantResponse(existing)
        },
        tx,
      );
    });

    return {
      id
    };
  }

  private async assertActiveHospital(id: string, client: RestaurantClient): Promise<void> {
    const hospital = await this.restaurants.findActiveHospital(id, client);

    if (!hospital || !hospital.isActive) {
      throw new BadRequestException('Hospital not found or inactive');
    }
  }

  private async assertActiveKitchen(
    id: string,
    hospitalId: string,
    client: RestaurantClient,
  ): Promise<void> {
    const kitchen = await this.restaurants.findActiveKitchen(id, hospitalId, client);

    if (!kitchen || !kitchen.isActive) {
      throw new BadRequestException('Kitchen not found or inactive');
    }
  }

  private async assertActiveLocation(
    id: string,
    hospitalId: string,
    client: RestaurantClient,
  ): Promise<void> {
    const location = await this.restaurants.findActiveLocation(id, hospitalId, client);

    if (!location || !location.isActive) {
      throw new BadRequestException('Location not found or inactive');
    }
  }

  private async assertActiveStore(
    id: string,
    hospitalId: string,
    client: RestaurantClient,
  ): Promise<void> {
    const store = await this.restaurants.findActiveStore(id, hospitalId, client);

    if (!store || !store.isActive) {
      throw new BadRequestException('Store not found or inactive');
    }
  }

  private async assertUniqueRestaurantCode(
    hospitalId: string,
    restaurantCode: string,
    excludeId: string | undefined,
    client: RestaurantClient,
  ): Promise<void> {
    const restaurant = await this.restaurants.findByCodeWithinHospital(
      hospitalId,
      restaurantCode,
      excludeId,
      client,
    );

    if (restaurant) {
      throw new ConflictException('Restaurant code already exists within hospital');
    }
  }

  private async findActiveRestaurant(
    id: string,
    client?: RestaurantClient,
  ): Promise<RestaurantWithRelations> {
    const restaurant = await this.restaurants.findActiveById(id, client);

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  private handlePrismaError(error: unknown, entityName: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException(`${entityName} already exists`);
    }

    throw error;
  }
}
