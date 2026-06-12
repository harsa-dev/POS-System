import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";
import {
  buildFinancialReportQueryString,
  type FinancialReportDto,
  type FinancialReportQuery,
} from "@/lib/api/financial-reports-api";

export type FinancialReportExportFormat = "json" | "csv";

export type FinancialReportExportQuery = FinancialReportQuery & {
  format?: FinancialReportExportFormat;
};

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

export const financialReportExportApi = {
  exportReport(params?: FinancialReportExportQuery) {
    return apiClient.get<ApiDataEnvelope<FinancialReportExportFileDto>>(
      `/api/financial-reports/export${buildFinancialReportQueryString(params, {
        format: params?.format,
      })}`,
    );
  },
};