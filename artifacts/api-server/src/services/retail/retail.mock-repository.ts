import type { RetailCreateSaleInput, RetailRepository } from "./retail.repository.js";
import type {
  RetailInventoryRiskDto,
  RetailProductDto,
  RetailReceivingQueueDto,
  RetailSupplierDto,
} from "./retail.types.js";

const products: RetailProductDto[] = [
  {
    id: "prod-001",
    sku: "RTL-SNK-001",
    barcode: "8991001000011",
    name: "Sea Salt Potato Chips",
    brand: "North Shelf",
    category: "snacks",
    unit: "pack",
    price: 18000,
    cost: 10500,
    taxRatePercent: 11,
    currentStock: 42,
    reorderPoint: 18,
    shelfLocation: "A1-03",
    supplierId: "sup-001",
    status: "in-stock",
  },
  {
    id: "prod-002",
    sku: "RTL-BEV-002",
    barcode: "8991001000028",
    name: "Cold Brew Coffee 250ml",
    brand: "Daily Grind",
    category: "beverages",
    unit: "bottle",
    price: 24000,
    cost: 14500,
    taxRatePercent: 11,
    currentStock: 9,
    reorderPoint: 24,
    shelfLocation: "C2-01",
    supplierId: "sup-002",
    status: "low-stock",
  },
  {
    id: "prod-003",
    sku: "RTL-HHC-003",
    barcode: "8991001000035",
    name: "Liquid Dish Soap 450ml",
    brand: "CleanRoot",
    category: "household",
    unit: "bottle",
    price: 21000,
    cost: 13200,
    taxRatePercent: 11,
    currentStock: 0,
    reorderPoint: 12,
    shelfLocation: "E4-02",
    supplierId: "sup-003",
    status: "out-of-stock",
  },
  {
    id: "prod-004",
    sku: "RTL-DRY-004",
    barcode: "8991001000042",
    name: "Premium Rice 5kg",
    brand: "Harvest Lane",
    category: "grocery",
    unit: "bag",
    price: 78000,
    cost: 62500,
    taxRatePercent: 0,
    currentStock: 16,
    reorderPoint: 10,
    shelfLocation: "D1-01",
    supplierId: "sup-004",
    status: "in-stock",
  },
];

const suppliers: RetailSupplierDto[] = [
  { id: "sup-001", name: "Nusantara Snack Supply", leadTimeDays: 3, reliabilityScore: 94 },
  { id: "sup-002", name: "Borneo Beverage Partner", leadTimeDays: 4, reliabilityScore: 88 },
  { id: "sup-003", name: "CleanRoot Distribution", leadTimeDays: 5, reliabilityScore: 79 },
  { id: "sup-004", name: "Harvest Lane Wholesale", leadTimeDays: 2, reliabilityScore: 91 },
];

const receivingQueue: RetailReceivingQueueDto[] = [
  {
    id: "recv-001",
    supplierId: "sup-002",
    supplierName: "Borneo Beverage Partner",
    status: "partial",
    expectedDate: "2026-06-16",
    totalCost: 870000,
    items: [
      { productId: "prod-002", sku: "RTL-BEV-002", orderedQty: 60, receivedQty: 32, missingQty: 28 },
    ],
  },
  {
    id: "recv-002",
    supplierId: "sup-003",
    supplierName: "CleanRoot Distribution",
    status: "ordered",
    expectedDate: "2026-06-17",
    totalCost: 396000,
    items: [
      { productId: "prod-003", sku: "RTL-HHC-003", orderedQty: 30, receivedQty: 0, missingQty: 30 },
    ],
  },
];

export const retailMockRepository = {
  listProducts() {
    return products;
  },

  listSuppliers() {
    return suppliers;
  },

  listReceivingQueue() {
    return receivingQueue;
  },

  findProductById(_scope, productId) {
    return products.find((product) => product.id === productId) ?? null;
  },

  findProductByCode(_scope, code) {
    const normalizedCode = code.trim().toLowerCase();

    return (
      products.find(
        (product) =>
          product.barcode.toLowerCase() === normalizedCode ||
          product.sku.toLowerCase() === normalizedCode,
      ) ?? null
    );
  },

  getInventoryRisks(): RetailInventoryRiskDto[] {
    return products
      .filter((product) => product.currentStock <= product.reorderPoint)
      .map((product) => {
        const suggestedOrderQty = Math.max(product.reorderPoint * 2 - product.currentStock, product.reorderPoint);

        return {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          currentStock: product.currentStock,
          reorderPoint: product.reorderPoint,
          suggestedOrderQty,
          estimatedCost: suggestedOrderQty * product.cost,
          supplierId: product.supplierId,
        };
      });
  },

  createSale(input: RetailCreateSaleInput) {
    return {
      ...input.preview,
      persisted: true,
      saleId: "mock-sale-persisted",
      receiptNumber: `RTL-MOCK-${Date.now()}`,
      paymentId: "mock-payment-persisted",
      stockMovementIds: input.preview.lines.map((line) => `mock-movement-${line.productId}`),
      createdAt: new Date().toISOString(),
    };
  },
} satisfies RetailRepository;
