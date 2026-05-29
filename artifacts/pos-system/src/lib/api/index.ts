export {
  API_URL,
  ApiError,
  apiClient,
  apiFetch,
  apiJson,
  apiRequest,
  getApiErrorMessage,
  resolveApiUrl,
  resolveMediaUrl,
  type ApiEnvelope,
  type ApiErrorKind,
} from "@/lib/api/api-client";

export { authApi, type AuthUser, type LoginRequest, type RegisterRequest } from "@/lib/api/auth-api";
export {
  menuApi,
  type CategoryPayload,
  type MenuItemPayload,
  type RecipePayload,
  type UploadImageResponse,
} from "@/lib/api/menu-api";
export {
  orderApi,
  type CreateOrderPayload,
  type MoveTablePayload,
  type UpdateOrderStatusPayload,
} from "@/lib/api/order-api";
export {
  inventoryApi,
  type InventoryItemPayload,
  type StockMovementPayload,
} from "@/lib/api/inventory-api";
export { analyticsApi } from "@/lib/api/analytics-api";
export { tablesApi } from "@/lib/api/tables-api";
export { settingsApi } from "@/lib/api/settings-api";
export { employeesApi } from "@/lib/api/employees-api";
export { attendanceApi } from "@/lib/api/attendance-api";
export { shiftsApi } from "@/lib/api/shifts-api";
export { auditApi } from "@/lib/api/audit-api";
export { paymentsApi } from "@/lib/api/payments-api";
