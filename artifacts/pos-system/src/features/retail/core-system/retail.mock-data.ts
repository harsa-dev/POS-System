import type {
  RetailBarcodeLookup,
  RetailMetric,
  RetailModuleMetadata,
  RetailProduct,
  RetailPromotion,
  RetailReceiving,
  RetailRegisterSummary,
  RetailShelfSlot,
  RetailStockCountSession,
  RetailSupplier,
  RetailTransaction,
  RetailWorkflowStep,
  RetailWorkspaceModuleId,
} from "./retail.types";

export const retailSuppliers: readonly RetailSupplier[] = [
  {
    id: "sup-001",
    name: "Sinar Grosir Nusantara",
    contactPerson: "Raka Pratama",
    phone: "+62 812-1000-2301",
    leadTimeDays: 2,
    reliabilityScore: 94,
  },
  {
    id: "sup-002",
    name: "Makmur Daily Supply",
    contactPerson: "Dewi Anjani",
    phone: "+62 813-9910-7702",
    leadTimeDays: 4,
    reliabilityScore: 88,
  },
  {
    id: "sup-003",
    name: "Freshline Distribution",
    contactPerson: "Bima Santoso",
    phone: "+62 857-2200-1818",
    leadTimeDays: 1,
    reliabilityScore: 91,
  },
];

export const retailProducts: readonly RetailProduct[] = [
  {
    id: "prd-001",
    sku: "RTL-RCE-5KG",
    barcode: "8991001005001",
    name: "Beras Premium 5kg",
    category: "Staple Goods",
    brand: "Padi Jaya",
    unit: "bag",
    price: 74500,
    cost: 62500,
    taxRatePercent: 11,
    stock: 42,
    reorderPoint: 12,
    shelfCapacity: 64,
    shelfLocation: "A1-01",
    supplierId: "sup-001",
    status: "healthy",
  },
  {
    id: "prd-002",
    sku: "RTL-OIL-2L",
    barcode: "8991002002007",
    name: "Minyak Goreng 2L",
    category: "Cooking Needs",
    brand: "Dapur Kita",
    unit: "bottle",
    price: 38500,
    cost: 32200,
    taxRatePercent: 11,
    stock: 16,
    reorderPoint: 18,
    shelfCapacity: 48,
    shelfLocation: "A2-04",
    supplierId: "sup-002",
    status: "low-stock",
  },
  {
    id: "prd-003",
    sku: "RTL-MLK-UHT",
    barcode: "8991003001256",
    name: "Susu UHT Cokelat 1L",
    category: "Beverages",
    brand: "MilkyWay",
    unit: "carton",
    price: 19800,
    cost: 15100,
    taxRatePercent: 11,
    stock: 0,
    reorderPoint: 24,
    shelfCapacity: 72,
    shelfLocation: "B1-02",
    supplierId: "sup-003",
    status: "out-of-stock",
  },
  {
    id: "prd-004",
    sku: "RTL-SNP-CHP",
    barcode: "8991004000900",
    name: "Keripik Kentang Original",
    category: "Snacks",
    brand: "Crunchi",
    unit: "pack",
    price: 12500,
    cost: 8200,
    taxRatePercent: 11,
    stock: 68,
    reorderPoint: 20,
    shelfCapacity: 90,
    shelfLocation: "C3-07",
    supplierId: "sup-001",
    status: "healthy",
  },
  {
    id: "prd-005",
    sku: "RTL-SOP-BAR",
    barcode: "8991005000755",
    name: "Sabun Mandi Antibakteri",
    category: "Household",
    brand: "CleanPlus",
    unit: "pcs",
    price: 7200,
    cost: 5100,
    taxRatePercent: 11,
    stock: 31,
    reorderPoint: 15,
    shelfCapacity: 54,
    shelfLocation: "D2-03",
    supplierId: "sup-002",
    status: "healthy",
  },
  {
    id: "prd-006",
    sku: "RTL-DRK-ISO",
    barcode: "8991006003301",
    name: "Minuman Isotonik 500ml",
    category: "Beverages",
    brand: "HydroMax",
    unit: "bottle",
    price: 9500,
    cost: 6100,
    taxRatePercent: 11,
    stock: 22,
    reorderPoint: 30,
    shelfCapacity: 80,
    shelfLocation: "B2-05",
    supplierId: "sup-003",
    status: "low-stock",
  },
];

export const retailTransactions: readonly RetailTransaction[] = [
  {
    id: "trx-001",
    receiptNumber: "RTL-2026-0001",
    cashierName: "Nadia",
    paymentMethod: "QRIS",
    status: "paid",
    createdAt: "2026-06-13T09:15:00.000Z",
    items: [
      { productId: "prd-001", quantity: 1, discountPercent: 0 },
      { productId: "prd-004", quantity: 3, discountPercent: 10 },
    ],
  },
  {
    id: "trx-002",
    receiptNumber: "RTL-2026-0002",
    cashierName: "Reno",
    paymentMethod: "Cash",
    status: "paid",
    createdAt: "2026-06-13T10:02:00.000Z",
    items: [
      { productId: "prd-002", quantity: 2, discountPercent: 0 },
      { productId: "prd-005", quantity: 4, discountPercent: 0 },
    ],
  },
  {
    id: "trx-003",
    receiptNumber: "RTL-2026-0003",
    cashierName: "Nadia",
    paymentMethod: "Card",
    status: "paid",
    createdAt: "2026-06-13T10:27:00.000Z",
    items: [
      { productId: "prd-006", quantity: 4, discountPercent: 0 },
      { productId: "prd-004", quantity: 2, discountPercent: 10 },
    ],
  },
];

export const retailRegisterSummary: RetailRegisterSummary = {
  registerCode: "REG-01",
  shiftCode: "SHIFT-2026-0613-A",
  cashierName: "Nadia",
  openedAt: "2026-06-13T08:00:00.000Z",
  expectedCash: 450000,
  cashDrawer: 472500,
  pendingVoidReview: 1,
};

export const retailBarcodeLookups: readonly RetailBarcodeLookup[] = [
  {
    barcode: "8991001005001",
    productId: "prd-001",
    scanResult: "found",
    message: "Product is available and can be added to cart.",
  },
  {
    barcode: "8991002002007",
    productId: "prd-002",
    scanResult: "low-stock-warning",
    message: "Product can be sold, but stock is below reorder point.",
  },
  {
    barcode: "8991003001256",
    productId: "prd-003",
    scanResult: "blocked-out-of-stock",
    message: "Checkout should block this item until stock is restored.",
  },
];

export const retailReceivings: readonly RetailReceiving[] = [
  {
    id: "rcv-001",
    referenceNumber: "PO-RTL-0007",
    supplierId: "sup-001",
    status: "received",
    expectedDate: "2026-06-12",
    receivedDate: "2026-06-12",
    itemCount: 18,
    totalCost: 12450000,
    items: [
      { productId: "prd-001", orderedQuantity: 30, receivedQuantity: 30, unitCost: 62500 },
      { productId: "prd-004", orderedQuantity: 80, receivedQuantity: 80, unitCost: 8200 },
    ],
  },
  {
    id: "rcv-002",
    referenceNumber: "PO-RTL-0008",
    supplierId: "sup-002",
    status: "partially-received",
    expectedDate: "2026-06-14",
    receivedDate: "2026-06-13",
    itemCount: 11,
    totalCost: 7320000,
    items: [
      { productId: "prd-002", orderedQuantity: 48, receivedQuantity: 24, unitCost: 32200 },
      { productId: "prd-005", orderedQuantity: 60, receivedQuantity: 60, unitCost: 5100 },
    ],
  },
  {
    id: "rcv-003",
    referenceNumber: "PO-RTL-0009",
    supplierId: "sup-003",
    status: "draft",
    expectedDate: "2026-06-16",
    receivedDate: null,
    itemCount: 9,
    totalCost: 4110000,
    items: [
      { productId: "prd-003", orderedQuantity: 72, receivedQuantity: 0, unitCost: 15100 },
      { productId: "prd-006", orderedQuantity: 96, receivedQuantity: 0, unitCost: 6100 },
    ],
  },
];

export const retailStockCountSessions: readonly RetailStockCountSession[] = [
  {
    id: "cnt-001",
    code: "OPN-A1-20260613",
    status: "review-needed",
    countedBy: "Reno",
    startedAt: "2026-06-13T08:45:00.000Z",
    locationScope: "Aisle A",
    items: [
      { productId: "prd-001", systemStock: 42, countedStock: 41, variance: -1, note: "One bag damaged near shelf edge." },
      { productId: "prd-002", systemStock: 16, countedStock: 16, variance: 0, note: "Matched." },
    ],
  },
  {
    id: "cnt-002",
    code: "OPN-B1-20260613",
    status: "counting",
    countedBy: "Nadia",
    startedAt: "2026-06-13T09:30:00.000Z",
    locationScope: "Beverages Zone",
    items: [
      { productId: "prd-003", systemStock: 0, countedStock: 0, variance: 0, note: "Empty shelf confirmed." },
      { productId: "prd-006", systemStock: 22, countedStock: 20, variance: -2, note: "Two bottles in promo basket not counted yet." },
    ],
  },
];

export const retailShelfSlots: readonly RetailShelfSlot[] = [
  {
    id: "shf-001",
    location: "A1-01",
    zone: "Staple Zone",
    category: "Staple Goods",
    productIds: ["prd-001"],
    capacity: 64,
    facingCount: 6,
    status: "healthy",
  },
  {
    id: "shf-002",
    location: "A2-04",
    zone: "Cooking Zone",
    category: "Cooking Needs",
    productIds: ["prd-002"],
    capacity: 48,
    facingCount: 4,
    status: "needs-restock",
  },
  {
    id: "shf-003",
    location: "B1-02",
    zone: "Beverage Zone",
    category: "Beverages",
    productIds: ["prd-003", "prd-006"],
    capacity: 152,
    facingCount: 10,
    status: "empty",
  },
  {
    id: "shf-004",
    location: "C3-07",
    zone: "Snack Zone",
    category: "Snacks",
    productIds: ["prd-004"],
    capacity: 90,
    facingCount: 8,
    status: "healthy",
  },
];

export const retailPromotions: readonly RetailPromotion[] = [
  {
    id: "promo-001",
    name: "Weekend Snack Push",
    description: "10% discount for selected snack products during weekend traffic.",
    discountPercent: 10,
    startsAt: "2026-06-13",
    endsAt: "2026-06-15",
    targetCategory: "Snacks",
    estimatedLiftPercent: 18,
    isActive: true,
  },
  {
    id: "promo-002",
    name: "Household Bundle",
    description: "Bundle discount for soap and household essentials.",
    discountPercent: 7,
    startsAt: "2026-06-10",
    endsAt: "2026-06-30",
    targetCategory: "Household",
    estimatedLiftPercent: 11,
    isActive: true,
  },
  {
    id: "promo-003",
    name: "Beverage Recovery Plan",
    description: "Campaign draft for beverage restock after supplier receiving is completed.",
    discountPercent: 5,
    startsAt: "2026-06-17",
    endsAt: "2026-06-23",
    targetCategory: "Beverages",
    estimatedLiftPercent: 9,
    isActive: false,
  },
];

export const retailWorkflowSteps: readonly RetailWorkflowStep[] = [
  {
    title: "Select retail mode",
    description: "Mode selector can route staff into the retail workspace without touching F&B screens.",
    status: "ready",
  },
  {
    title: "Validate module surfaces",
    description: "Every retail menu item renders a dedicated mock surface before API work begins.",
    status: "ready",
  },
  {
    title: "Design API contract",
    description: "Document product, sale, receiving, return, stock count, and promotion endpoints before implementation.",
    status: "mock-only",
  },
  {
    title: "Connect Prisma schema",
    description: "Blocked until the frontend workspace shape is stable enough to avoid schema churn.",
    status: "blocked-until-api",
  },
];

export const retailWorkspaceModules: Record<RetailWorkspaceModuleId, RetailModuleMetadata> = {
  cashier: {
    id: "cashier",
    title: "Retail Cashier",
    eyebrow: "Fast checkout surface",
    description: "Mock cashier workspace for barcode-first cart building, subtotal visibility, payment readiness, and stock warning simulation.",
    operationalGoal: "Validate checkout layout before connecting real cart, payment, and inventory mutations.",
    checkpoints: [
      "Barcode input area exists but does not call backend yet",
      "Cart totals come from mock products and mock transaction items",
      "Out-of-stock item must be visible before real checkout is added",
      "Payment method display is frontend-only for now",
    ],
  },
  catalog: {
    id: "catalog",
    title: "Product Catalog",
    eyebrow: "SKU and product control",
    description: "Mock catalog workspace for SKU, barcode, category, brand, pricing, cost, margin, tax, stock, and supplier relation visibility.",
    operationalGoal: "Define the product management shape without touching Prisma schema yet.",
    checkpoints: [
      "SKU and barcode are both visible",
      "Cost and price are separated for margin logic later",
      "Supplier relation remains mock-only",
      "Product status is derived from stock and reorder point",
    ],
  },
  barcode: {
    id: "barcode",
    title: "Barcode / SKU Lookup",
    eyebrow: "Lookup foundation",
    description: "Mock barcode workspace for validating SKU lookup, duplicate scanning prevention, and cashier item search behavior.",
    operationalGoal: "Prepare scanning UX before hardware scanner, API lookup, or product index exists.",
    checkpoints: [
      "Barcode strings are realistic enough for UI testing",
      "SKU lookup stays local and deterministic",
      "No hardware-specific scanner logic yet",
      "No inventory mutation on scan yet",
    ],
  },
  receiving: {
    id: "receiving",
    title: "Supplier Receiving",
    eyebrow: "Stock intake preview",
    description: "Mock receiving workspace for supplier purchase order status, expected date, receiving state, item variance, and cost visibility.",
    operationalGoal: "Validate restock workflow shape before purchase and stock movement tables are added.",
    checkpoints: [
      "Receiving status is visible",
      "Supplier lead time can be compared later",
      "Total cost is shown without creating accounting entries",
      "Received date supports null draft state",
    ],
  },
  "stock-opname": {
    id: "stock-opname",
    title: "Stock Opname",
    eyebrow: "Physical count control",
    description: "Mock stock count workspace for low stock, out-of-stock, reorder point, shelf counting, and variance review preparation.",
    operationalGoal: "Prepare count adjustment UX before creating stock adjustment API.",
    checkpoints: [
      "Low stock and out-of-stock products are easy to spot",
      "Reorder point is visible beside current stock",
      "Shelf location is included for real store operations",
      "No automatic adjustment is performed yet",
    ],
  },
  "shelf-management": {
    id: "shelf-management",
    title: "Shelf Management",
    eyebrow: "Location and placement",
    description: "Mock shelf workspace for aisle, rack, bin, category placement, facing count, and restock visibility.",
    operationalGoal: "Prepare shelf-location UI before inventory location models exist.",
    checkpoints: [
      "Shelf location appears on product cards",
      "Category grouping can be tested visually",
      "Out-of-stock shelves are obvious",
      "No warehouse transfer logic yet",
    ],
  },
  promotions: {
    id: "promotions",
    title: "Promotions",
    eyebrow: "Discount rule preview",
    description: "Mock promotion workspace for active campaign visibility, target category, discount percent, campaign period, and expected sales lift.",
    operationalGoal: "Define discount UX before pricing rule engine exists.",
    checkpoints: [
      "Promotion status is frontend-only",
      "Target category is visible",
      "Discount does not mutate product price yet",
      "Date window is visible for later validation logic",
    ],
  },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getTransactionTotal(transaction: RetailTransaction) {
  return transaction.items.reduce((total, item) => {
    const product = retailProducts.find((candidate) => candidate.id === item.productId);
    if (!product) return total;

    const gross = product.price * item.quantity;
    const discount = gross * (item.discountPercent / 100);

    return total + gross - discount;
  }, 0);
}

const todayRevenue = retailTransactions
  .filter((transaction) => transaction.status === "paid")
  .reduce((total, transaction) => total + getTransactionTotal(transaction), 0);

const lowStockCount = retailProducts.filter(
  (product) => product.status === "low-stock" || product.status === "out-of-stock",
).length;

const activePromotionCount = retailPromotions.filter((promotion) => promotion.isActive).length;

const pendingReceivingCount = retailReceivings.filter((receiving) => receiving.status !== "received").length;

export const retailMetrics: readonly RetailMetric[] = [
  {
    label: "Mock revenue today",
    value: formatCurrency(todayRevenue),
    helper: "Calculated from local mock transactions",
  },
  {
    label: "Active SKUs",
    value: String(retailProducts.length),
    helper: "Mock products ready for UI testing",
  },
  {
    label: "Stock alerts",
    value: String(lowStockCount),
    helper: "Low-stock and out-of-stock items",
  },
  {
    label: "Pending receiving",
    value: String(pendingReceivingCount),
    helper: "Purchase orders not fully received",
  },
  {
    label: "Active promos",
    value: String(activePromotionCount),
    helper: "Frontend-only discount campaigns",
  },
];

export function getRetailProductById(productId: string) {
  return retailProducts.find((product) => product.id === productId) ?? null;
}

export function getRetailSupplierName(supplierId: string) {
  return retailSuppliers.find((supplier) => supplier.id === supplierId)?.name ?? "Unknown supplier";
}

export function getRetailTransactionTotal(transaction: RetailTransaction) {
  return getTransactionTotal(transaction);
}

export function getRetailProductMarginPercent(product: RetailProduct) {
  if (product.price <= 0) return 0;
  return Math.round(((product.price - product.cost) / product.price) * 100);
}

export function formatRetailCurrency(value: number) {
  return formatCurrency(value);
}