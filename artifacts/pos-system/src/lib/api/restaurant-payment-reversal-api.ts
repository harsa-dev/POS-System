import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";
import type { RestaurantCashflowReversalDto, RestaurantOrderDto, RestaurantPreviewWarningDto } from "@/lib/api/restaurant-api";

export type RestaurantPaymentReversalAction = "refund" | "void";

export type RestaurantPaymentReversalInput = {
  action?: RestaurantPaymentReversalAction | null;
  amount?: number | null;
  reason?: string | null;
};

export type RestaurantPaymentReversalPreviewDto = {
  kind: "payment_reversal";
  generatedAt: string;
  action: RestaurantPaymentReversalAction | null;
  order: RestaurantOrderDto | null;
  paymentStatus: string | null;
  amount: number;
  reason: string | null;
  allowed: boolean;
  cashflowWillBeReversed: boolean;
  paymentWillBeExpired: boolean;
  warnings: RestaurantPreviewWarningDto[];
  source: "preview";
};

export type RestaurantPaymentReversalWriteDto = {
  kind: "payment_reversal";
  generatedAt: string;
  action: RestaurantPaymentReversalAction;
  order: RestaurantOrderDto;
  previousPaymentStatus: string;
  currentPaymentStatus: string;
  amount: number;
  reason: string | null;
  cashflowReversal: RestaurantCashflowReversalDto;
  expectedCashAdjusted: boolean;
  warnings: RestaurantPreviewWarningDto[];
  source: "write";
};

export const restaurantPaymentReversalApi = {
  previewPaymentReversal: (orderId: string, input: RestaurantPaymentReversalInput = {}) =>
    apiClient.post<ApiEnvelope<RestaurantPaymentReversalPreviewDto>>(
      `/restaurant/orders/${orderId}/payment-reversal/preview`,
      input,
    ),
  reversePayment: (orderId: string, input: RestaurantPaymentReversalInput = {}) =>
    apiClient.post<ApiEnvelope<RestaurantPaymentReversalWriteDto>>(
      `/restaurant/orders/${orderId}/payment-reversal`,
      input,
    ),
};
