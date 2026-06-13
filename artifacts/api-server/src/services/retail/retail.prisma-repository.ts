import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
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
  status: RetailReceivingQueueDto["status"];
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

type ProductLockRow = {
  id: string;
  sku: string;
  name: string;
  cost: number;
  currentStock: number;
};

type RetailProductDelegate = {
  findMany(args: Record<string, unknown>): Promise<RetailProductDelegateRow[]>;
  findFirst(args: Record<string, unknown>): Promise<RetailProductDelegateRow | null>;
};

type RetailSupplierDelegate = {
  findMany(args: Record<string, unknown>): Promise<RetailSupplierDelegateRow[]>;
};

type RetailReceivingDelegate = {
  findMany(args: Record<string, unknown>): Promise<RetailReceivingDelegateRow[]>;
};

type RetailDelegateClient = typeof prisma & {
  retailProduct: RetailProductDelegate;
  retailSupplier: RetailSupplierDelegate;
  retailReceiving: RetailReceivingDelegate;
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
      status: receiving.status,
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
    const now = new Date();
    const method = input.preview.paymentMethod;

    return prisma.$transaction(async (tx) => {
      const stockMovementIds: string[] = [];

      for (const line of input.preview.lines) {
        const lockedRows = await tx.$queryRaw<ProductLockRow[]>(Prisma.sql`
          SELECT "id", "sku", "name", "cost", "currentStock"
          FROM "RetailProduct"
          WHERE "businessId" = ${input.scope.businessId}
            AND "id" = ${line.productId}
            AND "isActive" = TRUE
          FOR UPDATE
        `);
        const product = lockedRows[0];

        if (!product) {
          throw new Error(`Retail product ${line.productId} was not found during checkout.`);
        }

        if (product.currentStock < line.quantity) {
          throw new Error(`${product.sku} stock changed before checkout could be completed.`);
        }
      }

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "RetailSale" (
          "id",
          "businessId",
          "createdById",
          "receiptNumber",
          "paymentMethod",
          "subtotal",
          "discountTotal",
          "taxIncluded",
          "total",
          "grossProfit",
          "status",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${saleId},
          ${input.scope.businessId},
          ${input.actor.id},
          ${receiptNumber},
          ${method},
          ${input.preview.subtotal},
          ${input.preview.discountTotal},
          ${input.preview.taxIncluded},
          ${input.preview.payableTotal},
          ${input.preview.grossProfit},
          'completed',
          ${now},
          ${now}
        )
      `);

      for (const line of input.preview.lines) {
        const stockRows = await tx.$queryRaw<ProductLockRow[]>(Prisma.sql`
          SELECT "id", "sku", "name", "cost", "currentStock"
          FROM "RetailProduct"
          WHERE "businessId" = ${input.scope.businessId}
            AND "id" = ${line.productId}
          FOR UPDATE
        `);
        const product = stockRows[0];

        if (!product) {
          throw new Error(`Retail product ${line.productId} was not found during stock update.`);
        }

        const beforeQuantity = product.currentStock;
        const afterQuantity = beforeQuantity - line.quantity;
        const saleItemId = createId();
        const movementId = createId();
        stockMovementIds.push(movementId);

        await tx.$executeRaw(Prisma.sql`
          INSERT INTO "RetailSaleItem" (
            "id",
            "saleId",
            "productId",
            "skuSnapshot",
            "nameSnapshot",
            "quantity",
            "unitPrice",
            "costSnapshot",
            "subtotal",
            "discountAmount",
            "taxIncluded",
            "lineTotal",
            "grossProfit"
          ) VALUES (
            ${saleItemId},
            ${saleId},
            ${line.productId},
            ${line.sku},
            ${line.name},
            ${line.quantity},
            ${line.unitPrice},
            ${line.cost},
            ${line.subtotal},
            ${line.discountAmount},
            ${line.taxIncluded},
            ${line.lineTotal},
            ${line.grossProfit}
          )
        `);

        await tx.$executeRaw(Prisma.sql`
          UPDATE "RetailProduct"
          SET "currentStock" = ${afterQuantity}, "updatedAt" = ${now}
          WHERE "businessId" = ${input.scope.businessId}
            AND "id" = ${line.productId}
        `);

        await tx.$executeRaw(Prisma.sql`
          INSERT INTO "RetailStockMovement" (
            "id",
            "businessId",
            "productId",
            "type",
            "reason",
            "source",
            "sourceId",
            "quantity",
            "beforeQuantity",
            "afterQuantity",
            "note",
            "createdById",
            "createdAt"
          ) VALUES (
            ${movementId},
            ${input.scope.businessId},
            ${line.productId},
            'out',
            'sale',
            'retail_sale',
            ${saleId},
            ${line.quantity},
            ${beforeQuantity},
            ${afterQuantity},
            'Retail checkout stock deduction.',
            ${input.actor.id},
            ${now}
          )
        `);
      }

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "RetailPayment" (
          "id",
          "saleId",
          "provider",
          "method",
          "status",
          "amount",
          "paidAt",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${paymentId},
          ${saleId},
          'manual',
          ${method},
          'paid',
          ${input.preview.payableTotal},
          ${now},
          ${now},
          ${now}
        )
      `);

      await tx.$executeRaw(Prisma.sql`
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
          ${createId()},
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

      await tx.$executeRaw(Prisma.sql`
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
          CAST(${JSON.stringify({ receiptNumber, total: input.preview.payableTotal, stockMovementIds })} AS jsonb),
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
    });
  },
} satisfies RetailRepository;
