import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";
import {
  buildSalesAnalyticsQueryString,
  type SalesAnalyticsQuery,
} from "@/lib/api/sales-analytics-api";

export type SalesPaymentIntegrityIssue =
  | "orders_without_paid_payment"
  | "payment_total_mismatch"
  | "all";

export type SalesPaymentIntegrityReviewStatus = "REVIEWED" | "IGNORED" | "RESOLVED";

export type SalesPaymentIntegrityReviewFilter =
  | "all"
  | "unreviewed"
  | SalesPaymentIntegrityReviewStatus;

export type SalesPaymentIntegrityReviewDto = {
  id: string;
  businessId: string;
  issueType: Exclude<SalesPaymentIntegrityIssue, "all">;
  orderId: string;
  status: SalesPaymentIntegrityReviewStatus;
  note: string;
  reviewedById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SalesPaymentIntegrityReviewsDto = {
  rows: SalesPaymentIntegrityReviewDto[];
};

export type SaveSalesPaymentIntegrityReviewPayload = {
  issueType: Exclude<SalesPaymentIntegrityIssue, "all">;
  orderId: string;
  status: SalesPaymentIntegrityReviewStatus;
  note: string;
};

export type SalesPaymentIntegrityRowDto = {
  id: string;
  issueType: Exclude<SalesPaymentIntegrityIssue, "all">;
  severity: "critical";
  orderId: string;
  orderNumber: number;
  orderDate: string;
  orderStatus: string;
  paymentMethod: string;
  orderTotal: number;
  amountPaid: number;
  difference: number;
  paymentId: string | null;
  paymentStatus: string | null;
  paymentProvider: string | null;
  paidAt: string | null;
  recommendedAction: string;
  reviewStatus: SalesPaymentIntegrityReviewStatus | null;
  reviewNote: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
};

export type SalesPaymentIntegrityBucketDto = {
  issueType: Exclude<SalesPaymentIntegrityIssue, "all">;
  count: number;
  totalValue: number;
};

export type SalesPaymentIntegritySummaryDto = {
  totalIssues: number;
  totalValueAtRisk: number;
  buckets: SalesPaymentIntegrityBucketDto[];
};

export type SalesPaymentIntegrityDto = {
  generatedAt: string;
  period: {
    from: string;
    to: string;
  };
  issue: SalesPaymentIntegrityIssue;
  reviewStatus: SalesPaymentIntegrityReviewFilter;
  limit: number;
  summary: SalesPaymentIntegritySummaryDto;
  rows: SalesPaymentIntegrityRowDto[];
};

export type SalesPaymentIntegrityExportDto = {
  exportedAt: string;
  format: "csv" | "json";
  filename: string;
  contentType: string;
  content?: string;
  rows?: SalesPaymentIntegrityRowDto[];
  meta: {
    issue: SalesPaymentIntegrityIssue;
    reviewStatus: SalesPaymentIntegrityReviewFilter;
    rowCount: number;
    period: {
      from: string;
      to: string;
    };
  };
};

export type SalesPaymentIntegrityQuery = SalesAnalyticsQuery & {
  issue?: SalesPaymentIntegrityIssue;
  reviewStatus?: SalesPaymentIntegrityReviewFilter;
  limit?: number;
};

function buildPaymentIntegrityQueryString(params?: SalesPaymentIntegrityQuery & { format?: "csv" | "json" }) {
  const query = buildSalesAnalyticsQueryString(params);
  const searchParams = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);

  if (params?.issue) searchParams.set("issue", params.issue);
  if (params?.reviewStatus) searchParams.set("reviewStatus", params.reviewStatus);
  if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params?.format) searchParams.set("format", params.format);

  const nextQuery = searchParams.toString();

  return nextQuery ? `?${nextQuery}` : "";
}

export const salesPaymentIntegrityApi = {
  getWorkbench(params?: SalesPaymentIntegrityQuery) {
    return apiClient.get<ApiEnvelope<SalesPaymentIntegrityDto>>(
      `/api/sales-analytics/payment-integrity${buildPaymentIntegrityQueryString(params)}`,
    );
  },

  listReviews() {
    return apiClient.get<ApiEnvelope<SalesPaymentIntegrityReviewsDto>>(
      "/api/sales-analytics/payment-integrity/reviews",
    );
  },

  saveReview(payload: SaveSalesPaymentIntegrityReviewPayload) {
    return apiClient.post<ApiEnvelope<SalesPaymentIntegrityReviewDto>>(
      "/api/sales-analytics/payment-integrity/reviews",
      payload,
    );
  },

  exportCsv(params?: SalesPaymentIntegrityQuery) {
    return apiClient.get<ApiEnvelope<SalesPaymentIntegrityExportDto>>(
      `/api/sales-analytics/payment-integrity/export${buildPaymentIntegrityQueryString({
        ...params,
        format: "csv",
      })}`,
    );
  },

  exportJson(params?: SalesPaymentIntegrityQuery) {
    return apiClient.get<ApiEnvelope<SalesPaymentIntegrityExportDto>>(
      `/api/sales-analytics/payment-integrity/export${buildPaymentIntegrityQueryString({
        ...params,
        format: "json",
      })}`,
    );
  },
};