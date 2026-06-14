import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { createRetailAuditPayload } from "./retail.audit.js";
import type { RetailCreateSaleInput, RetailRepository } from "./retail.repository.js";
import type {
  RetailInventoryRiskDto,
  RetailPersistedCheckoutDto,
  RetailProductDto,
  RetailReceivingQueueDto,
  RetailSupplierDto,
} from "./retail.types.js";

type DecimalLike = number | string | { toString(): string };

type RetailProductDelegateRow = Omit<RetailProductDto, "price" | "cost" | "taxRatePercent" | "status"> & {
  price: DecimalLike;
  cost: DecimalLike;
  taxRatePercent: DecimalLike;
};

type RetailSupplierDelegateRow = RetailSupplierDto;

type RetailReceivingDelegateRow = {
  id: string;
  supplierId: string;
  status: string;
  expectedDate: Date;
  totalCost: DecimalLike;
  supplier: {
    name: string;
  };
  items: Array<{
    productId: string;
    orderedQty: number;
    receivedQty: number;
    product: {
      sku: string;
    };
  }>;
};

type DelegateWriteCount = {
  count: number;
};

type RetailProductDelegate = {
  findMany(args: Record<string, unknown>): Promise<RetailProductDelegateRow[]>;
  findFirst(args: Record<string, unknown>): Promise<RetailProductDelegateRow | null>;
  updateMany(args: Record<string, unknown>): Promise<DelegateWriteCount>;
};

type RetailSupplierDelegate = {
  findMany(args: Record<string, unknown>): Promise<RetailSupplierDelegateRow[]>;
};

type RetailReceivingDelegate = {
  findMany(args: Record<string, unknown>): Promise<RetailReceivingDelegateRow[]>;
};

type RetailSaleDelegate = {
  create(args: Record<string, unknown>): Promise<unknown>;
};

type RetailSaleItemDelegate = {
  createMany(args: Record<string, unknown>): Promise<DelegateWriteCount>;
};

type RetailPaymentDelegate = {
  create(args: Record<string, unknown>): Promise<unknown>;
};

type RetailStockMovementDelegate = {
  create(args: Record<string, unknown>): Promise<unknown>;
};

type RetailDelegateClient = typeof prisma & {
  retailProduct: RetailProductDelegate;
  retailSupplier: RetailSupplierDelegate;
  retailReceiving: RetailReceivingDelegate;
  retailSale: RetailSaleDelegate;
  retailSaleItem: RetailSaleItemDelegate;
  retailPayment: RetailPaymentDelegate;
  retailStockMovement: RetailStockMovementDelegate;
};

type RetailTransactionDelegateClient = {
  retailProduct: RetailProductDelegate;
  retailSale: RetailSaleDelegate;
  retailSaleItem: RetailSaleItemDelegate;
  retailPayment: RetailPaymentDelegate;
  retailStockMovement: RetailStockMovementDelegate;
  $executeRaw(query: unknown): Promise<number>;
};

const retailDb = prisma as unknown as RetailDelegateClient;

function createId() {
  return randomUUID();
}

function createReceiptNumber() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `RTL-${yyyy}${mm}${dd}-${Date.now().toString().slice(-7)}`;
}

function normalizePaymentAccount(method: string) {
  const upper = method.toUpperCase();
  return ["CASH", "QRIS", "CARD", "TRANSFER"].includes(upper) ? upper : "OTHER";
}

function toNumber(value: DecimalLike) {
  return typeof value === "number" ? value : Number(value.toString());
}

function normalizeReceivingStatus(value: string): RetailReceivingQueueDto["status"] {
  if (value === "draft" || value === "ordered" || value === "partial" || value === "received") {
    return value;
  }

  return "draft";
}

function getStockStatus(product: Pick<RetailProductDelegateRow, "currentStock" | "reorderPoint">): RetailProductDto["status"] {
  if (product.currentStock <= 0) return "out-of-stock";
  if (product.currentStock <= product.reorderPoint) return "low-stock";
  return "in-stock";
}

function toRetailProductDto(product: RetailProductDelegateRow): RetailProductDto {
  return {
    id: product.id,
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    brand: product.brand,
    category: product.category,
    unit: product.unit,
    price: toNumber(product.price),
    cost: toNumber(product.cost),
    taxRatePercent: toNumber(product.taxRatePercent),
    currentStock: product.currentStock,
    reorderPoint: product.reorderPoint,
    shelfLocation: product.shelfLocation,
    supplierId: product.supplierId,
    status: getStockStatus(product),
  };
}

const productDtoSelect = {
  id: true,
  sku: true,
  barcode: true,
  name: true,
  brand: true,
  category: true,
  unit: true,
  price: true,
  cost: true,
  taxRatePercent: true,
  currentStock: true,
  reorderPoint: true,
  shelfLocation: true,
  supplierId: true,
};

export const retailPrismaRepository = {
  async listProducts(scope) {
    const products = await retailDb.retailProduct.findMany({
      where: {
        businessId: scope.businessId,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: productDtoSelect,
    });

    return products.map(toRetailProductDto);
  },

  async listSuppliers(scope) {
    return retailDb.retailSupplier.findMany({
      where: {
        businessId: scope.businessId,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        leadTimeDays: true,
        reliabilityScore: true,
      },
    });
  },

  async listReceivingQueue(scope) {
    const receivings = await retailDb.retailReceiving.findMany({
      where: {
        businessId: scope.businessId,
      },
      orderBy: {
        expectedDate: "asc",
      },
      select: {
        id: true,
        supplierId: true,
        status: true,
        expectedDate: true,
        totalCost: true,
        supplier: {
          select: {
            name: true,
          },
        },
        items: {
          select: {
            productId: true,
            orderedQty: true,
            receivedQty: true,
            product: {
              select: {
                sku: true,
              },
            },
          },
        },
      },
    });

    return receivings.map((receiving) => ({
      id: receiving.id,
      supplierId: receiving.supplierId,
      supplierName: receiving.supplier.name,
      status: normalizeReceivingStatus(receiving.status),
      expectedDate: receiving.expectedDate.toISOString(),
      totalCost: toNumber(receiving.totalCost),
      items: [...receiving.items]
        .sort((first, second) => first.product.sku.localeCompare(second.product.sku))
        .map((item) => ({
          productId: item.productId,
          sku: item.product.sku,
          orderedQty: item.orderedQty,
          receivedQty: item.receivedQty,
          missingQty: Math.max(item.orderedQty - item.receivedQty, 0),
        })),
    }));
  },

  async findProductById(scope, productId) {
    const product = await retailDb.retailProduct.findFirst({
      where: {
        businessId: scope.businessId,
        id: productId,
        isActive: true,
      },
      select: productDtoSelect,
    });

    return product ? toRetailProductDto(product) : null;
  },

  async findProductByCode(scope, code) {
    const normalizedCode = code.trim();

    if (!normalizedCode) {
      return null;
    }

    const product = await retailDb.retailProduct.findFirst({
      where: {
        businessId: scope.businessId,
        isActive: true,
        OR: [
          {
            barcode: {
              equals: normalizedCode,
              mode: "insensitive",
            },
          },
          {
            sku: {
              equals: normalizedCode,
              mode: "insensitive",
            },
          },
        ],
      },
      select: productDtoSelect,
    });

    return product ? toRetailProductDto(product) : null;
  },

  async getInventoryRisks(scope) {
    const products = await retailDb.retailProduct.findMany({
      where: {
        businessId: scope.businessId,
        isActive: true,
      },
      orderBy: [
        {
          currentStock: "asc",
        },
        {
          name: "asc",
        },
      ],
      select: {
        id: true,
        sku: true,
        name: true,
        cost: true,
        currentStock: true,
        reorderPoint: true,
        supplierId: true,
      },
    });

    return products
      .filter((product) => product.currentStock <= product.reorderPoint)
      .map<RetailInventoryRiskDto>((product) => {
        const suggestedOrderQty = Math.max(product.reorderPoint * 2 - product.currentStock, product.reorderPoint);

        return {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          currentStock: product.currentStock,
          reorderPoint: product.reorderPoint,
          suggestedOrderQty,
          estimatedCost: suggestedOrderQty * toNumber(product.cost),
          supplierId: product.supplierId,
        };
      });
  },

  async createSale(input: RetailCreateSaleInput): Promise<RetailPersistedCheckoutDto> {
    const receiptNumber = createReceiptNumber();
    const saleId = createId();
    const paymentId = createId();
    const cashflowEntryId = createId();
    const now = new Date();
    const method = input.preview.paymentMethod;

    return prisma.$transaction(
      async (tx) => {
        const retailTx = tx as unknown as RetailTransactionDelegateClient;
        const stockMovementIds: string[] = [];

        await retailTx.retailSale.create({
          data: {
            id: saleId,
            businessId: input.scope.businessId,
            createdById: input.actor.id,
            receiptNumber,
            paymentMethod: method,
            subtotal: input.preview.subtotal,
            discountTotal: input.preview.discountTotal,
            taxIncluded: input.preview.taxIncluded,
            total: input.preview.payableTotal,
            grossProfit: input.preview.grossProfit,
            status: "completed",
            createdAt: now,
            updatedAt: now,
          },
        });

        await retailTx.retailSaleItem.createMany({
          data: input.preview.lines.map((line) => ({
            id: createId(),
            saleId,
            productId: line.productId,
            skuSnapshot: line.sku,
            nameSnapshot: line.name,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            costSnapshot: line.cost,
            subtotal: line.subtotal,
            discountAmount: line.discountAmount,
            taxIncluded: line.taxIncluded,
            lineTotal: line.lineTotal,
            grossProfit: line.grossProfit,
          })),
        });

        for (const line of input.preview.lines) {
          const product = await retailTx.retailProduct.findFirst({
            where: {
              businessId: input.scope.businessId,
              id: line.productId,
              isActive: true,
            },
            select: productDtoSelect,
          });

          if (!product) {
            throw new Error(`Retail product ${line.productId} was not found during checkout.`);
          }

          if (product.currentStock < line.quantity) {
            throw new Error(`${product.sku} stock changed before checkout could be completed.`);
          }

          const beforeQuantity = product.currentStock;
          const afterQuantity = beforeQuantity - line.quantity;
          const stockUpdate = await retailTx.retailProduct.updateMany({
            where: {
              businessId: input.scope.businessId,
              id: line.productId,
              isActive: true,
              currentStock: {
                gte: line.quantity,
              },
            },
            data: {
              currentStock: {
                decrement: line.quantity,
              },
              updatedAt: now,
            },
          });

          if (stockUpdate.count !== 1) {
            throw new Error(`${product.sku} stock changed before checkout could be completed.`);
          }

          const movementId = createId();
          stockMovementIds.push(movementId);

          await retailTx.retailStockMovement.create({
            data: {
              id: movementId,
              businessId: input.scope.businessId,
              productId: line.productId,
              type: "out",
              reason: "sale",
              source: "retail_sale",
              sourceId: saleId,
              quantity: line.quantity,
              beforeQuantity,
              afterQuantity,
              note: "Retail checkout stock deduction.",
              createdById: input.actor.id,
              createdAt: now,
            },
          });
        }

        await retailTx.retailPayment.create({
          data: {
            id: paymentId,
            saleId,
            provider: "manual",
            method,
            status: "paid",
            amount: input.preview.payableTotal,
            paidAt: now,
            createdAt: now,
            updatedAt: now,
          },
        });

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
            'INCOME',
            ${normalizePaymentAccount(method)},
            ${input.preview.payableTotal},
            'POSTED',
            ${now},
            'Retail checkout payment',
            'Auto-created from retail checkout.',
            'ORDER_PAYMENT',
            ${saleId},
            ${receiptNumber},
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
            'RetailSale',
            ${saleId},
            CAST(${JSON.stringify(createRetailAuditPayload({
              event: "retail.checkout.created",
              actor: input.actor,
              references: {
                saleId,
                receiptNumber,
                paymentId,
                cashflowEntryId,
              },
              totals: {
                subtotal: input.preview.subtotal,
                discountTotal: input.preview.discountTotal,
                taxIncluded: input.preview.taxIncluded,
                payableTotal: input.preview.payableTotal,
                grossProfit: input.preview.grossProfit,
              },
              stockMovementIds,
              metadata: {
                paymentMethod: method,
                lineCount: input.preview.lines.length,
                lines: input.preview.lines.map((line) => ({
                  productId: line.productId,
                  sku: line.sku,
                  quantity: line.quantity,
                  lineTotal: line.lineTotal,
                })),
              },
            }))} AS jsonb),
            ${now}
          )
        `);

        return {
          ...input.preview,
          persisted: true,
          saleId,
          receiptNumber,
          paymentId,
          stockMovementIds,
          createdAt: now.toISOString(),
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  },
} satisfies RetailRepository;
