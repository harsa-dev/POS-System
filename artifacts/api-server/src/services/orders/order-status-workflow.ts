import type { OrderStatus } from "@prisma/client";

import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";

/**
 * Current runtime order statuses are still based on the existing Prisma enum.
 *
 * The architecture docs describe the future V3 workflow with:
 * WAITING_CASHIER_APPROVAL -> WAITING_PAYMENT -> PAID -> PREPARING -> READY -> SERVED -> COMPLETED.
 *
 * The current database enum still uses PENDING_PAYMENT and does not yet include
 * WAITING_CASHIER_APPROVAL, WAITING_PAYMENT, REJECTED, or REFUNDED.
 * Do not rename status values here without a dedicated schema + data migration.
 */
export const legacyRestaurantOrderTransitions = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SERVED", "CANCELLED"],
  SERVED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
} satisfies Record<OrderStatus, readonly OrderStatus[]>;

export function canMoveOrderStatus(currentStatus: OrderStatus, nextStatus: OrderStatus) {
  return legacyRestaurantOrderTransitions[currentStatus].includes(nextStatus);
}

export function assertCanMoveOrderStatus(currentStatus: OrderStatus, nextStatus: OrderStatus) {
  if (canMoveOrderStatus(currentStatus, nextStatus)) return;

  throw new AppError({
    statusCode: 400,
    code: errorCodes.invalidStateTransition,
    message: `Cannot transition order from ${currentStatus} to ${nextStatus}.`,
    details: {
      currentStatus,
      nextStatus,
      allowedNextStatuses: legacyRestaurantOrderTransitions[currentStatus],
    },
  });
}
