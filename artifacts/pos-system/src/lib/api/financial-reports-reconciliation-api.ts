import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";
import type {
  FinancialReportBasis,
  FinancialReportQuery,
} from "@/lib/api/financial-reports-api";

export type FinancialReconciliationIssueSeverity =
  | "info"
  | "warning"
  | "critical";

export type FinancialReconciliationIssueDto = {
  key: string;
  title: string;
  description: string;
  severity: FinancialReconciliationIssueSeverity;
  count: number;
};

export type FinancialReconciliationDetailRowDto = {
  id: string;
  date: string;
  sourceType: string;
  reference: string;
  description: string;
  amount: number;
  status: string;
};

export type FinancialReconciliationDto = {
  generatedAt: string;
  period: {
    from: string;
    to: string;
  };
  issues: FinancialReconciliationIssueDto[];
  unsyncedOrders: FinancialReconciliationDetailRowDto[];
  missingCostSnapshots: FinancialReconciliationDetailRowDto[];
  pendingCashflowEntries: FinancialReconciliationDetailRowDto[];
  voidedCashflowEntries: FinancialReconciliationDetailRowDto[];
};

type ApiDataEnvelope<T> = ApiEnvelope<T> & { data: T };

function buildQuery(params?: FinancialReportQuery & { basis?: FinancialReportBasis }) {
  if (!params) return "";

  const searchParams = new URLSearchParams();

  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);
  if (params.basis) searchParams.set("basis", params.basis);

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const financialReportsReconciliationApi = {
  getReconciliation(params?: FinancialReportQuery) {
    return apiClient.get<ApiDataEnvelope<FinancialReconciliationDto>>(
      `/api/financial-reports/reconciliation${buildQuery(params)}`,
    );
  },
};