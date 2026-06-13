import { retailRepository } from "./retail.repository-provider.js";
import type {
  RetailActor,
  RetailBusinessScope,
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
    cost: input.product.cost,
    subtotal,
    discountAmount,
    taxIncluded,
    lineTotal,
    grossProfit,
    blocked,
    warning: blocked ? "Requested quantity is not available in retail stock." : undefined,
  };
}

async function previewSale(scope: RetailBusinessScope, input: RetailSalePreviewInput): Promise<RetailSalePreviewDto> {
  const blockedReasons: string[] = [];
  const lines: RetailSaleLinePreviewDto[] = [];

  for (const line of input.lines) {
    const product = await retailRepository.findProductById(scope, line.productId);

    if (!product) {
      blockedReasons.push(`Product ${line.productId} was not found.`);
      continue;
    }

    const previewLine = buildSaleLinePreview({
      product,
      quantity: line.quantity,
      discountPercent: line.discountPercent ?? 0,
    });

    if (previewLine.blocked) {
      blockedReasons.push(`${product.sku} cannot be checked out with the requested quantity.`);
    }

    lines.push(previewLine);
  }

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
  async getDashboard(scope: RetailBusinessScope): Promise<RetailDashboardDto> {
    const products = await retailRepository.listProducts(scope);
    const inventoryRisks = await retailRepository.getInventoryRisks(scope);
    const receivingQueue = await retailRepository.listReceivingQueue(scope);
    const samplePreview = await previewSale(scope, {
      paymentMethod: "cash",
      lines: products
        .filter((product) => product.currentStock > 0)
        .slice(0, 2)
        .map((product) => ({ productId: product.id, quantity: 1 })),
    });

    return {
      mode: "retail",
      persistence: "prisma",
      summary: {
        activeSku: products.length,
        todayRevenue: samplePreview.payableTotal * 18,
        grossProfit: samplePreview.grossProfit * 18,
        stockAlerts: inventoryRisks.length,
        pendingReceiving: receivingQueue.filter((item) => item.status !== "received").length,
        activePromos: 0,
      },
      checkoutReadiness: {
        canScanBarcode: true,
        canPreviewSale: true,
        canMockCheckout: true,
        canPersistCheckout: true,
        writesDatabase: true,
      },
    };
  },

  async listProducts(scope: RetailBusinessScope, filters: { search?: string; category?: string; stockStatus?: string }) {
    const products = await retailRepository.listProducts(scope);
    const search = filters.search?.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = search
        ? [product.name, product.sku, product.barcode, product.brand].some((value) => value.toLowerCase().includes(search))
        : true;
      const matchesCategory = filters.category ? product.category === filters.category : true;
      const matchesStockStatus = filters.stockStatus ? product.status === filters.stockStatus : true;

      return matchesSearch && matchesCategory && matchesStockStatus;
    });
  },

  getProductById(scope: RetailBusinessScope, productId: string) {
    return retailRepository.findProductById(scope, productId);
  },

  lookupBarcode(scope: RetailBusinessScope, code: string) {
    return retailRepository.findProductByCode(scope, code);
  },

  getInventoryRisks(scope: RetailBusinessScope) {
    return retailRepository.getInventoryRisks(scope);
  },

  getReceivingQueue(scope: RetailBusinessScope) {
    return retailRepository.listReceivingQueue(scope);
  },

  previewSale,

  async mockCheckout(scope: RetailBusinessScope, input: RetailSalePreviewInput) {
    const preview = await previewSale(scope, input);

    return {
      ...preview,
      mockReceiptNumber: `RTL-MOCK-${Date.now()}`,
      mockTransactionId: `mock-sale-${Date.now()}`,
      nextBackendStep: preview.canCheckout
        ? "Use POST /api/retail/sales/checkout to persist sale, payment, stock movements, cashflow, and audit log."
        : "Fix blocked sale lines before real checkout mutation.",
    };
  },

  async checkout(scope: RetailBusinessScope, actor: RetailActor, input: RetailSalePreviewInput) {
    const preview = await previewSale(scope, input);

    if (!preview.canCheckout) {
      return preview;
    }

    return retailRepository.createSale({
      scope,
      actor,
      preview,
    });
  },

  async previewReturn(scope: RetailBusinessScope, input: RetailReturnPreviewInput): Promise<RetailReturnPreviewDto> {
    const reviewReasons: string[] = [];
    const restockableLines: RetailReturnPreviewDto["restockableLines"] = [];
    let estimatedRefund = 0;

    for (const line of input.lines) {
      const product = await retailRepository.findProductById(scope, line.productId);
      const quantity = normalizeQuantity(line.quantity);

      if (!product) {
        reviewReasons.push(`Product ${line.productId} was not found.`);
        continue;
      }

      const restockable = input.reason !== "damaged" && input.reason !== "expired";
      if (!input.originalReceiptNumber) reviewReasons.push("Missing original receipt number.");
      if (!restockable) reviewReasons.push(`${product.sku} should not be auto-restocked.`);

      estimatedRefund += product.price * quantity;
      restockableLines.push({
        productId: product.id,
        sku: product.sku,
        quantity,
        restockable,
      });
    }

    return {
      persisted: false,
      requiresManagerReview: reviewReasons.length > 0,
      estimatedRefund,
      restockableLines,
      reviewReasons: Array.from(new Set(reviewReasons)),
    };
  },

  async getCommandCenter(scope: RetailBusinessScope): Promise<RetailCommandCenterDto> {
    const risks = await retailRepository.getInventoryRisks(scope);
    const receivingQueue = await retailRepository.listReceivingQueue(scope);

    return {
      healthScore: risks.length === 0 ? 92 : Math.max(65, 92 - risks.length * 8),
      priorityActions: [
        ...risks.slice(0, 2).map((risk) => ({
          id: `stock-${risk.productId}`,
          title: `Reorder ${risk.sku} before stock drops further.`,
          priority: "high" as const,
          ownerRole: "manager" as const,
          source: "inventory",
        })),
        ...receivingQueue.filter((item) => item.status === "partial").slice(0, 1).map((item) => ({
          id: `receiving-${item.id}`,
          title: `Review partial receiving from ${item.supplierName}.`,
          priority: "medium" as const,
          ownerRole: "manager" as const,
          source: "receiving",
        })),
      ],
      nextIntegrationSteps: [
        "Seed real retail products and suppliers for each retail business.",
        "Add role-specific approval rules for returns and stock corrections.",
        "Swap frontend retail mock data to generated API client hooks.",
      ],
    };
  },
};
