export {
  API_URL,
  ApiError,
  apiClient,
  apiFetch,
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
