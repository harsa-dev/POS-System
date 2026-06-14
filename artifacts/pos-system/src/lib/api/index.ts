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
  type RecipeUpdatePayload,
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
export { tablesApi } from "@/lib/api/tables-api";
export { settingsApi } from "@/lib/api/settings-api";
export { paymentsApi } from "@/lib/api/payments-api";
export {
  restaurantApi,
  type RestaurantCategoryDto,
  type RestaurantDashboardSummaryDto,
  type RestaurantMenuItemDto,
  type RestaurantOrderDto,
  type RestaurantOrderItemDto,
  type RestaurantPaymentDto,
  type RestaurantRecipeIngredientDto,
  type RestaurantSharedDashboardDto,
  type RestaurantSharedDashboardId,
  type RestaurantSharedDashboardMetricDto,
  type RestaurantSharedDashboardRowDto,
  type RestaurantTableDto,
  type RestaurantWorkflowPreviewDto,
} from "@/lib/api/restaurant-api";
export {
  restaurantPaymentReversalApi,
  type RestaurantPaymentReversalAction,
  type RestaurantPaymentReversalInput,
  type RestaurantPaymentReversalPreviewDto,
  type RestaurantPaymentReversalWriteDto,
} from "@/lib/api/restaurant-payment-reversal-api";
export {
  invoiceApi,
  type InvoiceApiResult,
  type InvoiceBackendStatus,
  type InvoiceDiscountType,
  type InvoicePayload,
  type InvoiceRecord,
} from "@/lib/api/invoice-api";
