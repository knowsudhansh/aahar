import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  InventoryLocationType,
  ItemType,
  Prisma,
  StockReferenceType,
  StockTransactionType,
  TransferStatus,
} from '@prisma/client';
import { AuditLogService } from '../common/audit/audit-log.service';
import { getPageMeta, getPagination } from '../common/pagination';
import type { ActorContext } from '../common/request-context';
import { CreateTransferDto, CreateTransferLineDto } from './dto/create-transfer.dto';
import { ListTransfersQueryDto, TransferSortField } from './dto/list-transfers-query.dto';
import { TransfersRepository, TransferWithRelations } from './transfers.repository';

type TransferClient = Prisma.TransactionClient;

interface PreparedTransferLine {
  batchNumber: string;
  expiryDate: Date;
  itemId: string;
  remarks?: string;
  sentQty: number;
}

function optionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

function toDate(value: string): Date {
  return new Date(value);
}

function toDateOnly(value: string | Date): Date {
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

    if (match) {
      return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    }
  }

  const date = value instanceof Date ? new Date(value) : new Date(value);

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function toNumber(value: Prisma.Decimal | number): number {
  return Number(value);
}

function formatQuantity(value: number): string {
  return value
    .toFixed(3)
    .replace(/\.?0+$/, '');
}

function formatDateOnly(value: Date): string {
  return toDateOnly(value).toISOString().slice(0, 10);
}

function getTransferOrderBy(
  query: ListTransfersQueryDto,
): Prisma.TransferOrderByWithRelationInput {
  const sortBy: TransferSortField = query.sortBy ?? 'createdAt';

  return {
    [sortBy]: query.sortOrder ?? 'desc',
  };
}

function stockKey(input: { batchNumber: string | null; expiryDate: Date | null; itemId: string }): string {
  return `${input.itemId}|${input.batchNumber ?? ''}|${
    input.expiryDate ? formatDateOnly(input.expiryDate) : ''
  }`;
}

function insufficientStockMessage(
  line: Pick<PreparedTransferLine, 'batchNumber' | 'expiryDate'>,
  availableQty: number,
  requestedQty: number,
): string {
  return `Selected batch ${line.batchNumber} has available stock ${formatQuantity(
    availableQty,
  )}. Requested quantity ${formatQuantity(
    requestedQty,
  )}.`;
}

function toTransferResponse(transfer: TransferWithRelations) {
  return {
    businessDate: transfer.businessDate,
    createdAt: transfer.createdAt,
    deletedAt: transfer.deletedAt,
    destinationId: transfer.destinationId,
    destinationType: transfer.destinationType,
    hospital: transfer.hospital,
    hospitalId: transfer.hospitalId,
    id: transfer.id,
    lines: transfer.lines.map((line) => ({
      acceptedQty: toNumber(line.acceptedQty),
      batchNumber: line.batchNumber,
      createdAt: line.createdAt,
      expiryDate: line.expiryDate,
      id: line.id,
      item: line.item,
      itemId: line.itemId,
      rejectedQty: toNumber(line.rejectedQty),
      rejectionReason: line.rejectionReason,
      remarks: line.remarks,
      sentQty: toNumber(line.sentQty),
      transferId: line.transferId,
      updatedAt: line.updatedAt,
    })),
    remarks: transfer.remarks,
    sourceId: transfer.sourceId,
    sourceType: transfer.sourceType,
    status: transfer.status,
    transferDate: transfer.transferDate,
    transferNumber: transfer.transferNumber,
    updatedAt: transfer.updatedAt,
  };
}

@Injectable()
export class TransfersService {
  constructor(
    private readonly auditLog: AuditLogService,
    private readonly transfers: TransfersRepository,
  ) {}

  async list(query: ListTransfersQueryDto) {
    const { limit, page } = getPagination(query);
    const where: Prisma.TransferWhereInput = {
      deletedAt: null,
      ...(query.destinationId ? { destinationId: query.destinationId } : {}),
      ...(query.destinationType ? { destinationType: query.destinationType } : {}),
      ...(query.hospitalId ? { hospitalId: query.hospitalId } : {}),
      ...(query.sourceId ? { sourceId: query.sourceId } : {}),
      ...(query.sourceType ? { sourceType: query.sourceType } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.fromDate || query.toDate
        ? {
            transferDate: {
              ...(query.fromDate ? { gte: toDate(query.fromDate) } : {}),
              ...(query.toDate ? { lte: toDate(query.toDate) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { transferNumber: { contains: query.search, mode: 'insensitive' } },
              { remarks: { contains: query.search, mode: 'insensitive' } },
              { lines: { some: { item: { itemCode: { contains: query.search, mode: 'insensitive' } } } } },
              { lines: { some: { item: { itemName: { contains: query.search, mode: 'insensitive' } } } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.transfers.findMany({
        orderBy: getTransferOrderBy(query),
        skip: (page - 1) * limit,
        take: limit,
        where,
      }),
      this.transfers.count({ where }),
    ]);

    return {
      items: items.map(toTransferResponse),
      meta: getPageMeta(page, limit, total),
    };
  }

  async getById(id: string) {
    return toTransferResponse(await this.findActiveTransfer(id));
  }

  async create(dto: CreateTransferDto, context: ActorContext) {
    return this.transfers.transaction(async (tx) => {
      await this.assertTransferHeader(dto, tx);
      const lines = await this.prepareLines(dto.items, dto.hospitalId, dto.sourceId, tx);
      const transferDate = toDate(dto.transferDate);

      const transfer = await this.transfers.create(
        {
          businessDate: toDateOnly(transferDate),
          createdBy: context.actorId,
          destinationId: dto.destinationId,
          destinationType: dto.destinationType,
          hospitalId: dto.hospitalId,
          remarks: optionalText(dto.remarks),
          sourceId: dto.sourceId,
          sourceType: dto.sourceType,
          status: TransferStatus.DRAFT,
          transferDate,
          updatedBy: context.actorId,
        },
        tx,
      );

      for (const line of lines) {
        await this.transfers.createLine(
          {
            batchNumber: line.batchNumber,
            createdBy: context.actorId,
            expiryDate: line.expiryDate,
            itemId: line.itemId,
            remarks: line.remarks,
            sentQty: line.sentQty,
            transferId: transfer.id,
            updatedBy: context.actorId,
          },
          tx,
        );
      }

      const created = await this.findActiveTransfer(transfer.id, tx);
      const newValue = toTransferResponse(created);

      await this.auditLog.record(
        {
          action: 'TRANSFER_CREATE',
          actorId: context.actorId,
          entityId: created.id,
          entityName: 'transfers',
          hospitalId: created.hospitalId,
          ipAddress: context.ipAddress,
          newValue,
        },
        tx,
      );

      return newValue;
    });
  }

  async dispatch(id: string, context: ActorContext) {
    return this.transfers.transaction(async (tx) => {
      const existing = await this.findActiveTransfer(id, tx);

      if (existing.status !== TransferStatus.DRAFT) {
        throw new BadRequestException('Only draft transfers can be dispatched');
      }

      for (const line of existing.lines) {
        const balance = await this.findStoreBalanceForLine(
          existing.hospitalId,
          existing.sourceId,
          line,
          tx,
        );
        const sentQty = toNumber(line.sentQty);
        const updatedBalance = await this.transfers.decrementStockBalance(
          balance.id,
          sentQty,
          context.actorId,
          tx,
        );

        if (!updatedBalance) {
          throw new BadRequestException(
            `${line.item.itemName}: sent quantity exceeds current store available quantity`,
          );
        }

        await this.transfers.createStockLedger(
          {
            balanceAfter: toNumber(updatedBalance.availableQty),
            batchNumber: line.batchNumber,
            businessDate: existing.businessDate,
            createdBy: context.actorId,
            expiryDate: line.expiryDate,
            hospitalId: existing.hospitalId,
            itemId: line.itemId,
            itemType: ItemType.MRP,
            locationId: existing.sourceId,
            locationType: InventoryLocationType.STORE,
            qtyIn: 0,
            qtyOut: sentQty,
            referenceId: existing.id,
            referenceType: StockReferenceType.TRANSFER,
            remarks: existing.remarks,
            transactionDateTime: new Date(),
            transactionType: StockTransactionType.STORE_TO_RESTAURANT_OUT,
            updatedBy: context.actorId,
          },
          tx,
        );
      }

      const dispatched = await this.transfers.update(
        id,
        {
          status: TransferStatus.PENDING_ACKNOWLEDGEMENT,
          updatedBy: context.actorId,
        },
        tx,
      );

      await this.auditLog.record(
        {
          action: 'TRANSFER_DISPATCH',
          actorId: context.actorId,
          entityId: id,
          entityName: 'transfers',
          hospitalId: dispatched.hospitalId,
          ipAddress: context.ipAddress,
          newValue: toTransferResponse(dispatched),
          oldValue: toTransferResponse(existing),
        },
        tx,
      );

      return toTransferResponse(dispatched);
    });
  }

  async cancel(id: string, context: ActorContext) {
    return this.transfers.transaction(async (tx) => {
      const existing = await this.findActiveTransfer(id, tx);

      if (existing.status !== TransferStatus.DRAFT) {
        throw new BadRequestException('Only draft transfers can be cancelled');
      }

      const cancelled = await this.transfers.update(
        id,
        {
          status: TransferStatus.CANCELLED,
          updatedBy: context.actorId,
        },
        tx,
      );

      await this.auditLog.record(
        {
          action: 'TRANSFER_CANCEL',
          actorId: context.actorId,
          entityId: id,
          entityName: 'transfers',
          hospitalId: cancelled.hospitalId,
          ipAddress: context.ipAddress,
          newValue: toTransferResponse(cancelled),
          oldValue: toTransferResponse(existing),
        },
        tx,
      );

      return toTransferResponse(cancelled);
    });
  }

  private async assertTransferHeader(dto: CreateTransferDto, client: TransferClient) {
    if (dto.sourceType !== InventoryLocationType.STORE) {
      throw new BadRequestException('Only Store to Restaurant transfers are supported in Phase 3B');
    }

    if (dto.destinationType !== InventoryLocationType.RESTAURANT) {
      throw new BadRequestException('Destination must be a restaurant');
    }

    if (dto.sourceId === dto.destinationId) {
      throw new BadRequestException('Source and destination cannot be same');
    }

    const [hospital, store, restaurant] = await Promise.all([
      this.transfers.findActiveHospital(dto.hospitalId, client),
      this.transfers.findActiveStore(dto.sourceId, client),
      this.transfers.findActiveRestaurant(dto.destinationId, client),
    ]);

    if (!hospital || !hospital.isActive) {
      throw new BadRequestException('Hospital not found or inactive');
    }

    if (!store || !store.isActive) {
      throw new BadRequestException('Store not found or inactive');
    }

    if (!restaurant || !restaurant.isActive) {
      throw new BadRequestException('Restaurant not found or inactive');
    }

    if (store.hospitalId !== dto.hospitalId) {
      throw new BadRequestException('Store does not belong to selected hospital');
    }

    if (restaurant.hospitalId !== dto.hospitalId) {
      throw new BadRequestException('Restaurant does not belong to selected hospital');
    }
  }

  private async findActiveTransfer(
    id: string,
    client?: TransferClient,
  ): Promise<TransferWithRelations> {
    const transfer = await this.transfers.findActiveById(id, client);

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    return transfer;
  }

  private async findStoreBalanceForLine(
    hospitalId: string,
    storeId: string,
    line: TransferWithRelations['lines'][number],
    client: TransferClient,
  ) {
    const [balance] = await this.transfers.findActiveStoreStockBalances(
      hospitalId,
      storeId,
      [
        {
          batchNumber: line.batchNumber,
          expiryDate: toDateOnly(line.expiryDate),
          itemId: line.itemId,
        },
      ],
      client,
    );

    if (!balance || toNumber(balance.availableQty) < toNumber(line.sentQty)) {
      throw new BadRequestException(
        insufficientStockMessage(
          {
            batchNumber: line.batchNumber,
            expiryDate: line.expiryDate,
          },
          balance ? toNumber(balance.availableQty) : 0,
          toNumber(line.sentQty),
        ),
      );
    }

    return balance;
  }

  private async prepareLines(
    lines: CreateTransferLineDto[],
    hospitalId: string,
    storeId: string,
    client: TransferClient,
  ): Promise<PreparedTransferLine[]> {
    const itemIds = [...new Set(lines.map((line) => line.itemId))];
    const items = await this.transfers.findItemsByIds(itemIds, client);
    const itemMap = new Map(items.map((item) => [item.id, item]));
    const prepared = lines.map((line, index) => {
      const item = itemMap.get(line.itemId);
      const lineLabel = `Line ${index + 1}`;
      const batchNumber = line.batchNumber.trim();
      const expiryDate = toDateOnly(line.expiryDate);

      if (!item) {
        throw new BadRequestException(`${lineLabel}: item not found or inactive`);
      }

      if (item.itemType !== ItemType.MRP) {
        throw new BadRequestException(`${lineLabel}: only MRP items can be transferred`);
      }

      if (!batchNumber) {
        throw new BadRequestException(`${lineLabel}: batch number is required`);
      }

      return {
        batchNumber,
        expiryDate,
        itemId: line.itemId,
        remarks: optionalText(line.remarks),
        sentQty: line.sentQty,
      };
    });
    const totals = new Map<string, number>();
    const lineByKey = new Map<string, PreparedTransferLine>();

    prepared.forEach((line) => {
      const key = stockKey(line);
      totals.set(key, (totals.get(key) ?? 0) + line.sentQty);
      lineByKey.set(key, line);
    });

    const balances = await this.transfers.findActiveStoreStockBalances(
      hospitalId,
      storeId,
      prepared.map((line) => ({
        batchNumber: line.batchNumber,
        expiryDate: line.expiryDate,
        itemId: line.itemId,
      })),
      client,
    );
    const balanceMap = new Map(balances.map((balance) => [stockKey(balance), balance]));

    for (const [key, requestedQty] of totals.entries()) {
      const balance = balanceMap.get(key);
      const line = lineByKey.get(key);

      if (!balance || toNumber(balance.availableQty) < requestedQty) {
        throw new BadRequestException(
          insufficientStockMessage(line!, balance ? toNumber(balance.availableQty) : 0, requestedQty),
        );
      }
    }

    return prepared;
  }
}
