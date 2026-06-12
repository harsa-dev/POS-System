import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";
import type { FinancialReportDto, FinancialReportQuery } from "./financial-reports-api";

export type FinancialReportExportFormat = "json" | "csv";

export type FinancialReportExportFileDto = {
  exportedAt: string;
  format: FinancialReportExportFormat;
  filename: string;
  contentType: string;
  report?: FinancialReportDto;
  content?: string;
};

type ApiDataEnvelope<T> = ApiEnvelope<T> & { data: T };

function buildQuery(params: FinancialReportQuery & { format: FinancialReportExportFormat }) {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);
  if (params.basis) searchParams.set("basis", params.basis);
  searchParams.set("format", params.format);

  return `?${searchParams.toString()}`;
}

export const financialReportExportApi = {
  exportReport(params: FinancialReportQuery & { format: FinancialReportExportFormat }) {
    return apiClient.get<ApiDataEnvelope<FinancialReportExportFileDto>>(
      `/api/financial-reports/export${buildQuery(params)}`,
    );
  },
};
