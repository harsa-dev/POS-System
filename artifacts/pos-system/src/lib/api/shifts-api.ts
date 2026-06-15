import { apiClient, apiFetch, type ApiEnvelope } from "@/lib/api/api-client";
import { readApiEnvelope } from "@/lib/api/read-api-envelope";

import type { DateRangeOption } from "@/features/shared/types";

type ApiDataEnvelope<T> = ApiEnvelope<T> & { data: T };

export type ApiShiftStatus = "OPEN" | "CLOSED";

export type ShiftReportsBusinessMode =
  | "restaurant"
  | "retail"
  | "raw-material"
  | "custom-business";

export type CashierShiftReportsCapabilitiesDto = {
  businessId: string;
  businessMode: ShiftReportsBusinessMode;
  canView: boolean;
  canExport: boolean;
  canSyncToCashflow: boolean;
  isPlannedMode: boolean;
  plannedReason: string | null;
};

export type ApiShiftOrderDto = {
  id: string;
  total: number;
  paymentMethod: string;
  status: string;
};

export type ApiShiftReportSummaryDto = {
  totalSales: number;
  cashSales: number;
  transactionCount: number;
  cashTransactionCount: number;
  cashOut: number;
  endingCash: number;
  cashDifference: number;
  cashStatus: string;
  cashflowSynced: boolean;
  syncStatus: string;
};

export type ApiShiftDto = {
  id: string;
  userId: string;
  businessId: string;
  restaurantId?: string | null;
  status: ApiShiftStatus;
  openingCash: number;
  closingCash: number | null;
  expectedCash: number;
  cashDifference: number | null;
  openedAt: string;
  closedAt: string | null;
  cashflowSynced?: boolean;
  report?: {
    cashierName: string;
    businessScope: string;
    statusLabel: string;
  } & ApiShiftReportSummaryDto;
  user?: {
    name: string;
    email: string;
  };
  orders?: ApiShiftOrderDto[];
};

export type CashierShiftReportQuery = {
  status?: "All" | "Active" | "Completed" | "OPEN" | "CLOSED";
  cashier?: string;
  dateRange?: DateRangeOption;
  from?: string | null;
  to?: string | null;
  syncStatus?: "Synced" | "Not Synced" | "SYNCED" | "UNSYNCED";
  limit?: number;
};

export type CashierShiftReportDto = {
  generatedAt: string;
  filters: {
    status: string | null;
    cashier: string | null;
    syncStatus: string | null;
    dateRange: string | null;
    from: string | null;
    to: string | null;
    limit: number;
  };
  summary: {
    totalShifts: number;
    openShifts: number;
    closedShifts: number;
    syncedShifts: number;
    unsyncedClosedShifts: number;
    totalSales: number;
    cashSales: number;
    netCashDifference: number;
  };
  rows: ApiShiftDto[];
};

export type CashierShiftReportExportDto = {
  rows: ApiShiftDto[];
  meta: {
    exportedAt: string;
    rowCount: number;
    limit: number;
    filters: Record<string, string | null>;
  };
};

export type CashierShiftReportCsvDownload = {
  blob: Blob;
  filename: string;
  rowCount: number | null;
  exportedAt: string | null;
};

function buildCashierShiftReportSearchParams(query?: CashierShiftReportQuery) {
  const params = new URLSearchParams();

  if (!query) return params;

  if (query.status && query.status !== "All") params.set("status", query.status);
  if (query.cashier && query.cashier !== "All") params.set("cashier", query.cashier);
  if (query.dateRange) params.set("dateRange", query.dateRange);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.syncStatus) params.set("syncStatus", query.syncStatus);
  if (query.limit) params.set("limit", String(query.limit));

  return params;
}

function getFilenameFromDisposition(disposition: string | null) {
  if (!disposition) return null;
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? null;
}

export const shiftsApi = {
  getCapabilities() {
    return apiClient.get<ApiDataEnvelope<CashierShiftReportsCapabilitiesDto>>(
      "/api/cashier-shift-reports-capabilities",
    );
  },

  listShifts() {
    return apiClient.get<ApiDataEnvelope<ApiShiftDto[]>>("/api/shifts");
  },

  listReports(query?: CashierShiftReportQuery) {
    const params = buildCashierShiftReportSearchParams(query);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<ApiDataEnvelope<CashierShiftReportDto>>(
      `/api/cashier-shift-reports${suffix}`,
    );
  },

  exportReportsJson(query?: CashierShiftReportQuery) {
    const params = buildCashierShiftReportSearchParams(query);
    params.set("format", "json");
    return apiClient.get<ApiDataEnvelope<CashierShiftReportExportDto>>(
      `/api/cashier-shift-reports/export?${params.toString()}`,
    );
  },

  async downloadReportsCsv(query?: CashierShiftReportQuery): Promise<CashierShiftReportCsvDownload> {
    const params = buildCashierShiftReportSearchParams(query);
    params.set("format", "csv");

    const response = await apiFetch(`/api/cashier-shift-reports/export?${params.toString()}`, {
      credentials: "include",
    });

    if (!response.ok) {
      const body = await readApiEnvelope<Record<string, unknown>>(response, "cashier shift report export");
      throw new Error(body.message ?? "Failed to export cashier shift reports");
    }

    const blob = await response.blob();
    const filename =
      getFilenameFromDisposition(response.headers.get("content-disposition")) ??
      "cashier-shift-reports.csv";
    const rowCountHeader = response.headers.get("x-row-count");

    return {
      blob,
      filename,
      rowCount: rowCountHeader ? Number(rowCountHeader) : null,
      exportedAt: response.headers.get("x-exported-at"),
    };
  },
};
