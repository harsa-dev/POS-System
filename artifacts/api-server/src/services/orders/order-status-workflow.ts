import type { OrderStatus } from "@prisma/client";

import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";

export const legacyRestaurantOrderTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SERVED", "CANCELLED"],
  SERVED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

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
