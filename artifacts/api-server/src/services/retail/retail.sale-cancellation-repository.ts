import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { createRetailAuditPayload } from "./retail.audit.js";
import type {
  RetailActor,
  RetailBusinessScope,
  RetailSaleCancellationResultDto,
} from "./retail.types.js";

type DelegateWriteCount = {
  count: number;
};

type SaleItemRow = {
  id: string;
  productId: string;
  skuSnapshot: string;
  nameSnapshot: string;
  quantity: number;
};

type SaleReturnRow = {
  id: string;
};

type SaleRow = {
  id: string;
  receiptNumber: string;
  paymentMethod: string;
  total: number;
  status: string;
  items: SaleItemRow[];
  returns: SaleReturnRow[];
};

type ProductStockRow = {
  id: string;
  currentStock: number;
};

type RetailSaleDelegate = {
  findFirst(args: Record<string, unknown>): Promise<SaleRow | null>;
  updateMany(args: Record<string, unknown>): Promise<DelegateWriteCount>;
};

type RetailProductDelegate = {
  findFirst(args: Record<string, unknown>): Promise<ProductStockRow | null>;
  updateMany(args: Record<string, unknown>): Promise<DelegateWriteCount>;
};

type RetailPaymentDelegate = {
  updateMany(args: Record<string, unknown>): Promise<DelegateWriteCount>;
};

type RetailStockMovementDelegate = {
  create(args: Record<string, unknown>): Promise<unknown>;
};

type RetailCancellationTransactionClient = {
  retailSale: RetailSaleDelegate;
  retailProduct: RetailProductDelegate;
  retailPayment: RetailPaymentDelegate;
  retailStockMovement: RetailStockMovementDelegate;
  $executeRaw(query: unknown): Promise<number>;
};

export type CancelRetailSaleInput = {
  scope: RetailBusinessScope;
  actor: RetailActor;
  saleId: string;
  reason?: string;
};

function createId() {
  return randomUUID();
}

function normalizePaymentAccount(method: string) {
  const upper = method.toUpperCase();
  return ["CASH", "QRIS", "CARD", "TRANSFER"].includes(upper) ? upper : "OTHER";
}

function blockedCancellation(params: {
  saleId: string;
  receiptNumber?: string;
  blockedReasons: string[];
}): RetailSaleCancellationResultDto {
  return {
    cancelled: false,
    saleId: params.saleId,
    receiptNumber: params.receiptNumber ?? "",
    refundAmount: 0,
    restockedQuantity: 0,
    stockMovementIds: [],
    blockedReasons: params.blockedReasons,
  };
}

export async function cancelRetailSaleWithDelegate(input: CancelRetailSaleInput): Promise<RetailSaleCancellationResultDto> {
  const cancellationReason = input.reason?.trim() || "Retail sale cancelled by management.";

  return prisma.$transaction(
    async (tx) => {
      const retailTx = tx as unknown as RetailCancellationTransactionClient;
      const sale = await retailTx.retailSale.findFirst({
        where: {
          businessId: input.scope.businessId,
          id: input.saleId,
        },
        select: {
          id: true,
          receiptNumber: true,
          paymentMethod: true,
          total: true,
          status: true,
          items: {
            select: {
              id: true,
              productId: true,
              skuSnapshot: true,
              nameSnapshot: true,
              quantity: true,
            },
          },
          returns: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!sale) {
        return blockedCancellation({
          saleId: input.saleId,
          blockedReasons: ["Retail sale was not found for this business."],
        });
      }

      if (sale.status !== "completed") {
        return blockedCancellation({
          saleId: sale.id,
          receiptNumber: sale.receiptNumber,
          blockedReasons: [`Only completed retail sales can be cancelled. Current status: ${sale.status}.`],
        });
      }

      if (sale.returns.length > 0) {
        return blockedCancellation({
          saleId: sale.id,
          receiptNumber: sale.receiptNumber,
          blockedReasons: ["Retail sale has persisted returns and must be handled through the return workflow."],
        });
      }

      const now = new Date();
      const stockMovementIds: string[] = [];
      const cashflowEntryId = createId();
      let restockedQuantity = 0;

      const saleUpdate = await retailTx.retailSale.updateMany({
        where: {
          businessId: input.scope.businessId,
          id: sale.id,
          status: "completed",
        },
        data: {
          status: "cancelled",
          updatedAt: now,
        },
      });

      if (saleUpdate.count !== 1) {
        return blockedCancellation({
          saleId: sale.id,
          receiptNumber: sale.receiptNumber,
          blockedReasons: ["Retail sale status changed before cancellation could be completed."],
        });
      }

      await retailTx.retailPayment.updateMany({
        where: {
          saleId: sale.id,
          status: "paid",
        },
        data: {
          status: "refunded",
          updatedAt: now,
        },
      });

      for (const item of sale.items) {
        if (item.quantity <= 0) continue;

        const product = await retailTx.retailProduct.findFirst({
          where: {
            businessId: input.scope.businessId,
            id: item.productId,
            isActive: true,
          },
          select: {
            id: true,
            currentStock: true,
          },
        });

        if (!product) {
          throw new Error(`${item.skuSnapshot} could not be restocked because the product is inactive or missing.`);
        }

        const beforeQuantity = product.currentStock;
        const afterQuantity = beforeQuantity + item.quantity;
        const stockUpdate = await retailTx.retailProduct.updateMany({
          where: {
            businessId: input.scope.businessId,
            id: item.productId,
            isActive: true,
          },
          data: {
            currentStock: {
              increment: item.quantity,
            },
            updatedAt: now,
          },
        });

        if (stockUpdate.count !== 1) {
          throw new Error(`${item.skuSnapshot} stock changed before cancellation could be completed.`);
        }

        const movementId = createId();
        stockMovementIds.push(movementId);
        restockedQuantity += item.quantity;

        await retailTx.retailStockMovement.create({
          data: {
            id: movementId,
            businessId: input.scope.businessId,
            productId: item.productId,
            type: "in",
            reason: "sale_cancellation",
            source: "retail_sale_cancellation",
            sourceId: sale.id,
            quantity: item.quantity,
            beforeQuantity,
            afterQuantity,
            note: cancellationReason,
            createdById: input.actor.id,
            createdAt: now,
          },
        });
      }

      await retailTx.$executeRaw(Prisma.sql`
        INSERT INTO "CashflowEntry" (
          "id",
          "businessId",
          "type",
          "account",
          "amount",
          "status",
          "occurredAt",
          "title",
          "description",
          "sourceType",
          "sourceId",
          "reference",
          "createdById",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${cashflowEntryId},
          ${input.scope.businessId},
          'EXPENSE',
          ${normalizePaymentAccount(sale.paymentMethod)},
          ${sale.total},
          'POSTED',
          ${now},
          'Retail sale cancellation refund',
          ${cancellationReason},
          'SALE_CANCELLATION',
          ${sale.id},
          ${sale.receiptNumber},
          ${input.actor.id},
          ${now},
          ${now}
        )
      `);

      await retailTx.$executeRaw(Prisma.sql`
        INSERT INTO "AuditLog" (
          "id",
          "businessId",
          "userId",
          "action",
          "entityType",
          "entityId",
          "changes",
          "createdAt"
        ) VALUES (
          ${createId()},
          ${input.scope.businessId},
          ${input.actor.id},
          'UPDATE',
          'RetailSale',
          ${sale.id},
          CAST(${JSON.stringify(createRetailAuditPayload({
            event: "retail.sale.cancelled",
            actor: input.actor,
            references: {
              saleId: sale.id,
              receiptNumber: sale.receiptNumber,
              cashflowEntryId,
            },
            totals: {
              refundAmount: sale.total,
              restockedQuantity,
            },
            stockMovementIds,
            reason: cancellationReason,
            metadata: {
              previousStatus: sale.status,
              nextStatus: "cancelled",
              lines: sale.items.map((item) => ({
                saleItemId: item.id,
                productId: item.productId,
                sku: item.skuSnapshot,
                quantity: item.quantity,
              })),
            },
          }))} AS jsonb),
          ${now}
        )
      `);

      return {
        cancelled: true,
        saleId: sale.id,
        receiptNumber: sale.receiptNumber,
        refundAmount: sale.total,
        restockedQuantity,
        stockMovementIds,
        cashflowEntryId,
        blockedReasons: [],
        createdAt: now.toISOString(),
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
