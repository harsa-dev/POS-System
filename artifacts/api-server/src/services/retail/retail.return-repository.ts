import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { createRetailAuditPayload } from "./retail.audit.js";
import type {
  RetailActor,
  RetailBusinessScope,
  RetailPersistedReturnDto,
  RetailReturnPreviewDto,
  RetailReturnPreviewInput,
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
  unitPrice: number;
  lineTotal: number;
};

type SaleRow = {
  id: string;
  receiptNumber: string;
  paymentMethod: string;
  items: SaleItemRow[];
};

type ReturnItemQuantityRow = {
  saleItemId: string;
  quantity: number;
};

type ProductStockRow = {
  id: string;
  currentStock: number;
};

type RetailSaleDelegate = {
  findFirst(args: Record<string, unknown>): Promise<SaleRow | null>;
};

type RetailReturnDelegate = {
  create(args: Record<string, unknown>): Promise<unknown>;
};

type RetailReturnItemDelegate = {
  findMany(args: Record<string, unknown>): Promise<ReturnItemQuantityRow[]>;
  createMany(args: Record<string, unknown>): Promise<DelegateWriteCount>;
};

type RetailProductDelegate = {
  findFirst(args: Record<string, unknown>): Promise<ProductStockRow | null>;
  updateMany(args: Record<string, unknown>): Promise<DelegateWriteCount>;
};

type RetailStockMovementDelegate = {
  create(args: Record<string, unknown>): Promise<unknown>;
};

type RetailReturnTransactionClient = {
  retailSale: RetailSaleDelegate;
  retailReturn: RetailReturnDelegate;
  retailReturnItem: RetailReturnItemDelegate;
  retailProduct: RetailProductDelegate;
  retailStockMovement: RetailStockMovementDelegate;
  $executeRaw(query: unknown): Promise<number>;
};

export type PersistRetailReturnInput = {
  scope: RetailBusinessScope;
  actor: RetailActor;
  input: RetailReturnPreviewInput;
  preview: RetailReturnPreviewDto;
};

function createId() {
  return randomUUID();
}

function createReturnNumber() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `RTR-${yyyy}${mm}${dd}-${Date.now().toString().slice(-7)}`;
}

function normalizePaymentAccount(method: string) {
  const upper = method.toUpperCase();
  return ["CASH", "QRIS", "CARD", "TRANSFER"].includes(upper) ? upper : "OTHER";
}

function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) return 0;
  return Math.max(0, Math.floor(quantity));
}

function uniqueReasons(reasons: string[]) {
  return Array.from(new Set(reasons));
}

function blockedReturn(preview: RetailReturnPreviewDto, reviewReasons: string[]): RetailReturnPreviewDto {
  return {
    ...preview,
    requiresManagerReview: true,
    reviewReasons: uniqueReasons([...preview.reviewReasons, ...reviewReasons]),
  };
}

function isRestockable(reason: RetailReturnPreviewInput["reason"]) {
  return reason !== "damaged" && reason !== "expired";
}

export async function persistRetailReturnWithDelegate(input: PersistRetailReturnInput): Promise<RetailReturnPreviewDto | RetailPersistedReturnDto> {
  const originalReceiptNumber = input.input.originalReceiptNumber?.trim();

  if (!originalReceiptNumber) {
    return blockedReturn(input.preview, ["Missing original receipt number."]);
  }

  if (input.preview.requiresManagerReview) {
    return input.preview;
  }

  return prisma.$transaction(
    async (tx) => {
      const retailTx = tx as unknown as RetailReturnTransactionClient;
      const sale = await retailTx.retailSale.findFirst({
        where: {
          businessId: input.scope.businessId,
          receiptNumber: originalReceiptNumber,
          status: "completed",
        },
        select: {
          id: true,
          receiptNumber: true,
          paymentMethod: true,
          items: {
            select: {
              id: true,
              productId: true,
              skuSnapshot: true,
              nameSnapshot: true,
              quantity: true,
              unitPrice: true,
              lineTotal: true,
            },
          },
        },
      });

      if (!sale) {
        return blockedReturn(input.preview, ["Original retail receipt was not found."]);
      }

      const saleItemByProductId = new Map(sale.items.map((item) => [item.productId, item]));
      const saleItemIds = sale.items.map((item) => item.id);
      const previousReturns = saleItemIds.length > 0
        ? await retailTx.retailReturnItem.findMany({
          where: {
            saleItemId: {
              in: saleItemIds,
            },
          },
          select: {
            saleItemId: true,
            quantity: true,
          },
        })
        : [];
      const returnedQuantityBySaleItemId = new Map<string, number>();

      for (const returnItem of previousReturns) {
        returnedQuantityBySaleItemId.set(
          returnItem.saleItemId,
          (returnedQuantityBySaleItemId.get(returnItem.saleItemId) ?? 0) + returnItem.quantity,
        );
      }

      const reviewReasons: string[] = [];
      const returnItems: Array<{
        id: string;
        saleItemId: string;
        productId: string;
        skuSnapshot: string;
        nameSnapshot: string;
        quantity: number;
        unitPrice: number;
        refundAmount: number;
        restockable: boolean;
        restockedQuantity: number;
      }> = [];
      let refundAmount = 0;
      let restockedQuantity = 0;
      const canRestock = isRestockable(input.input.reason);

      for (const line of input.input.lines) {
        const quantity = normalizeQuantity(line.quantity);
        const saleItem = saleItemByProductId.get(line.productId);

        if (quantity <= 0) {
          reviewReasons.push(`Return line for product ${line.productId} must be greater than zero.`);
          continue;
        }

        if (!saleItem) {
          reviewReasons.push(`Product ${line.productId} was not found on the original receipt.`);
          continue;
        }

        const previouslyReturned = returnedQuantityBySaleItemId.get(saleItem.id) ?? 0;
        const remainingReturnableQuantity = saleItem.quantity - previouslyReturned;

        if (quantity > remainingReturnableQuantity) {
          reviewReasons.push(`${saleItem.skuSnapshot} can only return ${remainingReturnableQuantity} more item(s).`);
          continue;
        }

        const unitRefundAmount = Math.round(saleItem.lineTotal / saleItem.quantity);
        const lineRefundAmount = unitRefundAmount * quantity;
        const lineRestockedQuantity = canRestock ? quantity : 0;

        refundAmount += lineRefundAmount;
        restockedQuantity += lineRestockedQuantity;
        returnItems.push({
          id: createId(),
          saleItemId: saleItem.id,
          productId: saleItem.productId,
          skuSnapshot: saleItem.skuSnapshot,
          nameSnapshot: saleItem.nameSnapshot,
          quantity,
          unitPrice: saleItem.unitPrice,
          refundAmount: lineRefundAmount,
          restockable: canRestock,
          restockedQuantity: lineRestockedQuantity,
        });
      }

      if (returnItems.length === 0) {
        reviewReasons.push("At least one valid return line is required.");
      }

      if (reviewReasons.length > 0) {
        return blockedReturn(input.preview, reviewReasons);
      }

      const now = new Date();
      const returnId = createId();
      const returnNumber = createReturnNumber();
      const cashflowEntryId = createId();
      const stockMovementIds: string[] = [];

      await retailTx.retailReturn.create({
        data: {
          id: returnId,
          businessId: input.scope.businessId,
          saleId: sale.id,
          createdById: input.actor.id,
          returnNumber,
          originalReceiptNumber,
          reason: input.input.reason,
          status: "completed",
          refundAmount,
          restockedQuantity,
          createdAt: now,
          updatedAt: now,
        },
      });

      await retailTx.retailReturnItem.createMany({
        data: returnItems.map((item) => ({
          id: item.id,
          returnId,
          saleItemId: item.saleItemId,
          productId: item.productId,
          skuSnapshot: item.skuSnapshot,
          nameSnapshot: item.nameSnapshot,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          refundAmount: item.refundAmount,
          restockable: item.restockable,
          restockedQuantity: item.restockedQuantity,
          createdAt: now,
        })),
      });

      for (const item of returnItems.filter((candidate) => candidate.restockable && candidate.restockedQuantity > 0)) {
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
        const afterQuantity = beforeQuantity + item.restockedQuantity;
        const stockUpdate = await retailTx.retailProduct.updateMany({
          where: {
            businessId: input.scope.businessId,
            id: item.productId,
            isActive: true,
          },
          data: {
            currentStock: {
              increment: item.restockedQuantity,
            },
            updatedAt: now,
          },
        });

        if (stockUpdate.count !== 1) {
          throw new Error(`${item.skuSnapshot} stock changed before return could be completed.`);
        }

        const movementId = createId();
        stockMovementIds.push(movementId);

        await retailTx.retailStockMovement.create({
          data: {
            id: movementId,
            businessId: input.scope.businessId,
            productId: item.productId,
            type: "in",
            reason: "return",
            source: "retail_return",
            sourceId: returnId,
            quantity: item.restockedQuantity,
            beforeQuantity,
            afterQuantity,
            note: "Retail return restock.",
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
          ${refundAmount},
          'POSTED',
          ${now},
          'Retail return refund',
          'Auto-created from retail return workflow.',
          'REFUND',
          ${returnId},
          ${returnNumber},
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
          'CREATE',
          'RetailReturn',
          ${returnId},
          CAST(${JSON.stringify(createRetailAuditPayload({
            event: "retail.return.persisted",
            actor: input.actor,
            references: {
              returnId,
              returnNumber,
              saleId: sale.id,
              originalReceiptNumber,
              cashflowEntryId,
            },
            totals: {
              refundAmount,
              restockedQuantity,
            },
            stockMovementIds,
            reason: input.input.reason,
            metadata: {
              lines: returnItems.map((item) => ({
                saleItemId: item.saleItemId,
                productId: item.productId,
                quantity: item.quantity,
                refundAmount: item.refundAmount,
                restockedQuantity: item.restockedQuantity,
              })),
            },
          }))} AS jsonb),
          ${now}
        )
      `);

      return {
        ...input.preview,
        persisted: true,
        returnId,
        returnNumber,
        saleId: sale.id,
        originalReceiptNumber,
        refundAmount,
        restockedQuantity,
        stockMovementIds,
        cashflowEntryId,
        createdAt: now.toISOString(),
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
