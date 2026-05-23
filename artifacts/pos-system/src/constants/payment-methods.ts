// ---------------------------------------------------------------------------
// Payment method constants — single source of truth for payment method strings
// ---------------------------------------------------------------------------
export const PAYMENT_METHODS = {
  CASH: "CASH",
  QRIS: "QRIS",
  CARD: "CARD",
  TRANSFER: "TRANSFER",
} as const;

export type PaymentMethodName =
  (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodName, string> = {
  CASH: "Cash",
  QRIS: "QRIS",
  CARD: "Card",
  TRANSFER: "Bank Transfer",
};
