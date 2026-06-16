import { Injectable } from '@nestjs/common';
import { Hospital, Kitchen, Location, Prisma, Store } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

export const restaurantInclude = {
  hospital: true,
  kitchen: true,
  location: true,
  store: true
} satisfies Prisma.RestaurantInclude;

export type RestaurantWithRelations = Prisma.RestaurantGetPayload<{
  include: typeof restaurantInclude;
}>;

type RestaurantClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class RestaurantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(handler: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(handler);
  }

  async count(args: Prisma.RestaurantCountArgs): Promise<number> {
    return this.prisma.restaurant.count(args);
  }

  async create(
    data: Prisma.RestaurantUncheckedCreateInput,
    client: RestaurantClient,
  ): Promise<RestaurantWithRelations> {
    return client.restaurant.create({
      data,
      include: restaurantInclude
    });
  }

  async findActiveById(
    id: string,
    client: RestaurantClient = this.prisma,
  ): Promise<RestaurantWithRelations | null> {
    return client.restaurant.findFirst({
      include: restaurantInclude,
      where: {
        deletedAt: null,
        hospital: {
          deletedAt: null
        },
        id
      }
    });
  }

  async findActiveHospital(id: string, client: RestaurantClient): Promise<Hospital | null> {
    return client.hospital.findFirst({
      where: {
        deletedAt: null,
        id
      }
    });
  }

  async findActiveKitchen(
    id: string,
    hospitalId: string,
    client: RestaurantClient,
  ): Promise<Kitchen | null> {
    return client.kitchen.findFirst({
      where: {
        deletedAt: null,
        hospitalId,
        id
      }
    });
  }

  async findActiveLocation(
    id: string,
    hospitalId: string,
    client: RestaurantClient,
  ): Promise<Location | null> {
    return client.location.findFirst({
      where: {
        deletedAt: null,
        hospitalId,
        id
      }
    });
  }

  async findActiveStore(
    id: string,
    hospitalId: string,
    client: RestaurantClient,
  ): Promise<Store | null> {
    return client.store.findFirst({
      where: {
        deletedAt: null,
        hospitalId,
        id
      }
    });
  }

  async findByCodeWithinHospital(
    hospitalId: string,
    restaurantCode: string,
    excludeId?: string,
    client: RestaurantClient = this.prisma,
  ): Promise<RestaurantWithRelations | null> {
    return client.restaurant.findFirst({
      include: restaurantInclude,
      where: {
        hospitalId,
        restaurantCode,
        ...(excludeId ? { id: { not: excludeId } } : {})
      }
    });
  }

  async findMany(args: Prisma.RestaurantFindManyArgs): Promise<RestaurantWithRelations[]> {
    return this.prisma.restaurant.findMany({
      ...args,
      include: restaurantInclude
    });
  }

  async softDeleteCounters(
    restaurantId: string,
    data: {
      deletedAt: Date;
      updatedBy?: string;
    },
    client: RestaurantClient,
  ): Promise<void> {
    await client.counter.updateMany({
      data: {
        deletedAt: data.deletedAt,
        isActive: false,
        updatedBy: data.updatedBy
      },
      where: {
        deletedAt: null,
        restaurantId
      }
    });
  }

  async update(
    id: string,
    data: Prisma.RestaurantUpdateInput,
    client: RestaurantClient,
  ): Promise<RestaurantWithRelations> {
    return client.restaurant.update({
      data,
      include: restaurantInclude,
      where: {
        id
      }
    });
  }
}
