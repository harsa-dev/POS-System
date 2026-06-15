import type { OrderStatus, Role } from "@prisma/client";

import {
  hasPermission,
  permissionKeys,
  type PermissionKey,
} from "../permissions/index.js";

export const businessOrderStatusTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SERVED", "CANCELLED"],
  SERVED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const businessOrderStatusPermissions: Record<OrderStatus, PermissionKey> = {
  PENDING_PAYMENT: permissionKeys.restaurant.orders.approve,
  PAID: permissionKeys.restaurant.payments.create,
  PREPARING: permissionKeys.restaurant.kitchen.update,
  READY: permissionKeys.restaurant.kitchen.update,
  SERVED: permissionKeys.restaurant.serving.update,
  COMPLETED: permissionKeys.restaurant.serving.update,
  CANCELLED: permissionKeys.restaurant.orders.cancel,
};

export type OrderStatusDecision =
  | {
      allowed: true;
      requiredPermission: PermissionKey;
    }
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
  const allowedNextStatuses = businessOrderStatusTransitions[currentStatus];

  if (!allowedNextStatuses.includes(nextStatus)) {
    return {
      allowed: false,
      reason: "INVALID_TRANSITION",
      allowedNextStatuses,
    };
  }

  const requiredPermission = businessOrderStatusPermissions[nextStatus];

  if (!hasPermission(role, requiredPermission)) {
    return {
      allowed: false,
      reason: "FORBIDDEN",
      requiredPermission,
    };
  }

  return {
    allowed: true,
    requiredPermission,
  };
}

export const legacyOrderStatusTransitions = businessOrderStatusTransitions;
export const legacyOrderStatusPermissions = businessOrderStatusPermissions;
