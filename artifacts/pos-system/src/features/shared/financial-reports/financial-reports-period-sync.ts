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

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getFinancialReportsPeriodOptions(now = new Date()) {
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const quarterStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  return [
    {
      label: "This Month",
      from: toDateInputValue(thisMonthStart),
      to: toDateInputValue(now),
    },
    {
      label: "Last Month",
      from: toDateInputValue(lastMonthStart),
      to: toDateInputValue(lastMonthEnd),
    },
    {
      label: "Last 3 Months",
      from: toDateInputValue(quarterStart),
      to: toDateInputValue(now),
    },
    {
      label: "Year To Date",
      from: toDateInputValue(yearStart),
      to: toDateInputValue(now),
    },
  ];
}

export function resolveFinancialReportsPeriodContext({
  label,
  basis,
}: {
  label?: string | null;
  basis?: FinancialReportBasis | null;
}): FinancialReportsPeriodContext {
  const options = getFinancialReportsPeriodOptions();
  const selected = options.find((option) => option.label === label) ?? options[0]!;

  return {
    label: selected.label,
    from: selected.from,
    to: selected.to,
    basis: basis ?? "hybrid",
  };
}

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
