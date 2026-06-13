import {
  formatRetailCurrency,
  getRetailProductMarginPercent,
  getRetailTransactionTotal,
  retailProducts,
  retailPromotions,
  retailReceivings,
  retailRegisterSummary,
  retailStockCountSessions,
  retailSuppliers,
  retailTransactions,
} from "./retail.mock-data";
import {
  retailDailyReport,
  retailInventoryRiskReport,
  retailManagerReviewQueue,
} from "./retail.mock-operations";
import {
  retailCommandActions,
  retailPlanningSignals,
} from "./retail.command-center-mock-data";
import { retailGrowthModules } from "./retail.growth-mock-data";
import { retailReadinessScore } from "./retail.mock-quality";

export type RetailSharedDashboardId =
  | "overview"
  | "sales"
  | "customers"
  | "inventory"
  | "cashflow"
  | "financial-reports"
  | "invoice-generator"
  | "shift-reports"
  | "team-management"
  | "employee-performance"
  | "approvals";

export type RetailSharedMetric = Readonly<{
  label: string;
  value: string;
  helper: string;
}>;

export type RetailSharedRow = Readonly<{
  title: string;
  primary: string;
  secondary: string;
  status: "healthy" | "review" | "blocked" | "planned";
}>;

export type RetailSharedDashboardContext = Readonly<{
  id: RetailSharedDashboardId;
  title: string;
  description: string;
  metrics: readonly RetailSharedMetric[];
  rows: readonly RetailSharedRow[];
  bridgeNote: string;
}>;

const paidTransactions = retailTransactions.filter((transaction) => transaction.status === "paid");
const revenue = retailDailyReport.revenue;
const grossProfit = retailDailyReport.grossProfit;
const margin = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0;
const stockAlerts = retailProducts.filter((product) => product.stock <= product.reorderPoint);
const pendingReceivings = retailReceivings.filter((receiving) => receiving.status !== "received");
const varianceSessions = retailStockCountSessions.filter((session) => session.status !== "completed");
const customersModule = retailGrowthModules.find((module) => module.id === "customers-loyalty");
const returnsModule = retailGrowthModules.find((module) => module.id === "returns-exchanges");
const staffModule = retailGrowthModules.find((module) => module.id === "staff-shifts");

function fallbackRows(label: string): readonly RetailSharedRow[] {
  return [
    {
      title: `${label} bridge ready`,
      primary: "Retail core mock data is available for this shared dashboard.",
      secondary: "API and Prisma schema are still intentionally untouched.",
      status: "planned",
    },
  ];
}

function getSalesRows(): readonly RetailSharedRow[] {
  return paidTransactions.map((transaction) => ({
    title: transaction.receiptNumber,
    primary: `${transaction.cashierName} · ${transaction.paymentMethod} · ${formatRetailCurrency(getRetailTransactionTotal(transaction))}`,
    secondary: `${transaction.items.length} cart lines · ${new Date(transaction.createdAt).toLocaleString("id-ID")}`,
    status: "healthy" as const,
  }));
}

function getInventoryRows(): readonly RetailSharedRow[] {
  return stockAlerts.map((product) => ({
    title: product.name,
    primary: `${product.sku} · stock ${product.stock}/${product.reorderPoint}`,
    secondary: `${product.shelfLocation} · suggested reorder from retail core risk report`,
    status: product.stock === 0 ? "blocked" : "review",
  }));
}

function getCashflowRows(): readonly RetailSharedRow[] {
  return [
    {
      title: retailRegisterSummary.shiftCode,
      primary: `Expected ${formatRetailCurrency(retailRegisterSummary.expectedCash)} · counted ${formatRetailCurrency(retailRegisterSummary.cashDrawer)}`,
      secondary: `Register ${retailRegisterSummary.registerCode} · cashier ${retailRegisterSummary.cashierName}`,
      status: retailDailyReport.registerVariance === 0 ? "healthy" : "review",
    },
    ...pendingReceivings.map((receiving) => ({
      title: receiving.referenceNumber,
      primary: `Supplier cost ${formatRetailCurrency(receiving.totalCost)}`,
      secondary: `${receiving.status} · expected ${receiving.expectedDate}`,
      status: "review" as const,
    })),
  ];
}

function getSupplierRows(): readonly RetailSharedRow[] {
  return retailSuppliers.map((supplier) => ({
    title: supplier.name,
    primary: `${supplier.contactPerson} · lead time ${supplier.leadTimeDays} days`,
    secondary: `Reliability ${supplier.reliabilityScore}/100 · ${supplier.phone}`,
    status: supplier.reliabilityScore >= 90 ? "healthy" : "review",
  }));
}

function getProductMarginRows(): readonly RetailSharedRow[] {
  return retailProducts.map((product) => ({
    title: product.name,
    primary: `${product.sku} · price ${formatRetailCurrency(product.price)} · cost ${formatRetailCurrency(product.cost)}`,
    secondary: `Margin ${getRetailProductMarginPercent(product)}% · tax ${product.taxRatePercent}% · ${product.category}`,
    status: product.stock <= product.reorderPoint ? "review" : "healthy",
  }));
}

function getApprovalRows(): readonly RetailSharedRow[] {
  return retailManagerReviewQueue.map((item) => ({
    title: item.title,
    primary: item.description,
    secondary: item.action,
    status: item.severity === "critical" ? "blocked" : item.severity === "warning" ? "review" : "healthy",
  }));
}

const contexts: Record<RetailSharedDashboardId, RetailSharedDashboardContext> = {
  overview: {
    id: "overview",
    title: "Retail overview bridge",
    description: "Retail mode injects sales, stock, register, promo, and readiness signals into the shared overview dashboard.",
    metrics: [
      { label: "Retail revenue", value: formatRetailCurrency(revenue), helper: "From retail mock transactions" },
      { label: "Readiness", value: `${retailReadinessScore.score}/100`, helper: `${retailReadinessScore.grade} grade mock control score` },
      { label: "Action queue", value: String(retailCommandActions.length), helper: "Owner decisions from command center" },
    ],
    rows: retailPlanningSignals.map((signal) => ({
      title: signal.area,
      primary: signal.signal,
      secondary: `${signal.recommendation} · ${signal.estimatedImpact}`,
      status: signal.area === "Inventory" || signal.area === "Branch control" ? "review" : "planned",
    })),
    bridgeNote: "Use this as the retail executive context above the existing shared overview.",
  },
  sales: {
    id: "sales",
    title: "Retail sales bridge",
    description: "Retail cashier transactions are mapped into the shared sales analytics surface with revenue, margin, discount, and basket context.",
    metrics: [
      { label: "Revenue", value: formatRetailCurrency(revenue), helper: `${paidTransactions.length} paid mock transactions` },
      { label: "Gross profit", value: formatRetailCurrency(grossProfit), helper: `${margin}% margin preview` },
      { label: "Average basket", value: formatRetailCurrency(retailDailyReport.averageBasket), helper: "Mock basket average" },
    ],
    rows: getSalesRows(),
    bridgeNote: "Real shared analytics API remains untouched; this panel only proves retail core data can feed the shared concept.",
  },
  customers: {
    id: "customers",
    title: "Retail customers bridge",
    description: "Customer and loyalty mock data is surfaced beside the shared customers and partners dashboard.",
    metrics: customersModule?.metrics ?? [],
    rows: customersModule?.rows ?? fallbackRows("Customers"),
    bridgeNote: "This keeps loyalty as retail-specific mock context before customer tables exist.",
  },
  inventory: {
    id: "inventory",
    title: "Retail inventory bridge",
    description: "Retail products, reorder points, shelf locations, receiving, and stock count sessions are mapped into the shared inventory view.",
    metrics: [
      { label: "Active SKU", value: String(retailProducts.length), helper: "Retail mock catalog" },
      { label: "Stock alerts", value: String(stockAlerts.length), helper: "Below reorder point or empty" },
      { label: "Risk value", value: formatRetailCurrency(retailInventoryRiskReport.reduce((total, item) => total + item.estimatedRestockCost, 0)), helper: "Estimated restock cost" },
    ],
    rows: getInventoryRows(),
    bridgeNote: "Inventory dashboard now has a retail-specific SKU, shelf, and reorder context without schema work.",
  },
  cashflow: {
    id: "cashflow",
    title: "Retail cashflow bridge",
    description: "Retail register, payment, receiving cost, and refund planning signals are exposed to the shared cashflow dashboard.",
    metrics: [
      { label: "Cash variance", value: formatRetailCurrency(retailDailyReport.registerVariance), helper: "Expected cash vs drawer" },
      { label: "Discount total", value: formatRetailCurrency(retailDailyReport.discountTotal), helper: "Retail transaction discount" },
      { label: "Pending PO", value: String(pendingReceivings.length), helper: "Receiving cost still open" },
    ],
    rows: getCashflowRows(),
    bridgeNote: "Cashflow still uses mock values, but the retail register and PO cost concepts are now visible.",
  },
  "financial-reports": {
    id: "financial-reports",
    title: "Retail financial report bridge",
    description: "Retail sales, COGS preview, tax-included amount, and stock risk value are wired into the financial reporting context.",
    metrics: [
      { label: "Net sales", value: formatRetailCurrency(revenue), helper: "After retail discounts" },
      { label: "Tax included", value: formatRetailCurrency(retailDailyReport.taxIncluded), helper: "Included tax preview" },
      { label: "Gross margin", value: `${margin}%`, helper: "Mock price minus cost" },
    ],
    rows: getProductMarginRows(),
    bridgeNote: "Financial reports can now preview retail margin shape before accounting export exists.",
  },
  "invoice-generator": {
    id: "invoice-generator",
    title: "Retail invoice bridge",
    description: "Retail supplier purchases and customer receipts are mapped as invoice-ready mock rows for the shared invoice generator.",
    metrics: [
      { label: "Supplier PO", value: String(retailReceivings.length), helper: "Purchase references available" },
      { label: "Receipts", value: String(retailTransactions.length), helper: "Customer receipt references" },
      { label: "Open receiving", value: String(pendingReceivings.length), helper: "Not ready for final supplier invoice" },
    ],
    rows: [...getSupplierRows(), ...getSalesRows().slice(0, 2)],
    bridgeNote: "This prepares retail invoice surfaces without creating real invoice records.",
  },
  "shift-reports": {
    id: "shift-reports",
    title: "Retail shift report bridge",
    description: "Retail register summary and cashier transaction rows are mapped into the shared cashier shift reporting concept.",
    metrics: staffModule?.metrics ?? [],
    rows: staffModule?.rows ?? fallbackRows("Shift reports"),
    bridgeNote: "Retail shift context is separated from restaurant staff flow but visible in the shared dashboard.",
  },
  "team-management": {
    id: "team-management",
    title: "Retail team bridge",
    description: "Retail staff mock shifts, register responsibility, and shelf tasks are shown beside the shared team management dashboard.",
    metrics: staffModule?.metrics ?? [],
    rows: staffModule?.rows ?? fallbackRows("Team management"),
    bridgeNote: "This is retail accountability context only; no HR schema was changed.",
  },
  "employee-performance": {
    id: "employee-performance",
    title: "Retail employee performance bridge",
    description: "Retail cashier sales, register variance, and shelf task signals are available for shared employee performance review.",
    metrics: [
      { label: "Cashier", value: retailRegisterSummary.cashierName, helper: retailRegisterSummary.shiftCode },
      { label: "Transactions", value: String(paidTransactions.length), helper: "Paid retail receipts" },
      { label: "Variance checks", value: String(varianceSessions.length), helper: "Stock count sessions needing attention" },
    ],
    rows: staffModule?.rows ?? fallbackRows("Employee performance"),
    bridgeNote: "Performance remains mock-only and should not become payroll logic yet.",
  },
  approvals: {
    id: "approvals",
    title: "Retail approval bridge",
    description: "Retail manager queue, return review, stock variance, and price control signals are surfaced in shared approvals.",
    metrics: [
      { label: "Manager queue", value: String(retailManagerReviewQueue.length), helper: "Mock retail review cards" },
      { label: "Returns", value: returnsModule?.metrics[0]?.value ?? "0", helper: "Pending return review" },
      { label: "Command actions", value: String(retailCommandActions.length), helper: "Owner action queue" },
    ],
    rows: getApprovalRows(),
    bridgeNote: "Approvals are visible only as mock review context; no mutation or audit write exists yet.",
  },
};

export function getRetailSharedDashboardContext(id: RetailSharedDashboardId) {
  return contexts[id];
}

export const retailSharedDashboardIds = Object.keys(contexts) as RetailSharedDashboardId[];
