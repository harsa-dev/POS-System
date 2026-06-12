import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";
import type {
  FinancialReportDto,
  FinancialReportQuery,
} from "@/lib/api/financial-reports-api";

export type FinancialReportExportFormat = "json" | "csv";

export type FinancialReportExportFileDto = {
  exportedAt: string;
  format: FinancialReportExportFormat;
  filename: string;
  contentType: string;
  auditLogged: boolean;
  report?: FinancialReportDto;
  content?: string;
};

type ApiDataEnvelope<T> = ApiEnvelope<T> & { data: T };

function buildExportQuery(
  params?: FinancialReportQuery & { format?: FinancialReportExportFormat },
) {
  if (!params) return "";

  const searchParams = new URLSearchParams();

  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);
  if (params.basis) searchParams.set("basis", params.basis);
  if (params.format) searchParams.set("format", params.format);

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const financialReportExportApi = {
  exportReport(
    params?: FinancialReportQuery & { format?: FinancialReportExportFormat },
  ) {
    return apiClient.get<ApiDataEnvelope<FinancialReportExportFileDto>>(
      `/api/financial-reports/export${buildExportQuery(params)}`,
    );
  },
};
