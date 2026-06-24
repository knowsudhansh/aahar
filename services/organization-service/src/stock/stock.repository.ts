import { Injectable } from '@nestjs/common';
import { Prisma, Store } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

export const stockLedgerInclude = {
  hospital: {
    select: {
      hospitalCode: true,
      hospitalName: true,
      id: true,
      isActive: true,
    },
  },
  item: {
    select: {
      id: true,
      isActive: true,
      itemCode: true,
      itemName: true,
      itemType: true,
      type: true,
    },
  },
} satisfies Prisma.StockLedgerInclude;

export const stockBalanceInclude = {
  hospital: {
    select: {
      hospitalCode: true,
      hospitalName: true,
      id: true,
      isActive: true,
    },
  },
  item: {
    select: {
      id: true,
      isActive: true,
      itemCode: true,
      itemName: true,
      itemType: true,
      type: true,
    },
  },
} satisfies Prisma.StockBalanceInclude;

export type StockLedgerWithRelations = Prisma.StockLedgerGetPayload<{
  include: typeof stockLedgerInclude;
}>;
export type StockBalanceWithRelations = Prisma.StockBalanceGetPayload<{
  include: typeof stockBalanceInclude;
}>;

@Injectable()
export class StockRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countBalances(args: Prisma.StockBalanceCountArgs): Promise<number> {
    return this.prisma.stockBalance.count(args);
  }

  async countLedgers(args: Prisma.StockLedgerCountArgs): Promise<number> {
    return this.prisma.stockLedger.count(args);
  }

  async findBalances(args: Prisma.StockBalanceFindManyArgs): Promise<StockBalanceWithRelations[]> {
    return this.prisma.stockBalance.findMany({
      ...args,
      include: stockBalanceInclude,
    });
  }

  async findLedgers(args: Prisma.StockLedgerFindManyArgs): Promise<StockLedgerWithRelations[]> {
    return this.prisma.stockLedger.findMany({
      ...args,
      include: stockLedgerInclude,
    });
  }

  async findStoreIdsBySearch(search: string): Promise<string[]> {
    const stores = await this.prisma.store.findMany({
      select: {
        id: true,
      },
      where: {
        deletedAt: null,
        OR: [
          { storeCode: { contains: search, mode: 'insensitive' } },
          { storeName: { contains: search, mode: 'insensitive' } },
        ],
      },
    });

    return stores.map((store) => store.id);
  }

  async findStoresByIds(ids: string[]): Promise<Store[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.prisma.store.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }
}
