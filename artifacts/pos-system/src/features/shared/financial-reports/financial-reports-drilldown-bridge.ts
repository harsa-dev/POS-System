import type { CashflowEntryStatus, CashflowEntryType } from "@/lib/api/cashflow-api";
import type { InvoiceBackendStatus } from "@/lib/api/invoice-api";

export const FINANCIAL_REPORT_INVOICE_DRILLDOWN_KEY =
  "financial-reports:invoice-drilldown";
export const FINANCIAL_REPORT_CASHFLOW_DRILLDOWN_KEY =
  "financial-reports:cashflow-drilldown";
export const FINANCIAL_REPORT_INVENTORY_REPAIR_KEY =
  "financial-reports:inventory-cost-snapshot-repair";

export type FinancialReportInvoiceDrilldownPayload = {
  search?: string;
  status?: InvoiceBackendStatus | "ALL";
  overdue?: boolean;
  from?: string;
  to?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  message?: string;
};

export type FinancialReportCashflowDrilldownPayload = {
  type?: CashflowEntryType;
  status?: CashflowEntryStatus;
  search?: string;
  from?: string;
  to?: string;
  message?: string;
};

export type FinancialReportInventoryRepairPayload = {
  from?: string;
  to?: string;
  sourceIssue?: "missing_cost_snapshots";
  message?: string;
};

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function writeSessionPayload(key: string, payload: unknown) {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(key, JSON.stringify(payload));
}

function consumeSessionPayload<TPayload>(key: string): TPayload | null {
  if (!canUseSessionStorage()) return null;

  const raw = window.sessionStorage.getItem(key);
  if (!raw) return null;

  window.sessionStorage.removeItem(key);

  try {
    return JSON.parse(raw) as TPayload;
  } catch {
    return null;
  }
}

export function openInvoiceGeneratorDrilldown(
  payload: FinancialReportInvoiceDrilldownPayload,
) {
  writeSessionPayload(FINANCIAL_REPORT_INVOICE_DRILLDOWN_KEY, payload);
  window.location.assign("/dashboard/invoice-generator#invoice-history-operations");
}

export function consumeInvoiceGeneratorDrilldown() {
  return consumeSessionPayload<FinancialReportInvoiceDrilldownPayload>(
    FINANCIAL_REPORT_INVOICE_DRILLDOWN_KEY,
  );
}

export function openCashflowDrilldown(payload: FinancialReportCashflowDrilldownPayload) {
  writeSessionPayload(FINANCIAL_REPORT_CASHFLOW_DRILLDOWN_KEY, payload);
  window.location.assign("/dashboard/cashflow#financial-report-cashflow-drilldown");
}

export function consumeCashflowDrilldown() {
  return consumeSessionPayload<FinancialReportCashflowDrilldownPayload>(
    FINANCIAL_REPORT_CASHFLOW_DRILLDOWN_KEY,
  );
}

export function openInventoryCostSnapshotRepair(
  payload: FinancialReportInventoryRepairPayload,
) {
  writeSessionPayload(FINANCIAL_REPORT_INVENTORY_REPAIR_KEY, payload);
  window.location.assign("/dashboard/inventory#inventory-cost-snapshot-repair");
}

export function consumeInventoryCostSnapshotRepair() {
  return consumeSessionPayload<FinancialReportInventoryRepairPayload>(
    FINANCIAL_REPORT_INVENTORY_REPAIR_KEY,
  );
}
