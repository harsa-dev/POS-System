export const errorCodes = {
  badRequest: "BAD_REQUEST",
  validationError: "VALIDATION_ERROR",
  unauthorized: "UNAUTHORIZED",
  forbidden: "FORBIDDEN",
  notFound: "NOT_FOUND",
  conflict: "CONFLICT",
  internalServerError: "INTERNAL_SERVER_ERROR",
  serviceUnavailable: "SERVICE_UNAVAILABLE",

  businessNotFound: "BUSINESS_NOT_FOUND",
  restaurantNotFound: "RESTAURANT_NOT_FOUND",
  orderNotFound: "ORDER_NOT_FOUND",
  duplicatePayment: "DUPLICATE_PAYMENT",
  invalidStateTransition: "INVALID_STATE_TRANSITION",
  insufficientStock: "INSUFFICIENT_STOCK",
  rateLimited: "RATE_LIMITED",
} as const;

export type ErrorCode = (typeof errorCodes)[keyof typeof errorCodes];
