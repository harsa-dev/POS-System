export const errorCodes = {
  badRequest: "BAD_REQUEST",
  validationError: "VALIDATION_ERROR",
  unauthorized: "UNAUTHORIZED",
  forbidden: "FORBIDDEN",
  notFound: "NOT_FOUND",
  conflict: "CONFLICT",
  internalServerError: "INTERNAL_SERVER_ERROR",
  serviceUnavailable: "SERVICE_UNAVAILABLE",

  invalidCredentials: "INVALID_CREDENTIALS",
  userInactive: "USER_INACTIVE",
  emailAlreadyExists: "EMAIL_ALREADY_EXISTS",
  passwordTooWeak: "PASSWORD_TOO_WEAK",

  businessNotFound: "BUSINESS_NOT_FOUND",
  restaurantNotFound: "RESTAURANT_NOT_FOUND",
  orderNotFound: "ORDER_NOT_FOUND",
  duplicatePayment: "DUPLICATE_PAYMENT",
  invalidStateTransition: "INVALID_STATE_TRANSITION",
  insufficientStock: "INSUFFICIENT_STOCK",

  paymentProviderNotConfigured: "PAYMENT_PROVIDER_NOT_CONFIGURED",
  paymentProviderError: "PAYMENT_PROVIDER_ERROR",
  paymentWebhookPayloadInvalid: "PAYMENT_WEBHOOK_PAYLOAD_INVALID",
  paymentWebhookSignatureInvalid: "PAYMENT_WEBHOOK_SIGNATURE_INVALID",

  inventoryItemNotFound: "INVENTORY_ITEM_NOT_FOUND",
  invalidStockQuantity: "INVALID_STOCK_QUANTITY",
  invalidStockMovementType: "INVALID_STOCK_MOVEMENT_TYPE",
  negativeStockNotAllowed: "NEGATIVE_STOCK_NOT_ALLOWED",

  cashflowEntryNotFound: "CASHFLOW_ENTRY_NOT_FOUND",
  duplicateCashflowEntry: "DUPLICATE_CASHFLOW_ENTRY",
  invalidCashflowAmount: "INVALID_CASHFLOW_AMOUNT",
  invalidCashflowStatus: "INVALID_CASHFLOW_STATUS",
  cashflowSourceNotReady: "CASHFLOW_SOURCE_NOT_READY",

  rateLimited: "RATE_LIMITED",
} as const;

export type ErrorCode = (typeof errorCodes)[keyof typeof errorCodes];
