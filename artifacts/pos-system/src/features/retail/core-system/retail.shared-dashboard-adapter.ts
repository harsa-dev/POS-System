import {
  formatRetailCurrency,
  getRetailProductMarginPercent,
  getRetailTransactionTotal,
  retailProducts,
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
  | "approvals"
  | "audit-controls"
  | "roster-overview"
  | "employee-attendance"
  | "employee-contracts"
  | "payroll";

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
const auditModule = retailGrowthModules.find((module) => module.id === "audit-controls");

function fallbackRows(label: string): readonly RetailSharedRow[] {
  return [
    {
      title: `${label} retail mode placeholder`,
      primary: "Retail core mock data is available, but this shared dashboard is not the active retail surface.",
      secondary: "The original shared component is intentionally not rendered in retail mode.",
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

function getSkippedRows(label: string, replacement: string): readonly RetailSharedRow[] {
  return [
    {
      title: `${label} is not called in retail mode`,
      primary: `Retail mode uses ${replacement} instead of the generic shared dashboard component.`,
      secondary: "The original dashboard remains available for other business modes.",
      status: "planned",
    },
  ];
}

const staffMetrics = staffModule?.metrics ?? [
  { label: "Retail staff", value: "Mock", helper: "Retail staff shift context" },
];

const contexts: Record<RetailSharedDashboardId, RetailSharedDashboardContext> = {
  overview: {
    id: "overview",
    title: "Retail overview",
    description: "Retail mode replaces the generic overview with cashier, inventory, customer, promo, and readiness signals.",
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
    bridgeNote: "Generic business overview is not rendered for retail mode; this retail-specific summary is used instead.",
  },
  sales: {
    id: "sales",
    title: "Retail sales analytics",
    description: "Retail cashier transactions are mapped into a retail-specific sales view with revenue, margin, discount, and basket context.",
    metrics: [
      { label: "Revenue", value: formatRetailCurrency(revenue), helper: `${paidTransactions.length} paid mock transactions` },
      { label: "Gross profit", value: formatRetailCurrency(grossProfit), helper: `${margin}% margin preview` },
      { label: "Average basket", value: formatRetailCurrency(retailDailyReport.averageBasket), helper: "Mock basket average" },
    ],
    rows: getSalesRows(),
    bridgeNote: "Shared sales dashboard is replaced in retail mode so restaurant/service charts are not called.",
  },
  customers: {
    id: "customers",
    title: "Retail customers and loyalty",
    description: "Retail mode uses customer loyalty, repeat purchase, member points, and return history instead of the generic customer-partner surface.",
    metrics: customersModule?.metrics ?? [],
    rows: customersModule?.rows ?? fallbackRows("Customers"),
    bridgeNote: "Generic partner management is not rendered; retail loyalty context is shown instead.",
  },
  inventory: {
    id: "inventory",
    title: "Retail inventory control",
    description: "Retail mode uses SKU, barcode, reorder point, shelf, receiving, and stock count context instead of the generic inventory dashboard.",
    metrics: [
      { label: "Active SKU", value: String(retailProducts.length), helper: "Retail mock catalog" },
      { label: "Stock alerts", value: String(stockAlerts.length), helper: "Below reorder point or empty" },
      { label: "Risk value", value: formatRetailCurrency(retailInventoryRiskReport.reduce((total, item) => total + item.estimatedRestockCost, 0)), helper: "Estimated restock cost" },
    ],
    rows: getInventoryRows(),
    bridgeNote: "Retail inventory replaces the shared inventory dashboard to avoid non-retail material/recipe logic.",
  },
  cashflow: {
    id: "cashflow",
    title: "Retail cashflow and register control",
    description: "Retail mode keeps cashflow, but focuses it on register variance, payments, receiving cost, and refund exposure.",
    metrics: [
      { label: "Cash variance", value: formatRetailCurrency(retailDailyReport.registerVariance), helper: "Expected cash vs drawer" },
      { label: "Discount total", value: formatRetailCurrency(retailDailyReport.discountTotal), helper: "Retail transaction discount" },
      { label: "Pending PO", value: String(pendingReceivings.length), helper: "Receiving cost still open" },
    ],
    rows: getCashflowRows(),
    bridgeNote: "Cashflow is relevant for retail, but the original shared component is replaced by retail register context.",
  },
  "financial-reports": {
    id: "financial-reports",
    title: "Retail financial reports",
    description: "Retail mode financial reporting focuses on net sales, COGS preview, tax included, margin, and stock risk value.",
    metrics: [
      { label: "Net sales", value: formatRetailCurrency(revenue), helper: "After retail discounts" },
      { label: "Tax included", value: formatRetailCurrency(retailDailyReport.taxIncluded), helper: "Included tax preview" },
      { label: "Gross margin", value: `${margin}%`, helper: "Mock price minus cost" },
    ],
    rows: getProductMarginRows(),
    bridgeNote: "Generic financial reports are replaced with retail margin and stock-risk context.",
  },
  "invoice-generator": {
    id: "invoice-generator",
    title: "Retail receipts and supplier billing",
    description: "Retail mode does not call the full generic invoice generator. It uses receipt preview and supplier PO billing readiness instead.",
    metrics: [
      { label: "Supplier PO", value: String(retailReceivings.length), helper: "Purchase references available" },
      { label: "Receipts", value: String(retailTransactions.length), helper: "Customer receipt references" },
      { label: "Open receiving", value: String(pendingReceivings.length), helper: "Not ready for final supplier invoice" },
    ],
    rows: [...getSupplierRows(), ...getSalesRows().slice(0, 2)],
    bridgeNote: "The shared invoice generator is not rendered for retail mode; retail uses receipts and supplier billing mock context.",
  },
  "shift-reports": {
    id: "shift-reports",
    title: "Retail shift reports",
    description: "Retail mode uses register closing, cashier responsibility, transaction count, variance, and shelf tasks.",
    metrics: staffMetrics,
    rows: staffModule?.rows ?? fallbackRows("Shift reports"),
    bridgeNote: "Restaurant shift reports are not rendered; retail cashier shift context replaces them.",
  },
  "team-management": {
    id: "team-management",
    title: "Retail staff and task board",
    description: "Retail mode keeps only lightweight staff responsibility: register owner, shelf task, receiving task, and manager review.",
    metrics: staffMetrics,
    rows: staffModule?.rows ?? fallbackRows("Team management"),
    bridgeNote: "The full HR team-management component is not called in retail mode.",
  },
  "employee-performance": {
    id: "employee-performance",
    title: "Retail cashier performance",
    description: "Retail mode uses cashier sales, register variance, void/refund review, and stock-count accountability instead of full employee KPI review.",
    metrics: [
      { label: "Cashier", value: retailRegisterSummary.cashierName, helper: retailRegisterSummary.shiftCode },
      { label: "Transactions", value: String(paidTransactions.length), helper: "Paid retail receipts" },
      { label: "Variance checks", value: String(varianceSessions.length), helper: "Stock count sessions needing attention" },
    ],
    rows: staffModule?.rows ?? fallbackRows("Employee performance"),
    bridgeNote: "Full workforce performance is not rendered; retail cashier performance context replaces it.",
  },
  approvals: {
    id: "approvals",
    title: "Retail approvals",
    description: "Retail mode approval is limited to returns, stock variance, price/promo control, and command-center action review.",
    metrics: [
      { label: "Manager queue", value: String(retailManagerReviewQueue.length), helper: "Mock retail review cards" },
      { label: "Returns", value: returnsModule?.metrics[0]?.value ?? "0", helper: "Pending return review" },
      { label: "Command actions", value: String(retailCommandActions.length), helper: "Owner action queue" },
    ],
    rows: getApprovalRows(),
    bridgeNote: "Shared approvals are replaced by retail manager review context.",
  },
  "audit-controls": {
    id: "audit-controls",
    title: "Retail control review",
    description: "Retail mode uses control review for voids, returns, stock variance, promo margin, and cash variance instead of generic audit log rendering.",
    metrics: auditModule?.metrics ?? [
      { label: "Control queue", value: String(retailCommandActions.length), helper: "Retail command actions" },
    ],
    rows: auditModule?.rows ?? getApprovalRows(),
    bridgeNote: "Generic audit log is not called in retail mode; retail control review is shown instead.",
  },
  "roster-overview": {
    id: "roster-overview",
    title: "Retail shift coverage",
    description: "Retail mode does not need the generic roster planner yet. It uses cashier/register shift coverage from the retail staff module.",
    metrics: staffMetrics,
    rows: staffModule?.rows ?? fallbackRows("Roster overview"),
    bridgeNote: "Shared roster overview is replaced by retail shift coverage mock data.",
  },
  "employee-attendance": {
    id: "employee-attendance",
    title: "Attendance skipped for retail mode",
    description: "Retail mode currently tracks register shift ownership only. Full attendance tracking is not part of the retail mock scope yet.",
    metrics: staffMetrics,
    rows: getSkippedRows("Employee attendance", "Retail Staff & Shifts"),
    bridgeNote: "The original attendance dashboard is intentionally not rendered in retail mode.",
  },
  "employee-contracts": {
    id: "employee-contracts",
    title: "Contracts skipped for retail mode",
    description: "Retail mode does not need contract lifecycle management in the current mock foundation.",
    metrics: staffMetrics,
    rows: getSkippedRows("Employee contracts", "Retail Staff & Shifts"),
    bridgeNote: "The original contracts dashboard remains available for other modes, but is not called for retail.",
  },
  payroll: {
    id: "payroll",
    title: "Payroll skipped for retail mode",
    description: "Retail mode does not need payroll preview in the current mock foundation. Register variance and shift closing are enough for now.",
    metrics: staffMetrics,
    rows: getSkippedRows("Payroll", "Retail Shift Reports"),
    bridgeNote: "The payroll dashboard is intentionally not rendered for retail mode.",
  },
};

export function getRetailSharedDashboardContext(id: RetailSharedDashboardId) {
  return contexts[id];
}

export const retailSharedDashboardIds = Object.keys(contexts) as RetailSharedDashboardId[];
