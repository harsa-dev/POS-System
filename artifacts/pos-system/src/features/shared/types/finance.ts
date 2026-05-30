export type BusinessScope = "Per Business" | "Combined Business" | "Branch Based";

export type CashflowPeriod = "This Month" | "Last Month" | "Lifetime";

export type SourceAccount = "All" | "Cash" | "Bank" | "QRIS";

export type CashflowType = "Income" | "Expense";

export type CashflowViewMode = "Customers" | "Suppliers" | "Combined";

export type CashflowTransaction = {
  id: string;
  date: string;
  sourceAccount: Exclude<SourceAccount, "All">;
  type: CashflowType;
  category: string;
  sourceName: string;
  description: string;
  amount: number;
  status: "Completed" | "Pending";
};

export type CashflowSourceSummary = {
  name: string;
  amount: number;
  percentage: number;
};

export type FinancialDataSource = "Recap + Cashflow" | "Cashflow Only" | "Recap Only";

export type FinancialSourceInput = {
  label: "Recap Source" | "Cashflow Source" | "Warehouse Source";
  value: string;
};

export type ProfitLossLine = {
  label: string;
  amount: number;
  tone?: "default" | "positive" | "negative" | "total";
};

export type FinancialTrendPoint = {
  label: string;
  revenue: number;
  netProfit: number;
};
