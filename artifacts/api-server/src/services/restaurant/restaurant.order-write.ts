import type { CashflowAccount, OrderStatus, OrderType, Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { buildRestaurantAuditPayload } from "./restaurant.audit.js";
import { restaurantPreviewService } from "./restaurant.preview.js";
import type {
  RestaurantActorContext,
  RestaurantOrderDto,
  RestaurantOrderPreviewInput,
  RestaurantPaymentPreviewInput,
  RestaurantPreviewWarningDto,
  RestaurantTableDto,
} from "./restaurant.types.js";

const orderWriteInclude = {
  table: true,
  payment: true,
  items: {
    include: {
      menuItem: {
        include: {
          recipes: {
            include: {
              inventoryItem: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.OrderInclude;

const menuItemWriteInclude = {
  recipes: {
    include: {
      inventoryItem: true,
    },
  },
} satisfies Prisma.MenuItemInclude;

type OrderWriteRecord = Prisma.OrderGetPayload<{ include: typeof orderWriteInclude }>;
type MenuItemWriteRecord = Prisma.MenuItemGetPayload<{ include: typeof menuItemWriteInclude }>;
type RestaurantTransaction = Prisma.TransactionClient;

type NormalizedOrderItemInput = {
  menuItemId: string;
  quantity: number;
};

export type RestaurantStockMovementWriteDto = {
  inventoryItemId: string;
  inventoryItemName: string;
  quantity: number;
  beforeStock: number;
  afterStock: number;
  unit: string;
};

export type RestaurantOrderWriteResultDto = {
  kind: "order_create" | "payment_confirm";
  generatedAt: string;
  order: RestaurantOrderDto;
  stockMovements: RestaurantStockMovementWriteDto[];
  cashflowPosted: boolean;
  warnings: RestaurantPreviewWarningDto[];
  source: "write";
};

export class RestaurantWriteError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly warnings: RestaurantPreviewWarningDto[] = [],
  ) {
    super(message);
    this.name = "RestaurantWriteError";
  }
}

function toIsoDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function formatOrderNumber(orderNumber: number) {
  return `#${String(orderNumber).padStart(4, "0")}`;
}

function normalizeAmount(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function normalizePaymentMethod(value: unknown) {
  return String(value ?? "CASH").trim().toUpperCase() || "CASH";
}

function getCashflowAccount(paymentMethod: string): CashflowAccount {
  const normalized = paymentMethod.toUpperCase();

  if (normalized === "CASH" || normalized === "QRIS" || normalized === "CARD" || normalized === "TRANSFER") {
    return normalized;
  }

  return "OTHER";
}

function calculateRateAmount(subtotal: number, rate: number | null | undefined) {
  return Math.round(subtotal * ((rate ?? 0) / 100));
}

function normalizeOrderItems(items: RestaurantOrderPreviewInput["items"]): NormalizedOrderItemInput[] {
  const groupedItems = new Map<string, number>();

  for (const item of items) {
    const menuItemId = String(item.menuItemId ?? "").trim();
    const quantity = Number(item.quantity ?? 0);

    if (!menuItemId || !Number.isInteger(quantity) || quantity < 1) {
      throw new RestaurantWriteError("Order write requires positive integer item quantities.");
    }

    groupedItems.set(menuItemId, (groupedItems.get(menuItemId) ?? 0) + quantity);
  }

  return Array.from(groupedItems.entries()).map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
}

function mapTable(table: NonNullable<OrderWriteRecord["table"]>): RestaurantTableDto {
  return {
    id: table.id,
    name: table.name,
    capacity: table.capacity,
    status: table.status,
    isActive: table.isActive,
    createdAt: table.createdAt.toISOString(),
  };
}

function mapOrder(order: OrderWriteRecord): RestaurantOrderDto {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    code: formatOrderNumber(order.orderNumber),
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    serviceAmount: order.serviceAmount,
    total: order.total,
    paymentMethod: order.paymentMethod,
    amountPaid: order.amountPaid,
    changeAmount: order.changeAmount,
    status: order.status,
    inventoryDeducted: order.inventoryDeducted,
    type: order.type,
    table: order.table ? mapTable(order.table) : null,
    payment: order.payment
      ? {
          id: order.payment.id,
          provider: order.payment.provider,
          method: order.payment.method,
          status: order.payment.status,
          paidAt: toIsoDate(order.payment.paidAt),
          createdAt: order.payment.createdAt.toISOString(),
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      name: item.menuItem.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

async function getRestaurantSettings(tx: RestaurantTransaction, businessId: string) {
  return tx.restaurant.findUnique({
    where: { businessId },
    select: {
      taxRate: true,
      serviceRate: true,
      currency: true,
    },
  });
}

function getSubtotal(items: NormalizedOrderItemInput[], menuById: Map<string, MenuItemWriteRecord>) {
  return items.reduce((total, item) => {
    const menuItem = menuById.get(item.menuItemId);
    return total + (menuItem?.price ?? 0) * item.quantity;
  }, 0);
}

function assertMenuItems(items: NormalizedOrderItemInput[], menuItems: MenuItemWriteRecord[]) {
  if (menuItems.length !== items.length) {
    throw new RestaurantWriteError("One or more menu items are not available in this Restaurant business.");
  }
}

function assertCashPayment(paymentMethod: string, amountPaid: number, total: number) {
  if (paymentMethod !== "CASH") return;

  if (!Number.isFinite(amountPaid) || amountPaid < total) {
    throw new RestaurantWriteError("Cash order requires amountPaid greater than or equal to order total.");
  }
}

async function deductRecipeStock(
  tx: RestaurantTransaction,
  actor: RestaurantActorContext,
  orderId: string,
  orderItems: NormalizedOrderItemInput[],
  menuById: Map<string, MenuItemWriteRecord>,
): Promise<RestaurantStockMovementWriteDto[]> {
  const requirements = new Map<
    string,
    {
      inventoryItem: MenuItemWriteRecord["recipes"][number]["inventoryItem"];
      quantity: number;
      menuNames: Set<string>;
    }
  >();

  for (const item of orderItems) {
    const menuItem = menuById.get(item.menuItemId);
    if (!menuItem) continue;

    for (const recipe of menuItem.recipes) {
      const requiredQuantity = recipe.quantityNeeded * item.quantity;
      if (requiredQuantity <= 0) continue;

      const existing = requirements.get(recipe.inventoryItemId);
      if (existing) {
        existing.quantity += requiredQuantity;
        existing.menuNames.add(menuItem.name);
        continue;
      }

      requirements.set(recipe.inventoryItemId, {
        inventoryItem: recipe.inventoryItem,
        quantity: requiredQuantity,
        menuNames: new Set([menuItem.name]),
      });
    }
  }

  const stockMovements: RestaurantStockMovementWriteDto[] = [];

  for (const [inventoryItemId, requirement] of requirements) {
    const beforeStock = requirement.inventoryItem.currentStock;
    const afterStock = beforeStock - requirement.quantity;

    if (afterStock < 0) {
      throw new RestaurantWriteError(`${requirement.inventoryItem.name} does not have enough stock for this paid Restaurant order.`);
    }

    await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        currentStock: {
          decrement: requirement.quantity,
        },
      },
    });

    await tx.stockMovement.create({
      data: {
        businessId: actor.businessId,
        inventoryItemId,
        type: "OUT",
        reason: "RECIPE_USAGE",
        source: "ORDER",
        sourceType: "ORDER",
        sourceId: orderId,
        quantity: requirement.quantity,
        note: `Restaurant order recipe usage for ${Array.from(requirement.menuNames).join(", ")}`,
        createdById: actor.userId,
        actorId: actor.userId,
      },
    });

    stockMovements.push({
      inventoryItemId,
      inventoryItemName: requirement.inventoryItem.name,
      quantity: requirement.quantity,
      beforeStock,
      afterStock,
      unit: requirement.inventoryItem.unit,
    });
  }

  return stockMovements;
}

async function postPaymentCashflow(
  tx: RestaurantTransaction,
  actor: RestaurantActorContext,
  order: { id: string; orderNumber: number; total: number; paymentMethod: string },
) {
  const existingEntry = await tx.cashflowEntry.findFirst({
    where: {
      businessId: actor.businessId,
      sourceType: "ORDER_PAYMENT",
      sourceId: order.id,
    },
  });

  const data = {
    businessId: actor.businessId,
    type: "INCOME" as const,
    account: getCashflowAccount(order.paymentMethod),
    amount: order.total,
    status: "POSTED" as const,
    occurredAt: new Date(),
    title: `Restaurant order ${formatOrderNumber(order.orderNumber)} payment`,
    description: `Payment received through ${order.paymentMethod}.`,
    sourceType: "ORDER_PAYMENT" as const,
    sourceId: order.id,
    reference: formatOrderNumber(order.orderNumber),
    createdById: actor.userId,
  };

  if (existingEntry) {
    await tx.cashflowEntry.update({
      where: { id: existingEntry.id },
      data,
    });
    return true;
  }

  await tx.cashflowEntry.create({ data });
  return true;
}

export class RestaurantOrderWriteService {
  async createOrder(actor: RestaurantActorContext, input: RestaurantOrderPreviewInput): Promise<RestaurantOrderWriteResultDto> {
    const preview = await restaurantPreviewService.previewOrder(actor, input);

    if (!preview.canSubmit) {
      throw new RestaurantWriteError("Restaurant order cannot be submitted from the current preview state.", 409, preview.warnings);
    }

    const normalizedItems = normalizeOrderItems(input.items);
    const orderType: OrderType = input.type === "TAKEAWAY" ? "TAKEAWAY" : "DINE_IN";
    const paymentMethod = normalizePaymentMethod(input.paymentMethod);
    const requestedAmountPaid = normalizeAmount(input.amountPaid);

    const result = await prisma.$transaction(async (tx) => {
      const [settings, menuItems, table, openShift, maxOrder] = await Promise.all([
        getRestaurantSettings(tx, actor.businessId),
        tx.menuItem.findMany({
          where: {
            businessId: actor.businessId,
            id: { in: normalizedItems.map((item) => item.menuItemId) },
            isAvailable: true,
          },
          include: menuItemWriteInclude,
        }),
        orderType === "DINE_IN" && input.tableId
          ? tx.diningTable.findFirst({
              where: {
                id: input.tableId,
                businessId: actor.businessId,
                isActive: true,
              },
            })
          : Promise.resolve(null),
        tx.shift.findFirst({
          where: {
            businessId: actor.businessId,
            userId: actor.userId,
            status: "OPEN",
          },
          orderBy: { openedAt: "desc" },
        }),
        tx.order.aggregate({
          where: { businessId: actor.businessId },
          _max: { orderNumber: true },
        }),
      ]);

      assertMenuItems(normalizedItems, menuItems);

      if (orderType === "DINE_IN" && !table) {
        throw new RestaurantWriteError("Dine-in order requires an active table in this Restaurant business.");
      }

      if (table && table.status !== "AVAILABLE") {
        throw new RestaurantWriteError(`${table.name} is currently ${table.status} and cannot be assigned to a new dine-in order.`, 409);
      }

      if (orderType === "TAKEAWAY" && input.tableId) {
        throw new RestaurantWriteError("Takeaway order must not include a tableId.");
      }

      const menuById = new Map(menuItems.map((item) => [item.id, item]));
      const subtotal = getSubtotal(normalizedItems, menuById);
      const taxAmount = calculateRateAmount(subtotal, settings?.taxRate);
      const serviceAmount = calculateRateAmount(subtotal, settings?.serviceRate);
      const total = subtotal + taxAmount + serviceAmount;
      const initialStatus: OrderStatus = paymentMethod === "CASH" ? "PAID" : "PENDING_PAYMENT";
      const amountPaid = initialStatus === "PAID" ? requestedAmountPaid : 0;
      const changeAmount = initialStatus === "PAID" ? Math.max(0, amountPaid - total) : 0;

      assertCashPayment(paymentMethod, amountPaid, total);

      const order = await tx.order.create({
        data: {
          businessId: actor.businessId,
          orderNumber: (maxOrder._max.orderNumber ?? 0) + 1,
          subtotal,
          taxAmount,
          serviceAmount,
          total,
          paymentMethod,
          amountPaid,
          changeAmount,
          status: initialStatus,
          inventoryDeducted: false,
          shiftId: openShift?.id ?? null,
          tableId: table?.id ?? null,
          type: orderType,
          items: {
            create: normalizedItems.map((item) => {
              const menuItem = menuById.get(item.menuItemId);
              const price = menuItem?.price ?? 0;

              return {
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price,
                subtotal: price * item.quantity,
              };
            }),
          },
          payment: {
            create: {
              provider: "manual",
              method: paymentMethod,
              status: initialStatus === "PAID" ? "PAID" : "PENDING",
              paidAt: initialStatus === "PAID" ? new Date() : null,
            },
          },
        },
        include: orderWriteInclude,
      });

      let stockMovements: RestaurantStockMovementWriteDto[] = [];
      let cashflowPosted = false;

      if (initialStatus === "PAID") {
        stockMovements = await deductRecipeStock(tx, actor, order.id, normalizedItems, menuById);
        cashflowPosted = await postPaymentCashflow(tx, actor, order);

        await tx.order.update({
          where: { id: order.id },
          data: { inventoryDeducted: stockMovements.length > 0 },
        });

        if (openShift && paymentMethod === "CASH") {
          await tx.shift.update({
            where: { id: openShift.id },
            data: {
              expectedCash: {
                increment: total,
              },
            },
          });
        }
      }

      if (table) {
        await tx.diningTable.update({
          where: { id: table.id },
          data: { status: "OCCUPIED" },
        });
      }

      await tx.auditLog.create({
        data: {
          businessId: actor.businessId,
          userId: actor.userId,
          action: "CREATE",
          entityType: "RestaurantOrder",
          entityId: order.id,
          changes: buildRestaurantAuditPayload({
            event: "restaurant.order.created",
            actor,
            references: {
              orderId: order.id,
              tableId: table?.id ?? null,
              shiftId: openShift?.id ?? null,
            },
            totals: {
              subtotal,
              taxAmount,
              serviceAmount,
              total,
              itemCount: normalizedItems.reduce((sum, item) => sum + item.quantity, 0),
              stockMovementCount: stockMovements.length,
            },
            status: {
              to: initialStatus,
            },
            metadata: {
              paymentMethod,
              orderType,
              cashflowPosted,
            },
          }),
        },
      });

      const updatedOrder = await tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: orderWriteInclude,
      });

      return {
        kind: "order_create" as const,
        order: mapOrder(updatedOrder),
        stockMovements,
        cashflowPosted,
      };
    });

    return {
      kind: result.kind,
      generatedAt: new Date().toISOString(),
      order: result.order,
      stockMovements: result.stockMovements,
      cashflowPosted: result.cashflowPosted,
      warnings: preview.warnings,
      source: "write",
    };
  }

  async confirmPayment(actor: RestaurantActorContext, input: RestaurantPaymentPreviewInput): Promise<RestaurantOrderWriteResultDto> {
    const preview = await restaurantPreviewService.previewPayment(actor, input);

    if (!preview.canConfirm) {
      throw new RestaurantWriteError("Restaurant payment cannot be confirmed from the current preview state.", 409, preview.warnings);
    }

    const paymentMethod = normalizePaymentMethod(input.paymentMethod ?? preview.paymentMethod ?? "CASH");
    const amountPaid = normalizeAmount(input.amountPaid);

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          id: input.orderId,
          businessId: actor.businessId,
        },
        include: orderWriteInclude,
      });

      if (!order) {
        throw new RestaurantWriteError("Order was not found in this Restaurant business.", 404);
      }

      if (order.status !== "PENDING_PAYMENT") {
        throw new RestaurantWriteError(`Order ${formatOrderNumber(order.orderNumber)} is ${order.status}, so payment cannot be confirmed.`, 409);
      }

      if (amountPaid < order.total) {
        throw new RestaurantWriteError(`Payment is short by ${order.total - amountPaid}.`, 409);
      }

      const normalizedItems = order.items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      }));
      const menuById = new Map(order.items.map((item) => [item.menuItemId, item.menuItem]));
      const changeAmount = Math.max(0, amountPaid - order.total);
      let stockMovements: RestaurantStockMovementWriteDto[] = [];

      if (!order.inventoryDeducted) {
        stockMovements = await deductRecipeStock(tx, actor, order.id, normalizedItems, menuById);
      }

      await tx.payment.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          provider: "manual",
          method: paymentMethod,
          status: "PAID",
          paidAt: new Date(),
        },
        update: {
          provider: "manual",
          method: paymentMethod,
          status: "PAID",
          paidAt: new Date(),
        },
      });

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paymentMethod,
          amountPaid,
          changeAmount,
          inventoryDeducted: order.inventoryDeducted || stockMovements.length > 0,
        },
        include: orderWriteInclude,
      });

      const cashflowPosted = await postPaymentCashflow(tx, actor, updatedOrder);

      if (paymentMethod === "CASH") {
        const openShift = await tx.shift.findFirst({
          where: {
            businessId: actor.businessId,
            userId: actor.userId,
            status: "OPEN",
          },
          orderBy: { openedAt: "desc" },
        });

        if (openShift) {
          await tx.shift.update({
            where: { id: openShift.id },
            data: {
              expectedCash: {
                increment: updatedOrder.total,
              },
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          businessId: actor.businessId,
          userId: actor.userId,
          action: "UPDATE",
          entityType: "RestaurantOrder",
          entityId: updatedOrder.id,
          changes: buildRestaurantAuditPayload({
            event: "restaurant.payment.confirmed",
            actor,
            references: {
              orderId: updatedOrder.id,
              paymentId: updatedOrder.payment?.id ?? null,
            },
            totals: {
              total: updatedOrder.total,
              amountPaid,
              changeAmount,
              stockMovementCount: stockMovements.length,
            },
            status: {
              from: order.status,
              to: updatedOrder.status,
            },
            metadata: {
              paymentMethod,
              cashflowPosted,
              inventoryDeducted: updatedOrder.inventoryDeducted,
            },
          }),
        },
      });

      return {
        kind: "payment_confirm" as const,
        order: mapOrder(updatedOrder),
        stockMovements,
        cashflowPosted,
      };
    });

    return {
      kind: result.kind,
      generatedAt: new Date().toISOString(),
      order: result.order,
      stockMovements: result.stockMovements,
      cashflowPosted: result.cashflowPosted,
      warnings: preview.warnings,
      source: "write",
    };
  }
}

export const restaurantOrderWriteService = new RestaurantOrderWriteService();
