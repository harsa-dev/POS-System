import type { OrderStatus, Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { buildRestaurantAuditPayload } from "./restaurant.audit.js";
import { RestaurantWriteError } from "./restaurant.order-write.js";
import { restaurantPreviewService } from "./restaurant.preview.js";
import type {
  RestaurantActorContext,
  RestaurantOrderDto,
  RestaurantStatusActionPreviewInput,
  RestaurantStatusActionSurface,
  RestaurantStatusActionWriteDto,
  RestaurantTableDto,
} from "./restaurant.types.js";
import { getRestaurantAllowedNextStatuses } from "./restaurant.workflow.js";

const statusWriteInclude = {
  table: true,
  payment: true,
  items: {
    include: {
      menuItem: true,
    },
  },
} satisfies Prisma.OrderInclude;

type StatusWriteOrderRecord = Prisma.OrderGetPayload<{ include: typeof statusWriteInclude }>;

type StatusWriteTransition = {
  from: OrderStatus;
  to: OrderStatus;
  surface: RestaurantStatusActionSurface;
  tableStatusOnSuccess?: "CLEANING";
};

const RESTAURANT_STATUS_WRITE_TRANSITIONS: readonly StatusWriteTransition[] = [
  { from: "PAID", to: "PREPARING", surface: "kitchen" },
  { from: "PREPARING", to: "READY", surface: "kitchen" },
  { from: "READY", to: "SERVED", surface: "serving" },
  { from: "SERVED", to: "COMPLETED", surface: "serving", tableStatusOnSuccess: "CLEANING" },
];

function nowIso() {
  return new Date().toISOString();
}

function toIsoDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function formatOrderNumber(orderNumber: number) {
  return `#${String(orderNumber).padStart(4, "0")}`;
}

function mapTable(table: NonNullable<StatusWriteOrderRecord["table"]>): RestaurantTableDto {
  return {
    id: table.id,
    name: table.name,
    capacity: table.capacity,
    status: table.status,
    isActive: table.isActive,
    createdAt: table.createdAt.toISOString(),
  };
}

function mapOrder(order: StatusWriteOrderRecord): RestaurantOrderDto {
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

function findStatusWriteTransition(surface: RestaurantStatusActionSurface, from: OrderStatus, to: OrderStatus) {
  return RESTAURANT_STATUS_WRITE_TRANSITIONS.find(
    (transition) => transition.surface === surface && transition.from === from && transition.to === to,
  );
}

function assertStatusWriteTransition(surface: RestaurantStatusActionSurface, from: OrderStatus, to: OrderStatus) {
  if (to === "PAID") {
    throw new RestaurantWriteError("Restaurant payment confirmation must use the scoped payment confirm workflow.", 409);
  }

  if (to === "CANCELLED") {
    throw new RestaurantWriteError("Restaurant cancellation needs the reversal workflow and is handled in a later phase.", 409);
  }

  const allowedNextStatuses = getRestaurantAllowedNextStatuses(from);

  if (!allowedNextStatuses.includes(to)) {
    throw new RestaurantWriteError(`Restaurant workflow transition ${from} -> ${to} is not allowed.`, 409);
  }

  const writeTransition = findStatusWriteTransition(surface, from, to);

  if (!writeTransition) {
    throw new RestaurantWriteError(`Restaurant ${surface} workflow cannot write transition ${from} -> ${to}.`, 409);
  }

  return writeTransition;
}

export class RestaurantStatusWriteService {
  async updateStatus(
    actor: RestaurantActorContext,
    surface: RestaurantStatusActionSurface,
    input: RestaurantStatusActionPreviewInput,
  ): Promise<RestaurantStatusActionWriteDto> {
    const preview = await restaurantPreviewService.previewStatusAction(actor, surface, input);

    if (!preview.allowed || !preview.order || !preview.targetStatus || !preview.transition) {
      throw new RestaurantWriteError("Restaurant status transition cannot be written from the current preview state.", 409, preview.warnings);
    }

    const previousStatus = preview.currentStatus;
    const targetStatus = preview.targetStatus;

    if (!previousStatus) {
      throw new RestaurantWriteError("Restaurant status transition requires a current order status.", 409, preview.warnings);
    }

    const writeTransition = assertStatusWriteTransition(surface, previousStatus, targetStatus);

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          id: input.orderId,
          businessId: actor.businessId,
        },
        include: statusWriteInclude,
      });

      if (!order) {
        throw new RestaurantWriteError("Order was not found in this Restaurant business.", 404);
      }

      if (order.status !== previousStatus) {
        throw new RestaurantWriteError(`Order ${formatOrderNumber(order.orderNumber)} changed from ${previousStatus} to ${order.status}. Refresh before writing status.`, 409);
      }

      const tableStatusUpdated = Boolean(order.tableId && writeTransition.tableStatusOnSuccess);

      if (tableStatusUpdated) {
        await tx.diningTable.update({
          where: { id: order.tableId ?? "" },
          data: { status: writeTransition.tableStatusOnSuccess },
        });
      }

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: targetStatus },
        include: statusWriteInclude,
      });

      await tx.auditLog.create({
        data: {
          businessId: actor.businessId,
          userId: actor.userId,
          action: "UPDATE",
          entityType: "RestaurantOrder",
          entityId: updatedOrder.id,
          changes: buildRestaurantAuditPayload({
            event: "restaurant.workflow.status_updated",
            actor,
            references: {
              orderId: updatedOrder.id,
              tableId: updatedOrder.tableId ?? null,
            },
            totals: {
              total: updatedOrder.total,
              itemCount: updatedOrder.items.reduce((sum, item) => sum + item.quantity, 0),
            },
            status: {
              from: previousStatus,
              to: targetStatus,
            },
            metadata: {
              surface,
              actionKey: preview.transition?.actionKey,
              tableStatusUpdated,
              tableStatusOnSuccess: writeTransition.tableStatusOnSuccess ?? null,
            },
          }),
        },
      });

      return {
        order: mapOrder(updatedOrder),
        tableStatusUpdated,
      };
    });

    return {
      kind: surface,
      generatedAt: nowIso(),
      order: result.order,
      previousStatus,
      currentStatus: targetStatus,
      transition: preview.transition,
      tableStatusUpdated: result.tableStatusUpdated,
      warnings: preview.warnings,
      source: "write",
    };
  }
}

export const restaurantStatusWriteService = new RestaurantStatusWriteService();