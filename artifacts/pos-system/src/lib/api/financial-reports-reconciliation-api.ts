import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";
import {
  buildFinancialReportQueryString,
  type FinancialReportQuery,
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
  openReceivables: FinancialReconciliationDetailRowDto[];
};

type ApiDataEnvelope<T> = ApiEnvelope<T> & { data: T };

export const financialReportsReconciliationApi = {
  getReconciliation(params?: FinancialReportQuery) {
    return apiClient.get<ApiDataEnvelope<FinancialReconciliationDto>>(
      `/api/financial-reports/reconciliation${buildFinancialReportQueryString(
        params,
      )}`,
    );
  },
};
