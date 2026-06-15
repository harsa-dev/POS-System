import { apiClient, apiFetch, type ApiEnvelope } from "@/lib/api/api-client";
import { readApiEnvelope } from "@/lib/api/read-api-envelope";
import type { InvoiceFollowUpStatus } from "@/lib/api/invoice-api";

export type InvoiceFollowUpAnalyticsActivityDto = {
  id: string;
  businessId: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  invoiceStatus: string;
  dueDate: string | null;
  grandTotal: number;
  status: InvoiceFollowUpStatus;
  note: string;
  nextFollowUpAt: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceFollowUpAnalyticsStatusBucketDto = {
  status: InvoiceFollowUpStatus;
  label: string;
  count: number;
  invoiceValue: number;
};

export type InvoiceFollowUpAnalyticsDto = {
  summary: {
    trackedInvoicesCount: number;
    totalFollowUps: number;
    unresolvedCount: number;
    resolvedCount: number;
    dueReminderCount: number;
    upcomingReminderCount: number;
    noNextFollowUpCount: number;
    contactedCount: number;
    waitingResponseCount: number;
    promisedPaymentCount: number;
    escalatedCount: number;
    totalTrackedValue: number;
    unresolvedValue: number;
    dueValue: number;
    lastUpdatedAt: string | null;
  };
  statusBuckets: InvoiceFollowUpAnalyticsStatusBucketDto[];
  recentActivity: InvoiceFollowUpAnalyticsActivityDto[];
};

export type InvoiceFollowUpExportDto = {
  rows: InvoiceFollowUpAnalyticsActivityDto[];
  meta: {
    exportedAt: string;
    rowCount: number;
    limit: number;
  };
};

export type InvoiceFollowUpCsvDownload = {
  blob: Blob;
  filename: string;
  rowCount: number | null;
  exportedAt: string | null;
};

function getFilenameFromDisposition(disposition: string | null) {
  if (!disposition) return null;
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? null;
}

export const invoiceFollowUpAnalyticsApi = {
  getAnalytics<T = InvoiceFollowUpAnalyticsDto>() {
    return apiClient.get<ApiEnvelope<T>>("/api/invoice-follow-up-analytics");
  },

  exportJson<T = InvoiceFollowUpExportDto>() {
    return apiClient.get<ApiEnvelope<T>>("/api/invoice-follow-ups/export?format=json");
  },

  async downloadCsv(): Promise<InvoiceFollowUpCsvDownload> {
    const response = await apiFetch("/api/invoice-follow-ups/export?format=csv", {
      credentials: "include",
    });

    if (!response.ok) {
      const body = await readApiEnvelope<Record<string, unknown>>(response, "invoice follow-up export");
      throw new Error(body.message ?? "Failed to export invoice follow-ups");
    }

    const blob = await response.blob();
    const filename = getFilenameFromDisposition(response.headers.get("content-disposition")) ?? "invoice-follow-ups.csv";
    const rowCountHeader = response.headers.get("x-row-count");

    return {
      blob,
      filename,
      rowCount: rowCountHeader ? Number(rowCountHeader) : null,
      exportedAt: response.headers.get("x-exported-at"),
    };
  },
};
