import { persistRetailReturnWithDelegate } from "./retail.return-repository.js";
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
  RetailReturnResultDto,
  RetailSaleLinePreviewDto,
  RetailSalePreviewDto,
  RetailSalePreviewInput,
  RetailSharedDashboardDto,
  RetailSharedDashboardId,
  RetailSharedDashboardRowDto,
  RetailStockAdjustInput,
} from "./retail.types.js";

const defaultPaymentMethod: RetailCheckoutPaymentMethod = "cash";

function roundMoney(value: number) {
  return Math.round(value);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
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

function getProductRows(products: RetailProductDto[]): RetailSharedDashboardRowDto[] {
  return products.slice(0, 6).map((product) => ({
    title: product.name,
    primary: `${product.sku} · ${product.currentStock} ${product.unit} · ${formatMoney(product.price)}`,
    secondary: `${product.shelfLocation} · ${product.category} · reorder at ${product.reorderPoint}`,
    status: product.currentStock <= 0 ? "blocked" : product.currentStock <= product.reorderPoint ? "review" : "healthy",
  }));
}

function getRiskRows(risks: Awaited<ReturnType<typeof retailRepository.getInventoryRisks>>): RetailSharedDashboardRowDto[] {
  return risks.slice(0, 6).map((risk) => ({
    title: risk.name,
    primary: `${risk.sku} · stock ${risk.currentStock}/${risk.reorderPoint}`,
    secondary: `Suggested order ${risk.suggestedOrderQty} · estimated ${formatMoney(risk.estimatedCost)}`,
    status: risk.currentStock <= 0 ? "blocked" : "review",
  }));
}

function getSkippedRows(label: string, replacement: string): RetailSharedDashboardRowDto[] {
  return [
    {
      title: `${label} is not called in retail mode`,
      primary: `Retail mode uses ${replacement} instead of the generic shared dashboard component.`,
      secondary: "The original dashboard remains available for other business modes.",
      status: "planned",
    },
  ];
}

function getPreviewProductIds(input: RetailSalePreviewInput) {
  return new Set(input.lines.map((line) => line.productId).filter(Boolean));
}

async function previewSale(scope: RetailBusinessScope, input: RetailSalePreviewInput): Promise<RetailSalePreviewDto> {
  const blockedReasons: string[] = [];
  const lines: RetailSaleLinePreviewDto[] = [];
  const requestedProductIds = getPreviewProductIds(input);
  const products = await retailRepository.listProducts(scope);
  const productById = new Map(
    products
      .filter((product) => requestedProductIds.has(product.id))
      .map((product) => [product.id, product]),
  );

  for (const line of input.lines) {
    const product = productById.get(line.productId);

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

  async getSharedDashboard(scope: RetailBusinessScope, dashboardId: RetailSharedDashboardId): Promise<RetailSharedDashboardDto> {
    const dashboard = await this.getDashboard(scope);
    const products = await retailRepository.listProducts(scope);
    const risks = await retailRepository.getInventoryRisks(scope);
    const receivingQueue = await retailRepository.listReceivingQueue(scope);
    const commandCenter = await this.getCommandCenter(scope);
    const margin = dashboard.summary.todayRevenue > 0
      ? Math.round((dashboard.summary.grossProfit / dashboard.summary.todayRevenue) * 100)
      : 0;
    const productRows = getProductRows(products);
    const riskRows = getRiskRows(risks);
    const receivingRows: RetailSharedDashboardRowDto[] = receivingQueue.slice(0, 6).map((item) => ({
      title: item.supplierName,
      primary: `${item.status} · expected ${item.expectedDate}`,
      secondary: `${item.items.length} lines · ${formatMoney(item.totalCost)}`,
      status: item.status === "received" ? "healthy" : "review",
    }));
    const actionRows: RetailSharedDashboardRowDto[] = commandCenter.priorityActions.map((action) => ({
      title: action.title,
      primary: `${action.ownerRole} · ${action.source}`,
      secondary: `Priority ${action.priority}`,
      status: action.priority === "high" ? "review" : "planned",
    }));

    if (dashboardId === "inventory") {
      return {
        id: dashboardId,
        title: "Retail inventory control",
        description: "Retail inventory is loaded from the Prisma-backed retail product and receiving tables.",
        metrics: [
          { label: "Active SKU", value: String(dashboard.summary.activeSku), helper: "From RetailProduct table" },
          { label: "Stock alerts", value: String(dashboard.summary.stockAlerts), helper: "Below reorder point or empty" },
          { label: "Pending receiving", value: String(dashboard.summary.pendingReceiving), helper: "Open supplier receiving" },
        ],
        rows: riskRows.length > 0 ? riskRows : productRows,
        bridgeNote: "This shared dashboard is served by /api/retail/shared-dashboard/inventory.",
        source: "prisma",
      };
    }

    if (dashboardId === "cashflow" || dashboardId === "financial-reports" || dashboardId === "sales") {
      return {
        id: dashboardId,
        title: dashboardId === "sales" ? "Retail sales analytics" : dashboardId === "cashflow" ? "Retail cashflow" : "Retail financial reports",
        description: "Retail financial signals use persisted retail products and checkout readiness from the backend.",
        metrics: [
          { label: "Revenue preview", value: formatMoney(dashboard.summary.todayRevenue), helper: "Projected from retail checkout service" },
          { label: "Gross profit", value: formatMoney(dashboard.summary.grossProfit), helper: `${margin}% margin preview` },
          { label: "Checkout writes", value: dashboard.checkoutReadiness.writesDatabase ? "Enabled" : "Mock", helper: "RetailSale + payment + stock movement" },
        ],
        rows: productRows,
        bridgeNote: `This shared dashboard is served by /api/retail/shared-dashboard/${dashboardId}.`,
        source: "prisma",
      };
    }

    if (dashboardId === "invoice-generator") {
      return {
        id: dashboardId,
        title: "Retail receipts and supplier billing",
        description: "Retail mode uses receipt and supplier receiving context instead of generic invoice generation.",
        metrics: [
          { label: "Open receiving", value: String(dashboard.summary.pendingReceiving), helper: "Supplier billing readiness" },
          { label: "Receiving value", value: formatMoney(receivingQueue.reduce((total, item) => total + item.totalCost, 0)), helper: "Open PO value" },
          { label: "Receipt mode", value: "Retail", helper: "Customer receipt first, invoice optional" },
        ],
        rows: receivingRows,
        bridgeNote: "This shared dashboard is served by /api/retail/shared-dashboard/invoice-generator.",
        source: "prisma",
      };
    }

    if (dashboardId === "employee-attendance" || dashboardId === "employee-contracts" || dashboardId === "payroll") {
      return {
        id: dashboardId,
        title: "Retail HR surface skipped",
        description: "Retail mode does not call heavy HR dashboards until staff payroll and contracts become a retail requirement.",
        metrics: [
          { label: "Status", value: "Skipped", helper: "Not required for Retail Mode scope" },
          { label: "Replacement", value: "Shift reports", helper: "Cashier shift context only" },
          { label: "Source", value: "Prisma API", helper: "Served by retail backend" },
        ],
        rows: getSkippedRows(dashboardId, "retail shift reports"),
        bridgeNote: `This shared dashboard is intentionally skipped in retail mode by /api/retail/shared-dashboard/${dashboardId}.`,
        source: "prisma",
      };
    }

    return {
      id: dashboardId,
      title: "Retail command context",
      description: "Retail shared dashboard bridge is using backend retail command, stock, receiving, and checkout readiness signals.",
      metrics: [
        { label: "Health score", value: `${commandCenter.healthScore}/100`, helper: "Retail command center" },
        { label: "Action queue", value: String(commandCenter.priorityActions.length), helper: "Manager/owner actions" },
        { label: "Prisma source", value: "Active", helper: "Backend route is wired" },
      ],
      rows: actionRows.length > 0 ? actionRows : productRows,
      bridgeNote: `This shared dashboard is served by /api/retail/shared-dashboard/${dashboardId}.`,
      source: "prisma",
    };
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

  async persistReturn(scope: RetailBusinessScope, actor: RetailActor, input: RetailReturnPreviewInput): Promise<RetailReturnResultDto> {
    const preview = await this.previewReturn(scope, input);

    return persistRetailReturnWithDelegate({
      scope,
      actor,
      input,
      preview,
    });
  },

  listSales(scope: RetailBusinessScope, options?: { limit?: number }) {
    return retailRepository.listSales(scope, options);
  },

  listStockMovements(scope: RetailBusinessScope, options?: { limit?: number }) {
    return retailRepository.listStockMovements(scope, options);
  },

  adjustStock(scope: RetailBusinessScope, actor: RetailActor, input: RetailStockAdjustInput) {
    return retailRepository.adjustStock(scope, actor, input);
  },

  listPromotions(scope: RetailBusinessScope) {
    return retailRepository.listPromotions(scope);
  },

  togglePromotion(scope: RetailBusinessScope, promotionId: string) {
    return retailRepository.togglePromotion(scope, promotionId);
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
