import {
  formatRetailCurrency,
  getRetailProductById,
  getRetailTransactionTotal,
  retailProducts,
  retailPromotions,
  retailReceivings,
  retailRegisterSummary,
  retailShelfSlots,
  retailStockCountSessions,
  retailTransactions,
} from "./retail.mock-data";
import type { RetailProduct, RetailTransaction } from "./retail.types";

export type RetailOperationSeverity = "good" | "info" | "warning" | "critical";

export type RetailOperationInsight = Readonly<{
  id: string;
  title: string;
  value: string;
  description: string;
  severity: RetailOperationSeverity;
  action: string;
}>;

export type RetailInventoryRisk = Readonly<{
  productId: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  reorderPoint: number;
  recommendedOrderQuantity: number;
  estimatedRestockCost: number;
  severity: RetailOperationSeverity;
  reason: string;
}>;

export type RetailActivityEvent = Readonly<{
  id: string;
  title: string;
  description: string;
  timestamp: string;
  severity: RetailOperationSeverity;
}>;

export type RetailReceiptLinePreview = Readonly<{
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal: number;
}>;

export type RetailReceiptPreview = Readonly<{
  receiptNumber: string;
  cashierName: string;
  paymentMethod: string;
  subtotal: number;
  discountTotal: number;
  taxIncluded: number;
  payable: number;
  profitPreview: number;
  lines: readonly RetailReceiptLinePreview[];
}>;

function getLineFinancials(product: RetailProduct, quantity: number, discountPercent: number) {
  const gross = product.price * quantity;
  const discount = gross * (discountPercent / 100);
  const lineTotal = gross - discount;
  const taxIncluded = lineTotal * (product.taxRatePercent / (100 + product.taxRatePercent));
  const profit = (product.price - product.cost) * quantity - discount;

  return { gross, discount, lineTotal, taxIncluded, profit };
}

function getTransactionProfit(transaction: RetailTransaction) {
  return transaction.items.reduce((total, item) => {
    const product = getRetailProductById(item.productId);
    return product ? total + getLineFinancials(product, item.quantity, item.discountPercent).profit : total;
  }, 0);
}

function getTransactionDiscount(transaction: RetailTransaction) {
  return transaction.items.reduce((total, item) => {
    const product = getRetailProductById(item.productId);
    return product ? total + getLineFinancials(product, item.quantity, item.discountPercent).discount : total;
  }, 0);
}

function getTransactionTax(transaction: RetailTransaction) {
  return transaction.items.reduce((total, item) => {
    const product = getRetailProductById(item.productId);
    return product ? total + getLineFinancials(product, item.quantity, item.discountPercent).taxIncluded : total;
  }, 0);
}

function getTransactionItemCount(transaction: RetailTransaction) {
  return transaction.items.reduce((total, item) => total + item.quantity, 0);
}

function getReceiptLines(transaction: RetailTransaction): readonly RetailReceiptLinePreview[] {
  return transaction.items.flatMap((item) => {
    const product = getRetailProductById(item.productId);
    if (!product) return [];
    const financials = getLineFinancials(product, item.quantity, item.discountPercent);

    return [{
      productName: product.name,
      sku: product.sku,
      quantity: item.quantity,
      unitPrice: product.price,
      discountPercent: item.discountPercent,
      lineTotal: financials.lineTotal,
    }];
  });
}

const paidTransactions = retailTransactions.filter((transaction) => transaction.status === "paid");
const revenue = paidTransactions.reduce((total, transaction) => total + getRetailTransactionTotal(transaction), 0);
const discountTotal = paidTransactions.reduce((total, transaction) => total + getTransactionDiscount(transaction), 0);
const taxIncluded = paidTransactions.reduce((total, transaction) => total + getTransactionTax(transaction), 0);
const grossProfit = paidTransactions.reduce((total, transaction) => total + getTransactionProfit(transaction), 0);
const itemSoldCount = paidTransactions.reduce((total, transaction) => total + getTransactionItemCount(transaction), 0);
const pendingReceivingCount = retailReceivings.filter((receiving) => receiving.status !== "received").length;
const activePromotionCount = retailPromotions.filter((promotion) => promotion.isActive).length;
const registerVariance = retailRegisterSummary.cashDrawer - retailRegisterSummary.expectedCash;

export const retailDailyReport = {
  businessDate: "2026-06-13",
  paidTransactionCount: paidTransactions.length,
  itemSoldCount,
  revenue,
  discountTotal,
  taxIncluded,
  grossProfit,
  averageBasket: paidTransactions.length > 0 ? Math.round(revenue / paidTransactions.length) : 0,
  registerVariance,
  stockAlertCount: retailProducts.filter((product) => product.stock <= product.reorderPoint).length,
  pendingReceivingCount,
  activePromotionCount,
} as const;

export const retailInventoryRiskReport: readonly RetailInventoryRisk[] = retailProducts
  .filter((product) => product.stock <= product.reorderPoint)
  .map((product) => {
    const recommendedOrderQuantity = Math.max(product.reorderPoint * 2 - product.stock, product.reorderPoint);
    const severity: RetailOperationSeverity = product.stock === 0 ? "critical" : "warning";

    return {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      currentStock: product.stock,
      reorderPoint: product.reorderPoint,
      recommendedOrderQuantity,
      estimatedRestockCost: recommendedOrderQuantity * product.cost,
      severity,
      reason: product.stock === 0 ? "No stock available in the mock catalog." : "Stock is below reorder point.",
    };
  });

const latestTransaction = retailTransactions[0];
const receiptLines = latestTransaction ? getReceiptLines(latestTransaction) : [];
const receiptSubtotal = receiptLines.reduce((total, line) => total + line.unitPrice * line.quantity, 0);
const receiptDiscount = receiptLines.reduce((total, line) => total + line.unitPrice * line.quantity * (line.discountPercent / 100), 0);

export const retailReceiptPreview: RetailReceiptPreview = {
  receiptNumber: latestTransaction?.receiptNumber ?? "RTL-DRAFT-0000",
  cashierName: latestTransaction?.cashierName ?? retailRegisterSummary.cashierName,
  paymentMethod: latestTransaction?.paymentMethod ?? "QRIS",
  subtotal: receiptSubtotal,
  discountTotal: receiptDiscount,
  taxIncluded: latestTransaction ? getTransactionTax(latestTransaction) : 0,
  payable: receiptSubtotal - receiptDiscount,
  profitPreview: latestTransaction ? getTransactionProfit(latestTransaction) : 0,
  lines: receiptLines,
};

export const retailOperationInsights: readonly RetailOperationInsight[] = [
  {
    id: "sales-health",
    title: "Sales health",
    value: formatRetailCurrency(retailDailyReport.revenue),
    description: `${retailDailyReport.paidTransactionCount} paid mock transactions with ${retailDailyReport.itemSoldCount} items sold.`,
    severity: "good",
    action: "Keep cashier flow stable before creating sale mutation.",
  },
  {
    id: "gross-profit",
    title: "Gross profit preview",
    value: formatRetailCurrency(retailDailyReport.grossProfit),
    description: "Calculated from product price, product cost, quantity, and discount percent.",
    severity: retailDailyReport.grossProfit > 0 ? "good" : "warning",
    action: "Product cost must stay separate from selling price later.",
  },
  {
    id: "inventory-risk",
    title: "Inventory risk",
    value: String(retailDailyReport.stockAlertCount),
    description: "Products are at reorder point or fully empty.",
    severity: retailDailyReport.stockAlertCount > 0 ? "warning" : "good",
    action: "Prepare purchase recommendation UI before stock movement API exists.",
  },
  {
    id: "cash-variance",
    title: "Cash variance",
    value: formatRetailCurrency(retailDailyReport.registerVariance),
    description: "Cash drawer is compared against expected cash in the mock register summary.",
    severity: Math.abs(retailDailyReport.registerVariance) > 0 ? "warning" : "good",
    action: "Later this should require manager approval and audit log entry.",
  },
];

export const retailActivityTimeline: readonly RetailActivityEvent[] = [
  ...retailTransactions.map((transaction) => ({
    id: `activity-${transaction.id}`,
    title: `${transaction.receiptNumber} paid via ${transaction.paymentMethod}`,
    description: `${transaction.cashierName} processed ${transaction.items.length} cart lines worth ${formatRetailCurrency(getRetailTransactionTotal(transaction))}.`,
    timestamp: transaction.createdAt,
    severity: "good" as const,
  })),
  ...retailReceivings.map((receiving) => ({
    id: `activity-${receiving.id}`,
    title: `${receiving.referenceNumber} ${receiving.status}`,
    description: `${receiving.itemCount} receiving lines with total mock cost ${formatRetailCurrency(receiving.totalCost)}.`,
    timestamp: receiving.receivedDate ? `${receiving.receivedDate}T12:00:00.000Z` : `${receiving.expectedDate}T08:00:00.000Z`,
    severity: receiving.status === "received" ? ("good" as const) : ("warning" as const),
  })),
  ...retailStockCountSessions.map((session) => ({
    id: `activity-${session.id}`,
    title: `${session.code} ${session.status}`,
    description: `${session.countedBy} counted ${session.items.length} SKU rows in ${session.locationScope}.`,
    timestamp: session.startedAt,
    severity: session.status === "review-needed" ? ("warning" as const) : ("info" as const),
  })),
].sort((first, second) => new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime());

export const retailManagerReviewQueue: readonly RetailOperationInsight[] = [
  {
    id: "adjustment-review",
    title: "Adjustment review",
    value: String(retailRegisterSummary.pendingVoidReview),
    description: "Pending adjustment needs manager decision before real audit workflow is built.",
    severity: retailRegisterSummary.pendingVoidReview > 0 ? "warning" : "good",
    action: "Add approval modal later, not direct mutation from cashier screen.",
  },
  {
    id: "receiving-review",
    title: "Receiving review",
    value: String(pendingReceivingCount),
    description: "Purchase orders are not fully received yet.",
    severity: pendingReceivingCount > 0 ? "warning" : "good",
    action: "Receiving completion should create stock movement entries later.",
  },
  {
    id: "shelf-review",
    title: "Shelf review",
    value: String(retailShelfSlots.filter((slot) => slot.status !== "healthy").length),
    description: "Shelf slots need restock or placement review.",
    severity: "warning",
    action: "Keep shelf management separate from warehouse transfer logic.",
  },
];
