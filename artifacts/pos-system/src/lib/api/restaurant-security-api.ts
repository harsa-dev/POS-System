import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

export type RestaurantPermissionCapability =
  | "restaurant:read"
  | "restaurant:dashboard:read"
  | "restaurant:shared-dashboard:read"
  | "restaurant:menu:read"
  | "restaurant:menu:manage"
  | "restaurant:table:read"
  | "restaurant:table:manage"
  | "restaurant:order:read"
  | "restaurant:order:create"
  | "restaurant:order:cancel"
  | "restaurant:workflow:preview"
  | "restaurant:workflow:update"
  | "restaurant:kitchen:update"
  | "restaurant:serving:update"
  | "restaurant:payment:preview"
  | "restaurant:payment:confirm"
  | "restaurant:payment:refund"
  | "restaurant:payment:void"
  | "restaurant:audit:read"
  | "restaurant:policy:read";

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
