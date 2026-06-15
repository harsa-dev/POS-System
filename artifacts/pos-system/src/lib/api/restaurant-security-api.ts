import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

export type RestaurantPermissionCapability =
  | "restaurant.dashboard.view"
  | "restaurant.shared-dashboard.view"
  | "restaurant.menu.view"
  | "restaurant.menu.manage"
  | "restaurant.tables.view"
  | "restaurant.tables.manage"
  | "restaurant.orders.view"
  | "restaurant.orders.create"
  | "restaurant.orders.cancel"
  | "restaurant.workflow.preview"
  | "restaurant.workflow.update"
  | "restaurant.kitchen.update"
  | "restaurant.serving.update"
  | "restaurant.payments.view"
  | "restaurant.payments.create"
  | "restaurant.payments.refund"
  | "restaurant.payments.void"
  | "restaurant.audit.view"
  | "restaurant.policy.view";

export type RestaurantRole = "OWNER" | "MANAGER" | "ADMIN" | "OPERATOR" | "STAFF" | "VIEWER";

export type RestaurantAuditEventDto = {
  event: string;
  category: "order" | "payment" | "workflow";
  severity: "info" | "warning";
  requiresReason: boolean;
};

export type RestaurantSecurityPolicyDto = {
  generatedAt: string;
  businessId: string;
  viewer: {
    userId: string;
    role: RestaurantRole;
  };
  permissions: Record<RestaurantPermissionCapability, readonly RestaurantRole[]>;
  audit: {
    events: RestaurantAuditEventDto[];
  };
  source: "restaurant-security-policy";
};

export const restaurantSecurityApi = {
  getSecurityPolicy: () =>
    apiClient.get<ApiEnvelope<RestaurantSecurityPolicyDto>>("/restaurant/security/policy"),
};
