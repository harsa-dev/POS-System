import type { FinancialReportBasis } from "@/lib/api/financial-reports-api";

export const FINANCIAL_REPORTS_PERIOD_SYNC_EVENT =
  "financial-reports:period-sync";

const FINANCIAL_REPORTS_PERIOD_STORAGE_KEY =
  "financialReports.activePeriodContext";

export type FinancialReportsPeriodContext = {
  label: string;
  from: string;
  to: string;
  basis: FinancialReportBasis;
};

export function readFinancialReportsPeriodContext() {
  if (typeof window === "undefined") return null;

  const rawValue = window.sessionStorage.getItem(
    FINANCIAL_REPORTS_PERIOD_STORAGE_KEY,
  );

  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as Partial<FinancialReportsPeriodContext>;

    if (!parsed.from || !parsed.to || !parsed.basis) return null;

    return {
      label: parsed.label ?? "Selected Period",
      from: parsed.from,
      to: parsed.to,
      basis: parsed.basis,
    } satisfies FinancialReportsPeriodContext;
  } catch {
    return null;
  }
}

export function writeFinancialReportsPeriodContext(
  context: FinancialReportsPeriodContext,
) {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(
    FINANCIAL_REPORTS_PERIOD_STORAGE_KEY,
    JSON.stringify(context),
  );

  window.dispatchEvent(
    new CustomEvent<FinancialReportsPeriodContext>(
      FINANCIAL_REPORTS_PERIOD_SYNC_EVENT,
      { detail: context },
    ),
  );
}
