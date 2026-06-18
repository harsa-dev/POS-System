import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { createRetailAuditPayload } from "./retail.audit.js";
import type { RetailCreateSaleInput, RetailRepository } from "./retail.repository.js";
import type {
  RetailInventoryRiskDto,
  RetailPersistedCheckoutDto,
  RetailProductDto,
  RetailPromotionDto,
  RetailReceivingQueueDto,
  RetailSaleDto,
  RetailStockAdjustInput,
  RetailStockAdjustResultDto,
  RetailStockMovementDto,
  RetailSupplierDto,
} from "./retail.types.js";

type DecimalLike = number | string | { toString(): string };

type RetailProductDelegateRow = Omit<RetailProductDto, "price" | "cost" | "taxRatePercent" | "status"> & {
  price: DecimalLike;
  cost: DecimalLike;
  taxRatePercent: DecimalLike;
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
} as const satisfies Prisma.RetailProductSelect;

export const retailPrismaRepository = {
  async listProducts(scope) {
    const products = await prisma.retailProduct.findMany({
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
    return prisma.retailSupplier.findMany({
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
    const receivings = await prisma.retailReceiving.findMany({
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
    const product = await prisma.retailProduct.findFirst({
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

    const product = await prisma.retailProduct.findFirst({
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
    const products = await prisma.retailProduct.findMany({
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
        const stockMovementIds: string[] = [];

        await tx.retailSale.create({
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

        await tx.retailSaleItem.createMany({
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
          const product = await tx.retailProduct.findFirst({
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
          const stockUpdate = await tx.retailProduct.updateMany({
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

          await tx.retailStockMovement.create({
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

        await tx.retailPayment.create({
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

  async listSales(scope, options = {}): Promise<RetailSaleDto[]> {
    const limit = options.limit ?? 50;
    const sales = await prisma.retailSale.findMany({
      where: { businessId: scope.businessId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        receiptNumber: true,
        paymentMethod: true,
        subtotal: true,
        discountTotal: true,
        taxIncluded: true,
        total: true,
        grossProfit: true,
        status: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    });
    return sales.map((sale) => ({
      id: sale.id,
      receiptNumber: sale.receiptNumber,
      paymentMethod: sale.paymentMethod,
      subtotal: toNumber(sale.subtotal),
      discountTotal: toNumber(sale.discountTotal),
      taxIncluded: toNumber(sale.taxIncluded),
      total: toNumber(sale.total),
      grossProfit: toNumber(sale.grossProfit),
      status: sale.status,
      createdAt: sale.createdAt.toISOString(),
      itemCount: sale._count.items,
    }));
  },

  async listStockMovements(scope, options = {}): Promise<RetailStockMovementDto[]> {
    const limit = options.limit ?? 50;
    const movements = await prisma.retailStockMovement.findMany({
      where: { businessId: scope.businessId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        productId: true,
        product: { select: { name: true, sku: true } },
        type: true,
        reason: true,
        source: true,
        quantity: true,
        beforeQuantity: true,
        afterQuantity: true,
        note: true,
        createdAt: true,
      },
    });
    return movements.map((m) => ({
      id: m.id,
      productId: m.productId,
      productName: m.product.name,
      sku: m.product.sku,
      type: m.type,
      reason: m.reason,
      source: m.source,
      quantity: m.quantity,
      beforeQuantity: m.beforeQuantity,
      afterQuantity: m.afterQuantity,
      note: m.note,
      createdAt: m.createdAt.toISOString(),
    }));
  },

  async adjustStock(scope, actor, input): Promise<RetailStockAdjustResultDto> {
    const product = await prisma.retailProduct.findFirst({
      where: { businessId: scope.businessId, id: input.productId, isActive: true },
      select: { id: true, sku: true, currentStock: true },
    });
    if (!product) throw new Error(`Retail product ${input.productId} not found.`);

    const beforeQuantity = product.currentStock;
    const afterQuantity = Math.max(0, beforeQuantity + input.quantityDelta);
    const now = new Date();
    const movementId = createId();

    await prisma.$transaction([
      prisma.retailProduct.update({
        where: { id: product.id },
        data: { currentStock: afterQuantity, updatedAt: now },
      }),
      prisma.retailStockMovement.create({
        data: {
          id: movementId,
          businessId: scope.businessId,
          productId: product.id,
          type: input.quantityDelta >= 0 ? "in" : "out",
          reason: "adjustment",
          source: "retail_opname",
          quantity: Math.abs(input.quantityDelta),
          beforeQuantity,
          afterQuantity,
          note: input.note ?? input.reason,
          createdById: actor.id,
          createdAt: now,
        },
      }),
    ]);

    return { movementId, productId: product.id, sku: product.sku, beforeQuantity, afterQuantity, quantityDelta: input.quantityDelta };
  },

  async listPromotions(scope): Promise<RetailPromotionDto[]> {
    const promos = await prisma.retailPromotion.findMany({
      where: { businessId: scope.businessId },
      orderBy: { startsAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        discountPercent: true,
        targetCategory: true,
        startsAt: true,
        endsAt: true,
        isActive: true,
        createdAt: true,
      },
    });
    return promos.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      discountPercent: p.discountPercent,
      targetCategory: p.targetCategory,
      startsAt: p.startsAt.toISOString(),
      endsAt: p.endsAt.toISOString(),
      isActive: p.isActive,
      createdAt: p.createdAt.toISOString(),
    }));
  },

  async togglePromotion(scope, promotionId) {
    const promo = await prisma.retailPromotion.findFirst({
      where: { businessId: scope.businessId, id: promotionId },
      select: { id: true, isActive: true },
    });
    if (!promo) return null;

    const updated = await prisma.retailPromotion.update({
      where: { id: promotionId },
      data: { isActive: !promo.isActive, updatedAt: new Date() },
      select: { id: true, isActive: true },
    });
    return updated;
  },
} satisfies RetailRepository;
