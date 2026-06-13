import type {
  RetailMetric,
  RetailModuleMetadata,
  RetailProduct,
  RetailPromotion,
  RetailReceiving,
  RetailSupplier,
  RetailTransaction,
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
    stock: 42,
    reorderPoint: 12,
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
    stock: 16,
    reorderPoint: 18,
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
    stock: 0,
    reorderPoint: 24,
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
    stock: 68,
    reorderPoint: 20,
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
    stock: 31,
    reorderPoint: 15,
    shelfLocation: "D2-03",
    supplierId: "sup-002",
    status: "healthy",
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
    isActive: true,
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
    description: "Mock catalog workspace for SKU, barcode, category, brand, pricing, cost, stock, and supplier relation visibility.",
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
    description: "Mock receiving workspace for supplier purchase order status, expected date, receiving state, and cost visibility.",
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
    description: "Mock stock count workspace for low stock, out-of-stock, reorder point, and shelf counting preparation.",
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
    description: "Mock shelf workspace for aisle, rack, bin, and product placement visibility.",
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
    description: "Mock promotion workspace for active campaign visibility, target category, discount percent, and campaign period.",
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
    label: "Active promos",
    value: String(activePromotionCount),
    helper: "Frontend-only discount campaigns",
  },
];

export function getRetailTransactionTotal(transaction: RetailTransaction) {
  return getTransactionTotal(transaction);
}

export function formatRetailCurrency(value: number) {
  return formatCurrency(value);
}
