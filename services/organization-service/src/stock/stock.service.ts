import { Injectable } from '@nestjs/common';
import { InventoryLocationType, Prisma } from '@prisma/client';
import { getPageMeta, getPagination } from '../common/pagination';
import {
  ListStockBalancesQueryDto,
  StockBalanceSortField,
  StockBalanceStatus,
} from './dto/list-stock-balances-query.dto';
import { ListStockLedgersQueryDto, StockLedgerSortField } from './dto/list-stock-ledgers-query.dto';
import {
  StockBalanceWithRelations,
  StockLedgerWithRelations,
  StockRepository,
} from './stock.repository';

function toDate(value: string): Date {
  return new Date(value);
}

function toDateOnly(value: string | Date): Date {
  const date = value instanceof Date ? new Date(value) : new Date(value);

  date.setHours(0, 0, 0, 0);

  return date;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);

  next.setDate(next.getDate() + days);

  return next;
}

function toNumber(value: Prisma.Decimal | number): number {
  return Number(value);
}

function getLedgerOrderBy(
  query: ListStockLedgersQueryDto,
): Prisma.StockLedgerOrderByWithRelationInput {
  const sortBy: StockLedgerSortField = query.sortBy ?? 'transactionDateTime';

  return {
    [sortBy]: query.sortOrder ?? 'desc',
  };
}

function getBalanceOrderBy(
  query: ListStockBalancesQueryDto,
): Prisma.StockBalanceOrderByWithRelationInput {
  const sortBy: StockBalanceSortField = query.sortBy ?? 'lastUpdatedOn';

  return {
    [sortBy]: query.sortOrder ?? 'desc',
  };
}

function getBalanceStatus(balance: StockBalanceWithRelations): StockBalanceStatus {
  const availableQty = toNumber(balance.availableQty);
  const today = toDateOnly(new Date());
  const nearExpiryCutoff = addDays(today, 30);

  if (availableQty <= 0) {
    return 'OUT_OF_STOCK';
  }

  if (balance.expiryDate && toDateOnly(balance.expiryDate) < today) {
    return 'EXPIRED';
  }

  if (
    balance.expiryDate &&
    toDateOnly(balance.expiryDate) >= today &&
    toDateOnly(balance.expiryDate) <= nearExpiryCutoff
  ) {
    return 'NEAR_EXPIRY';
  }

  return 'AVAILABLE';
}

function getStatusWhere(status: StockBalanceStatus | undefined): Prisma.StockBalanceWhereInput {
  if (!status) {
    return {};
  }

  const today = toDateOnly(new Date());
  const nearExpiryCutoff = addDays(today, 30);

  if (status === 'OUT_OF_STOCK') {
    return {
      availableQty: {
        lte: 0,
      },
    };
  }

  if (status === 'EXPIRED') {
    return {
      availableQty: {
        gt: 0,
      },
      expiryDate: {
        lt: today,
      },
    };
  }

  if (status === 'NEAR_EXPIRY') {
    return {
      availableQty: {
        gt: 0,
      },
      expiryDate: {
        gte: today,
        lte: nearExpiryCutoff,
      },
    };
  }

  return {
    availableQty: {
      gt: 0,
    },
    OR: [
      {
        expiryDate: null,
      },
      {
        expiryDate: {
          gt: nearExpiryCutoff,
        },
      },
    ],
  };
}

function getStoreLocationMap(stores: Awaited<ReturnType<StockRepository['findStoresByIds']>>) {
  return new Map(
    stores.map((store) => [
      store.id,
      {
        code: store.storeCode,
        id: store.id,
        name: store.storeName,
        type: InventoryLocationType.STORE,
      },
    ]),
  );
}

function getStoreLocationIds<T extends { locationId: string; locationType: InventoryLocationType }>(
  rows: T[],
) {
  return [
    ...new Set(
      rows
        .filter((row) => row.locationType === InventoryLocationType.STORE)
        .map((row) => row.locationId),
    ),
  ];
}

@Injectable()
export class StockService {
  constructor(private readonly stock: StockRepository) {}

  async listBalances(query: ListStockBalancesQueryDto) {
    const { limit, page } = getPagination(query);
    const storeIdsForSearch = query.search
      ? await this.stock.findStoreIdsBySearch(query.search)
      : [];
    const where: Prisma.StockBalanceWhereInput = {
      deletedAt: null,
      ...getStatusWhere(query.status),
      ...(query.batchNumber
        ? { batchNumber: { contains: query.batchNumber, mode: 'insensitive' } }
        : {}),
      ...(query.expiryDate ? { expiryDate: toDateOnly(query.expiryDate) } : {}),
      ...(query.hospitalId ? { hospitalId: query.hospitalId } : {}),
      ...(query.itemId ? { itemId: query.itemId } : {}),
      ...(query.itemType ? { itemType: query.itemType } : {}),
      ...(query.locationId ? { locationId: query.locationId } : {}),
      ...(query.locationType ? { locationType: query.locationType } : {}),
      ...(query.search
        ? {
            OR: [
              { batchNumber: { contains: query.search, mode: 'insensitive' } },
              { hospital: { hospitalName: { contains: query.search, mode: 'insensitive' } } },
              { item: { itemCode: { contains: query.search, mode: 'insensitive' } } },
              { item: { itemName: { contains: query.search, mode: 'insensitive' } } },
              ...(storeIdsForSearch.length ? [{ locationId: { in: storeIdsForSearch } }] : []),
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.stock.findBalances({
        orderBy: getBalanceOrderBy(query),
        skip: (page - 1) * limit,
        take: limit,
        where,
      }),
      this.stock.countBalances({ where }),
    ]);
    const stores = await this.stock.findStoresByIds(getStoreLocationIds(items));
    const storeLocationMap = getStoreLocationMap(stores);

    return {
      items: items.map((item) => ({
        availableQty: toNumber(item.availableQty),
        batchNumber: item.batchNumber,
        createdAt: item.createdAt,
        deletedAt: item.deletedAt,
        expiryDate: item.expiryDate,
        hospital: item.hospital,
        hospitalId: item.hospitalId,
        id: item.id,
        item: item.item,
        itemId: item.itemId,
        itemType: item.itemType,
        lastUpdatedOn: item.lastUpdatedOn,
        location: storeLocationMap.get(item.locationId) ?? {
          code: null,
          id: item.locationId,
          name: item.locationId,
          type: item.locationType,
        },
        locationId: item.locationId,
        locationType: item.locationType,
        reservedQty: toNumber(item.reservedQty),
        status: getBalanceStatus(item),
        updatedAt: item.updatedAt,
      })),
      meta: getPageMeta(page, limit, total),
    };
  }

  async listLedgers(query: ListStockLedgersQueryDto) {
    const { limit, page } = getPagination(query);
    const storeIdsForSearch = query.search
      ? await this.stock.findStoreIdsBySearch(query.search)
      : [];
    const where: Prisma.StockLedgerWhereInput = {
      deletedAt: null,
      ...(query.batchNumber
        ? { batchNumber: { contains: query.batchNumber, mode: 'insensitive' } }
        : {}),
      ...(query.businessDate ? { businessDate: toDateOnly(query.businessDate) } : {}),
      ...(query.expiryDate ? { expiryDate: toDateOnly(query.expiryDate) } : {}),
      ...(query.fromDate || query.toDate
        ? {
            transactionDateTime: {
              ...(query.fromDate ? { gte: toDate(query.fromDate) } : {}),
              ...(query.toDate ? { lte: toDate(query.toDate) } : {}),
            },
          }
        : {}),
      ...(query.hospitalId ? { hospitalId: query.hospitalId } : {}),
      ...(query.itemId ? { itemId: query.itemId } : {}),
      ...(query.itemType ? { itemType: query.itemType } : {}),
      ...(query.locationId ? { locationId: query.locationId } : {}),
      ...(query.locationType ? { locationType: query.locationType } : {}),
      ...(query.transactionType ? { transactionType: query.transactionType } : {}),
      ...(query.search
        ? {
            OR: [
              { batchNumber: { contains: query.search, mode: 'insensitive' } },
              { hospital: { hospitalName: { contains: query.search, mode: 'insensitive' } } },
              { item: { itemCode: { contains: query.search, mode: 'insensitive' } } },
              { item: { itemName: { contains: query.search, mode: 'insensitive' } } },
              ...(storeIdsForSearch.length ? [{ locationId: { in: storeIdsForSearch } }] : []),
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.stock.findLedgers({
        orderBy: getLedgerOrderBy(query),
        skip: (page - 1) * limit,
        take: limit,
        where,
      }),
      this.stock.countLedgers({ where }),
    ]);
    const stores = await this.stock.findStoresByIds(getStoreLocationIds(items));
    const storeLocationMap = getStoreLocationMap(stores);

    return {
      items: items.map((item: StockLedgerWithRelations) => ({
        balanceAfter: toNumber(item.balanceAfter),
        batchNumber: item.batchNumber,
        businessDate: item.businessDate,
        createdAt: item.createdAt,
        deletedAt: item.deletedAt,
        expiryDate: item.expiryDate,
        hospital: item.hospital,
        hospitalId: item.hospitalId,
        id: item.id,
        item: item.item,
        itemId: item.itemId,
        itemType: item.itemType,
        location: storeLocationMap.get(item.locationId) ?? {
          code: null,
          id: item.locationId,
          name: item.locationId,
          type: item.locationType,
        },
        locationId: item.locationId,
        locationType: item.locationType,
        qtyIn: toNumber(item.qtyIn),
        qtyOut: toNumber(item.qtyOut),
        referenceId: item.referenceId,
        referenceType: item.referenceType,
        remarks: item.remarks,
        transactionDateTime: item.transactionDateTime,
        transactionType: item.transactionType,
        updatedAt: item.updatedAt,
      })),
      meta: getPageMeta(page, limit, total),
    };
  }
}
