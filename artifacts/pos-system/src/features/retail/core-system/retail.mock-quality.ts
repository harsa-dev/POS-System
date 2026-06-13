import {
  retailProducts,
  retailPromotions,
  retailReceivings,
  retailRegisterSummary,
  retailShelfSlots,
  retailStockCountSessions,
  retailSuppliers,
} from "./retail.mock-data";
import type {
  RetailProduct,
  RetailPromotion,
  RetailReceiving,
  RetailShelfSlot,
  RetailStockCountSession,
} from "./retail.types";

export type RetailQualitySeverity = "critical" | "warning" | "info";

export type RetailQualityCategory =
  | "cashier-control"
  | "inventory-control"
  | "receiving-control"
  | "promotion-control"
  | "shelf-control"
  | "supplier-control"
  | "manager-approval";

export type RetailQualityCheck = Readonly<{
  id: string;
  title: string;
  category: RetailQualityCategory;
  severity: RetailQualitySeverity;
  status: "pass" | "needs-review" | "blocked";
  summary: string;
  recommendedAction: string;
}>;

export type RetailReadinessScore = Readonly<{
  score: number;
  grade: "A" | "B" | "C" | "D";
  passedChecks: number;
  reviewChecks: number;
  blockedChecks: number;
  totalChecks: number;
}>;

export type RetailControlScenario = Readonly<{
  id: string;
  title: string;
  module: string;
  expectedBehavior: string;
  mockResult: "pass" | "needs-review" | "blocked";
  evidence: string;
}>;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const getSeverityWeight = (severity: RetailQualitySeverity) => {
  if (severity === "critical") return 18;
  if (severity === "warning") return 10;
  return 4;
};

const getBlockedProducts = (products: readonly RetailProduct[]) =>
  products.filter((product) => product.status === "out-of-stock" || product.stock <= 0);

const getLowStockProducts = (products: readonly RetailProduct[]) =>
  products.filter((product) => product.status === "low-stock" || product.stock <= product.reorderPoint);

const getShelfCapacityIssues = (slots: readonly RetailShelfSlot[]) =>
  slots.filter((slot) => slot.status !== "healthy" || slot.productIds.length === 0);

const getReceivingIssues = (receivings: readonly RetailReceiving[]) =>
  receivings.filter((receiving) =>
    receiving.items.some((item) => item.receivedQuantity < item.orderedQuantity),
  );

const getStockReviewSessions = (sessions: readonly RetailStockCountSession[]) =>
  sessions.filter((session) => session.status === "review-needed" || session.status === "counting");

const getPromotionConflicts = (promotions: readonly RetailPromotion[]) => {
  const activePromotions = promotions.filter((promotion) => promotion.isActive);

  return activePromotions.filter((promotion, index) =>
    activePromotions.some(
      (candidate, candidateIndex) =>
        candidateIndex !== index && candidate.targetCategory === promotion.targetCategory,
    ),
  );
};

const blockedProducts = getBlockedProducts(retailProducts);
const lowStockProducts = getLowStockProducts(retailProducts);
const shelfCapacityIssues = getShelfCapacityIssues(retailShelfSlots);
const receivingIssues = getReceivingIssues(retailReceivings);
const stockReviewSessions = getStockReviewSessions(retailStockCountSessions);
const promotionConflicts = getPromotionConflicts(retailPromotions);
const unreliableSuppliers = retailSuppliers.filter((supplier) => supplier.reliabilityScore < 90);
const cashVariance = retailRegisterSummary.cashDrawer - retailRegisterSummary.expectedCash;

export const retailQualityChecks: readonly RetailQualityCheck[] = [
  {
    id: "qa-cash-001",
    title: "Cash drawer variance review",
    category: "cashier-control",
    severity: Math.abs(cashVariance) >= 25000 ? "critical" : "warning",
    status: Math.abs(cashVariance) >= 25000 ? "blocked" : "needs-review",
    summary: `Register ${retailRegisterSummary.registerCode} has ${formatCurrency(cashVariance)} variance against expected cash.`,
    recommendedAction: "Require manager approval before shift closing and attach cashier note.",
  },
  {
    id: "qa-inv-001",
    title: "Blocked out-of-stock selling",
    category: "inventory-control",
    severity: blockedProducts.length > 0 ? "critical" : "info",
    status: blockedProducts.length > 0 ? "blocked" : "pass",
    summary: `${blockedProducts.length} SKU cannot be sold because stock is empty.`,
    recommendedAction: "Keep checkout blocking enabled until receiving or stock correction is recorded.",
  },
  {
    id: "qa-inv-002",
    title: "Reorder point control",
    category: "inventory-control",
    severity: lowStockProducts.length > 0 ? "warning" : "info",
    status: lowStockProducts.length > 0 ? "needs-review" : "pass",
    summary: `${lowStockProducts.length} SKU are at or below reorder point.`,
    recommendedAction: "Create purchase draft from low-stock SKU and prioritize fastest supplier lead time.",
  },
  {
    id: "qa-rcv-001",
    title: "Receiving discrepancy control",
    category: "receiving-control",
    severity: receivingIssues.length > 0 ? "warning" : "info",
    status: receivingIssues.length > 0 ? "needs-review" : "pass",
    summary: `${receivingIssues.length} receiving document has quantity discrepancy or incomplete receipt.`,
    recommendedAction: "Require receiver note before approving purchase cost into inventory valuation.",
  },
  {
    id: "qa-opn-001",
    title: "Stock opname approval queue",
    category: "manager-approval",
    severity: stockReviewSessions.length > 0 ? "warning" : "info",
    status: stockReviewSessions.length > 0 ? "needs-review" : "pass",
    summary: `${stockReviewSessions.length} stock count session still needs review or completion.`,
    recommendedAction: "Lock stock adjustment posting until manager approves variance.",
  },
  {
    id: "qa-prm-001",
    title: "Promotion overlap control",
    category: "promotion-control",
    severity: promotionConflicts.length > 0 ? "warning" : "info",
    status: promotionConflicts.length > 0 ? "needs-review" : "pass",
    summary: `${promotionConflicts.length} active campaign overlaps by category.`,
    recommendedAction: "Prevent stacked discounts unless the campaign is explicitly marked as combinable.",
  },
  {
    id: "qa-shf-001",
    title: "Shelf health control",
    category: "shelf-control",
    severity: shelfCapacityIssues.length > 0 ? "warning" : "info",
    status: shelfCapacityIssues.length > 0 ? "needs-review" : "pass",
    summary: `${shelfCapacityIssues.length} shelf slot needs restock, cleanup, or product reassignment.`,
    recommendedAction: "Generate shelf task list for floor staff before peak hour.",
  },
  {
    id: "qa-sup-001",
    title: "Supplier reliability control",
    category: "supplier-control",
    severity: unreliableSuppliers.length > 0 ? "warning" : "info",
    status: unreliableSuppliers.length > 0 ? "needs-review" : "pass",
    summary: `${unreliableSuppliers.length} supplier is below the target reliability score.`,
    recommendedAction: "Flag supplier for backup sourcing when low-stock SKU depends on them.",
  },
];

export const retailControlScenarios: readonly RetailControlScenario[] = [
  {
    id: "scenario-cashier-001",
    title: "Scan out-of-stock SKU",
    module: "Cashier",
    expectedBehavior: "Cashier can identify the product, but checkout must block the cart line.",
    mockResult: blockedProducts.length > 0 ? "blocked" : "pass",
    evidence: blockedProducts.map((product) => product.sku).join(", ") || "No blocked SKU in mock data.",
  },
  {
    id: "scenario-catalog-001",
    title: "Low-stock catalog filter",
    module: "Product Catalog",
    expectedBehavior: "Manager can filter risky SKU and prepare reorder plan.",
    mockResult: lowStockProducts.length > 0 ? "needs-review" : "pass",
    evidence: lowStockProducts.map((product) => `${product.sku} (${product.stock}/${product.reorderPoint})`).join(", "),
  },
  {
    id: "scenario-receiving-001",
    title: "Partial receiving review",
    module: "Receiving",
    expectedBehavior: "Incomplete receiving should remain reviewable before inventory valuation is final.",
    mockResult: receivingIssues.length > 0 ? "needs-review" : "pass",
    evidence: receivingIssues.map((receiving) => receiving.referenceNumber).join(", "),
  },
  {
    id: "scenario-opname-001",
    title: "Variance approval workflow",
    module: "Stock Opname",
    expectedBehavior: "Variance should be calculated and held for manager approval.",
    mockResult: stockReviewSessions.length > 0 ? "needs-review" : "pass",
    evidence: stockReviewSessions.map((session) => session.code).join(", "),
  },
  {
    id: "scenario-promo-001",
    title: "Promotion margin guard",
    module: "Promotions",
    expectedBehavior: "Campaign preview should show affected SKU before discount activation.",
    mockResult: "pass",
    evidence: `${retailPromotions.filter((promotion) => promotion.isActive).length} active promotion uses category targeting.`,
  },
  {
    id: "scenario-shelf-001",
    title: "Shelf task generation",
    module: "Shelf Management",
    expectedBehavior: "Needs-restock and empty shelf slots should become floor tasks.",
    mockResult: shelfCapacityIssues.length > 0 ? "needs-review" : "pass",
    evidence: shelfCapacityIssues.map((slot) => `${slot.location} ${slot.status}`).join(", "),
  },
];

export const retailReadinessScore: RetailReadinessScore = (() => {
  const blockedChecks = retailQualityChecks.filter((check) => check.status === "blocked").length;
  const reviewChecks = retailQualityChecks.filter((check) => check.status === "needs-review").length;
  const passedChecks = retailQualityChecks.filter((check) => check.status === "pass").length;
  const penalty = retailQualityChecks.reduce((total, check) => {
    if (check.status === "pass") return total;
    return total + getSeverityWeight(check.severity);
  }, 0);
  const score = Math.max(0, 100 - penalty);

  return {
    score,
    grade: score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : "D",
    passedChecks,
    reviewChecks,
    blockedChecks,
    totalChecks: retailQualityChecks.length,
  };
})();

export const retailNextEngineeringTasks: readonly string[] = [
  "Move mock validators into pure retail domain services before API work.",
  "Create API contract documentation for checkout validation, receiving approval, and stock adjustment.",
  "Map quality checks to future audit log events, but do not write database schema yet.",
  "Add route-level permission matrix for cashier, manager, inventory staff, and owner.",
  "Only after UI and rules stabilize, design Prisma models for retail sale, sale item, receiving, stock count, and promotion.",
];
