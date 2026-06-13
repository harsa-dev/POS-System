import { retailMockRepository } from "./retail.mock-repository.js";
import type {
  RetailCheckoutPaymentMethod,
  RetailCommandCenterDto,
  RetailDashboardDto,
  RetailProductDto,
  RetailReturnPreviewDto,
  RetailReturnPreviewInput,
  RetailSaleLinePreviewDto,
  RetailSalePreviewDto,
  RetailSalePreviewInput,
} from "./retail.types.js";

const defaultPaymentMethod: RetailCheckoutPaymentMethod = "cash";

function roundMoney(value: number) {
  return Math.round(value);
}

function calculateTaxIncluded(lineTotal: number, taxRatePercent: number) {
  if (taxRatePercent <= 0) return 0;
  return roundMoney(lineTotal - lineTotal / (1 + taxRatePercent / 100));
}

function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) return 0;
  return Math.max(0, Math.floor(quantity));
}

function buildSaleLinePreview(input: { product: RetailProductDto; quantity: number; discountPercent: number }): RetailSaleLinePreviewDto {
  const quantity = normalizeQuantity(input.quantity);
  const discountPercent = Math.min(Math.max(input.discountPercent, 0), 100);
  const subtotal = input.product.price * quantity;
  const discountAmount = roundMoney(subtotal * (discountPercent / 100));
  const lineTotal = subtotal - discountAmount;
  const taxIncluded = calculateTaxIncluded(lineTotal, input.product.taxRatePercent);
  const grossProfit = lineTotal - input.product.cost * quantity;
  const blocked = quantity <= 0 || input.product.currentStock < quantity;

  return {
    productId: input.product.id,
    sku: input.product.sku,
    name: input.product.name,
    quantity,
    unitPrice: input.product.price,
    subtotal,
    discountAmount,
    taxIncluded,
    lineTotal,
    grossProfit,
    blocked,
    warning: blocked ? "Requested quantity is not available in mock stock." : undefined,
  };
}

function previewSale(input: RetailSalePreviewInput): RetailSalePreviewDto {
  const blockedReasons: string[] = [];
  const lines = input.lines.map((line) => {
    const product = retailMockRepository.findProductById(line.productId);

    if (!product) {
      blockedReasons.push(`Product ${line.productId} was not found.`);
      return null;
    }

    const previewLine = buildSaleLinePreview({
      product,
      quantity: line.quantity,
      discountPercent: line.discountPercent ?? 0,
    });

    if (previewLine.blocked) {
      blockedReasons.push(`${product.sku} cannot be checked out with the requested quantity.`);
    }

    return previewLine;
  }).filter((line): line is RetailSaleLinePreviewDto => line !== null);

  if (lines.length === 0) {
    blockedReasons.push("At least one valid sale line is required.");
  }

  return {
    persisted: false,
    canCheckout: blockedReasons.length === 0,
    paymentMethod: input.paymentMethod ?? defaultPaymentMethod,
    subtotal: lines.reduce((total, line) => total + line.subtotal, 0),
    discountTotal: lines.reduce((total, line) => total + line.discountAmount, 0),
    taxIncluded: lines.reduce((total, line) => total + line.taxIncluded, 0),
    payableTotal: lines.reduce((total, line) => total + line.lineTotal, 0),
    grossProfit: lines.reduce((total, line) => total + line.grossProfit, 0),
    blockedReasons,
    lines,
  };
}

export const retailService = {
  getDashboard(): RetailDashboardDto {
    const products = retailMockRepository.listProducts();
    const inventoryRisks = retailMockRepository.getInventoryRisks();
    const receivingQueue = retailMockRepository.listReceivingQueue();
    const samplePreview = previewSale({
      paymentMethod: "cash",
      lines: products
        .filter((product) => product.currentStock > 0)
        .slice(0, 2)
        .map((product) => ({ productId: product.id, quantity: 1 })),
    });

    return {
      mode: "retail",
      persistence: "mock-only",
      summary: {
        activeSku: products.length,
        todayRevenue: samplePreview.payableTotal * 18,
        grossProfit: samplePreview.grossProfit * 18,
        stockAlerts: inventoryRisks.length,
        pendingReceiving: receivingQueue.filter((item) => item.status !== "received").length,
        activePromos: 2,
      },
      checkoutReadiness: {
        canScanBarcode: true,
        canPreviewSale: true,
        canMockCheckout: true,
        writesDatabase: false,
      },
    };
  },

  listProducts(filters: { search?: string; category?: string; stockStatus?: string }) {
    const search = filters.search?.trim().toLowerCase();

    return retailMockRepository.listProducts().filter((product) => {
      const matchesSearch = search
        ? [product.name, product.sku, product.barcode, product.brand].some((value) => value.toLowerCase().includes(search))
        : true;
      const matchesCategory = filters.category ? product.category === filters.category : true;
      const matchesStockStatus = filters.stockStatus ? product.status === filters.stockStatus : true;

      return matchesSearch && matchesCategory && matchesStockStatus;
    });
  },

  getProductById(productId: string) {
    return retailMockRepository.findProductById(productId);
  },

  lookupBarcode(code: string) {
    return retailMockRepository.findProductByCode(code);
  },

  getInventoryRisks() {
    return retailMockRepository.getInventoryRisks();
  },

  getReceivingQueue() {
    return retailMockRepository.listReceivingQueue();
  },

  previewSale,

  mockCheckout(input: RetailSalePreviewInput) {
    const preview = previewSale(input);

    return {
      ...preview,
      mockReceiptNumber: `RTL-MOCK-${Date.now()}`,
      mockTransactionId: `mock-sale-${Date.now()}`,
      nextBackendStep: preview.canCheckout
        ? "Replace mock checkout with Prisma transaction, stock movement, payment record, and audit log."
        : "Fix blocked sale lines before enabling real checkout mutation.",
    };
  },

  previewReturn(input: RetailReturnPreviewInput): RetailReturnPreviewDto {
    const reviewReasons: string[] = [];
    const lines = input.lines.map((line) => {
      const product = retailMockRepository.findProductById(line.productId);
      const quantity = normalizeQuantity(line.quantity);

      if (!product) {
        reviewReasons.push(`Product ${line.productId} was not found.`);
        return null;
      }

      const restockable = input.reason !== "damaged" && input.reason !== "expired";
      if (!input.originalReceiptNumber) reviewReasons.push("Missing original receipt number.");
      if (!restockable) reviewReasons.push(`${product.sku} should not be auto-restocked.`);

      return {
        productId: product.id,
        sku: product.sku,
        quantity,
        restockable,
      };
    }).filter((line): line is RetailReturnPreviewDto["restockableLines"][number] => line !== null);

    const estimatedRefund = input.lines.reduce((total, line) => {
      const product = retailMockRepository.findProductById(line.productId);
      if (!product) return total;
      return total + product.price * normalizeQuantity(line.quantity);
    }, 0);

    return {
      persisted: false,
      requiresManagerReview: reviewReasons.length > 0,
      estimatedRefund,
      restockableLines: lines,
      reviewReasons: Array.from(new Set(reviewReasons)),
    };
  },

  getCommandCenter(): RetailCommandCenterDto {
    return {
      healthScore: 82,
      priorityActions: [
        {
          id: "action-001",
          title: "Approve partial beverage receiving before weekend sales.",
          priority: "high",
          ownerRole: "manager",
          source: "receiving",
        },
        {
          id: "action-002",
          title: "Review out-of-stock household SKU before checkout goes live.",
          priority: "high",
          ownerRole: "owner",
          source: "inventory",
        },
        {
          id: "action-003",
          title: "Prepare mock return approval rule for no-receipt refund.",
          priority: "medium",
          ownerRole: "manager",
          source: "returns",
        },
      ],
      nextIntegrationSteps: [
        "Map RetailProductDto to the Prisma retail product model once schema is ready.",
        "Replace mock repository with a Prisma repository implementing the same service contract.",
        "Wrap checkout in a database transaction with sale, payment, stock movement, and audit log writes.",
      ],
    };
  },
};
