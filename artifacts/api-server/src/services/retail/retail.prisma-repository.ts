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

type RetailProductRow = Omit<RetailProductDto, "status"> & {
  status: RetailProductDto["status"];
};

type RetailReceivingRow = {
  id: string;
  supplierId: string;
  supplierName: string;
  status: RetailReceivingQueueDto["status"];
  expectedDate: Date;
  totalCost: number;
};

type RetailReceivingItemRow = {
  receivingId: string;
  productId: string;
  sku: string;
  orderedQty: number;
  receivedQty: number;
};

type ProductLockRow = {
  id: string;
  sku: string;
  name: string;
  cost: number;
  currentStock: number;
};

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

export const retailPrismaRepository = {
  async listProducts(scope) {
    return prisma.$queryRaw<RetailProductRow[]>(Prisma.sql`
      SELECT
        "id",
        "sku",
        "barcode",
        "name",
        "brand",
        "category",
        "unit",
        "price",
        "cost",
        "taxRatePercent",
        "currentStock",
        "reorderPoint",
        "shelfLocation",
        "supplierId",
        CASE
          WHEN "currentStock" <= 0 THEN 'out-of-stock'
          WHEN "currentStock" <= "reorderPoint" THEN 'low-stock'
          ELSE 'in-stock'
        END AS "status"
      FROM "RetailProduct"
      WHERE "businessId" = ${scope.businessId}
        AND "isActive" = TRUE
      ORDER BY "name" ASC
    `);
  },

  async listSuppliers(scope) {
    return prisma.$queryRaw<RetailSupplierDto[]>(Prisma.sql`
      SELECT "id", "name", "leadTimeDays", "reliabilityScore"
      FROM "RetailSupplier"
      WHERE "businessId" = ${scope.businessId}
        AND "isActive" = TRUE
      ORDER BY "name" ASC
    `);
  },

  async listReceivingQueue(scope) {
    const rows = await prisma.$queryRaw<RetailReceivingRow[]>(Prisma.sql`
      SELECT
        r."id",
        r."supplierId",
        s."name" AS "supplierName",
        r."status",
        r."expectedDate",
        r."totalCost"
      FROM "RetailReceiving" r
      JOIN "RetailSupplier" s ON s."id" = r."supplierId"
      WHERE r."businessId" = ${scope.businessId}
      ORDER BY r."expectedDate" ASC
    `);

    if (rows.length === 0) return [];

    const receivingIds = rows.map((row) => row.id);
    const items = await prisma.$queryRaw<RetailReceivingItemRow[]>(Prisma.sql`
      SELECT
        i."receivingId",
        i."productId",
        p."sku",
        i."orderedQty",
        i."receivedQty"
      FROM "RetailReceivingItem" i
      JOIN "RetailProduct" p ON p."id" = i."productId"
      WHERE i."receivingId" IN (${Prisma.join(receivingIds)})
      ORDER BY p."sku" ASC
    `);

    return rows.map((row) => ({
      id: row.id,
      supplierId: row.supplierId,
      supplierName: row.supplierName,
      status: row.status,
      expectedDate: row.expectedDate.toISOString(),
      totalCost: row.totalCost,
      items: items
        .filter((item) => item.receivingId === row.id)
        .map((item) => ({
          productId: item.productId,
          sku: item.sku,
          orderedQty: item.orderedQty,
          receivedQty: item.receivedQty,
          missingQty: Math.max(item.orderedQty - item.receivedQty, 0),
        })),
    }));
  },

  async findProductById(scope, productId) {
    const rows = await prisma.$queryRaw<RetailProductRow[]>(Prisma.sql`
      SELECT
        "id",
        "sku",
        "barcode",
        "name",
        "brand",
        "category",
        "unit",
        "price",
        "cost",
        "taxRatePercent",
        "currentStock",
        "reorderPoint",
        "shelfLocation",
        "supplierId",
        CASE
          WHEN "currentStock" <= 0 THEN 'out-of-stock'
          WHEN "currentStock" <= "reorderPoint" THEN 'low-stock'
          ELSE 'in-stock'
        END AS "status"
      FROM "RetailProduct"
      WHERE "businessId" = ${scope.businessId}
        AND "id" = ${productId}
        AND "isActive" = TRUE
      LIMIT 1
    `);

    return rows[0] ?? null;
  },

  async findProductByCode(scope, code) {
    const normalizedCode = code.trim().toLowerCase();
    const rows = await prisma.$queryRaw<RetailProductRow[]>(Prisma.sql`
      SELECT
        "id",
        "sku",
        "barcode",
        "name",
        "brand",
        "category",
        "unit",
        "price",
        "cost",
        "taxRatePercent",
        "currentStock",
        "reorderPoint",
        "shelfLocation",
        "supplierId",
        CASE
          WHEN "currentStock" <= 0 THEN 'out-of-stock'
          WHEN "currentStock" <= "reorderPoint" THEN 'low-stock'
          ELSE 'in-stock'
        END AS "status"
      FROM "RetailProduct"
      WHERE "businessId" = ${scope.businessId}
        AND "isActive" = TRUE
        AND (LOWER("barcode") = ${normalizedCode} OR LOWER("sku") = ${normalizedCode})
      LIMIT 1
    `);

    return rows[0] ?? null;
  },

  async getInventoryRisks(scope) {
    return prisma.$queryRaw<RetailInventoryRiskDto[]>(Prisma.sql`
      SELECT
        "id" AS "productId",
        "sku",
        "name",
        "currentStock",
        "reorderPoint",
        GREATEST(("reorderPoint" * 2) - "currentStock", "reorderPoint") AS "suggestedOrderQty",
        GREATEST(("reorderPoint" * 2) - "currentStock", "reorderPoint") * "cost" AS "estimatedCost",
        "supplierId"
      FROM "RetailProduct"
      WHERE "businessId" = ${scope.businessId}
        AND "isActive" = TRUE
        AND "currentStock" <= "reorderPoint"
      ORDER BY "currentStock" ASC, "name" ASC
    `);
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
