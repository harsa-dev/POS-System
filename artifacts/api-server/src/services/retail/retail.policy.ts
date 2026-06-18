import type { Role } from "@prisma/client";

export const RETAIL_READ_ROLES: Role[] = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF", "VIEWER"];
export const RETAIL_CHECKOUT_ROLES: Role[] = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF"];
export const RETAIL_RECEIVING_ROLES: Role[] = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF"];
export const RETAIL_RETURN_PREVIEW_ROLES: Role[] = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF"];
export const RETAIL_RETURN_ROLES: Role[] = ["OWNER", "MANAGER", "ADMIN"];
export const RETAIL_CANCELLATION_ROLES: Role[] = ["OWNER", "MANAGER", "ADMIN"];
export const RETAIL_MANAGER_ROLES: Role[] = ["OWNER", "MANAGER", "ADMIN"];
export const RETAIL_ADJUSTMENT_ROLES: Role[] = ["OWNER", "MANAGER", "ADMIN"];

export const retailPermissionPolicy = {
  read: RETAIL_READ_ROLES,
  checkout: RETAIL_CHECKOUT_ROLES,
  receivingStatusUpdate: RETAIL_RECEIVING_ROLES,
  returnPreview: RETAIL_RETURN_PREVIEW_ROLES,
  returnPersist: RETAIL_RETURN_ROLES,
  saleCancellation: RETAIL_CANCELLATION_ROLES,
  stockAdjust: RETAIL_ADJUSTMENT_ROLES,
  promotionToggle: RETAIL_MANAGER_ROLES,
} as const;
