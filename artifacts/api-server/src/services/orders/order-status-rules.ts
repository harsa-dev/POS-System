import type { OrderStatus, Role } from "@prisma/client";

import {
  hasPermission,
  permissionKeys,
  type PermissionKey,
} from "../permissions/index.js";

export const legacyOrderStatusTransitions = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SERVED", "CANCELLED"],
  SERVED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
} satisfies Record<OrderStatus, readonly OrderStatus[]>;

export const legacyOrderStatusPermissions = {
  PENDING_PAYMENT: permissionKeys.restaurant.orders.approve,
  PAID: permissionKeys.restaurant.payments.create,
  PREPARING: permissionKeys.restaurant.kitchen.update,
  READY: permissionKeys.restaurant.kitchen.update,
  SERVED: permissionKeys.restaurant.serving.update,
  COMPLETED: permissionKeys.restaurant.serving.update,
  CANCELLED: permissionKeys.restaurant.orders.cancel,
} satisfies Record<OrderStatus, PermissionKey>;

export type OrderStatusDecision =
  | { allowed: true; requiredPermission: PermissionKey }
  | {
      allowed: false;
      reason: "INVALID_TRANSITION" | "FORBIDDEN";
      requiredPermission?: PermissionKey;
      allowedNextStatuses?: readonly OrderStatus[];
    };

export function checkOrderStatusTransition(params: {
  role: Role;
  currentStatus: OrderStatus;
  nextStatus: OrderStatus;
}): OrderStatusDecision {
  const { role, currentStatus, nextStatus } = params;
  const allowedNextStatuses = legacyOrderStatusTransitions[currentStatus];

  if (!allowedNextStatuses.includes(nextStatus)) {
    return {
      allowed: false,
      reason: "INVALID_TRANSITION",
      allowedNextStatuses,
    };
  }

  const requiredPermission = legacyOrderStatusPermissions[nextStatus];

  if (!hasPermission(role, requiredPermission)) {
    return {
      allowed: false,
      reason: "FORBIDDEN",
      requiredPermission,
    };
  }

  return { allowed: true, requiredPermission };
}
