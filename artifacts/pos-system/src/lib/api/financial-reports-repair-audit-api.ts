import { apiClient, apiFetch, type ApiEnvelope } from "@/lib/api/api-client";
import { readApiEnvelope } from "@/lib/api/read-api-envelope";
import {
  buildFinancialReportQueryString,
  type FinancialReportQuery,
} from "@/lib/api/financial-reports-api";

export type FinancialRepairAuditRowDto = {
  auditId: string;
  businessId: string;
  restaurantId: string | null;
  userId: string | null;
  actorName: string;
  actorEmail: string | null;
  entityType: string;
  movementId: string;
  action: string;
  createdAt: string;
  inventoryItemId: string | null;
  itemName: string;
  unitCostSnapshot: number;
  estimatedCost: number;
  sourceType: string;
  sourceId: string | null;
};

export type FinancialRepairAuditSummaryDto = {
  totalAuditEvents: number;
  repairedMovementCount: number;
  repairedValue: number;
  actorCount: number;
  latestRepairAt: string | null;
};

export type FinancialRepairAuditDto = {
  generatedAt: string;
  period: {
    from: string | null;
    to: string | null;
  };
  limit: number;
  summary: FinancialRepairAuditSummaryDto;
  rows: FinancialRepairAuditRowDto[];
};

export type FinancialRepairAuditExportDto = {
  rows: FinancialRepairAuditRowDto[];
  meta: {
    exportedAt: string;
    rowCount: number;
    limit: number;
    period: {
      from: string | null;
      to: string | null;
    };
  };
};

export type FinancialRepairAuditCsvDownload = {
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

export const financialReportsRepairAuditApi = {
  getAudit(params?: FinancialReportQuery & { limit?: number }) {
    return apiClient.get<ApiEnvelope<FinancialRepairAuditDto>>(
      `/api/financial-reports/repair-audit${buildFinancialReportQueryString(
        params,
        { limit: params?.limit },
      )}`,
    );
  },

  exportJson(params?: FinancialReportQuery) {
    return apiClient.get<ApiEnvelope<FinancialRepairAuditExportDto>>(
      `/api/financial-reports/repair-audit/export${buildFinancialReportQueryString(
        params,
        { format: "json" },
      )}`,
    );
  },

  async downloadCsv(params?: FinancialReportQuery): Promise<FinancialRepairAuditCsvDownload> {
    const response = await apiFetch(
      `/api/financial-reports/repair-audit/export${buildFinancialReportQueryString(
        params,
        { format: "csv" },
      )}`,
      { credentials: "include" },
    );

    if (!response.ok) {
      const body = await readApiEnvelope<Record<string, unknown>>(response, "financial repair audit export");
      throw new Error(body.message ?? "Failed to export financial repair audit");
    }

    const blob = await response.blob();
    const filename =
      getFilenameFromDisposition(response.headers.get("content-disposition")) ??
      "financial-repair-audit.csv";
    const rowCountHeader = response.headers.get("x-row-count");

    return {
      blob,
      filename,
      rowCount: rowCountHeader ? Number(rowCountHeader) : null,
      exportedAt: response.headers.get("x-exported-at"),
    };
  },
};
