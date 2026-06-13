export type HppMockStatus = "Mock Ready" | "Needs API" | "Needs Schema" | "Draft";

export type HppCostComponentMock = {
  id: string;
  name: string;
  category: string;
  sourceModule: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  variancePercent: number;
  futureSchema: string;
  futureApiField: string;
  status: HppMockStatus;
};

export type HppProductPriceMock = {
  id: string;
  productName: string;
  batchUnits: number;
  hppPerUnit: number;
  floorPrice: number;
  suggestedPrice: number;
  targetMarginPercent: number;
  approvalStatus: "Draft" | "Ready" | "Review";
};

export type HppDataPreparationMock = {
  id: string;
  domain: string;
  mockSource: string;
  futureApi: string;
  futureSchema: string;
  status: HppMockStatus;
  note: string;
};

export const hppCostComponentMocks: HppCostComponentMock[] = [
  {
    id: "hpp-cost-raw-material",
    name: "Raw material bundle",
    category: "COGS",
    sourceModule: "Inventory + Recipe",
    quantity: 840,
    unit: "portion",
    unitCost: 7_420,
    totalCost: 6_232_800,
    variancePercent: 4.2,
    futureSchema: "InventoryCostLayer + RecipeCostSnapshot",
    futureApiField: "components[].materialCost",
    status: "Needs Schema",
  },
  {
    id: "hpp-cost-packaging",
    name: "Packaging set",
    category: "COGS",
    sourceModule: "Purchasing",
    quantity: 840,
    unit: "set",
    unitCost: 1_450,
    totalCost: 1_218_000,
    variancePercent: 1.1,
    futureSchema: "PurchasePriceHistory",
    futureApiField: "components[].packagingCost",
    status: "Needs API",
  },
  {
    id: "hpp-cost-direct-labor",
    name: "Direct kitchen labor",
    category: "Direct Cost",
    sourceModule: "Payroll",
    quantity: 96,
    unit: "hour",
    unitCost: 25_000,
    totalCost: 2_400_000,
    variancePercent: 0,
    futureSchema: "LaborCostAllocation",
    futureApiField: "components[].laborCost",
    status: "Needs Schema",
  },
  {
    id: "hpp-cost-overhead",
    name: "Gas, electricity, water allocation",
    category: "Overhead",
    sourceModule: "Manual Rule",
    quantity: 1,
    unit: "period",
    unitCost: 1_680_000,
    totalCost: 1_680_000,
    variancePercent: 3.1,
    futureSchema: "OverheadAllocationRule",
    futureApiField: "components[].overheadCost",
    status: "Mock Ready",
  },
];

export const hppProductPriceMocks: HppProductPriceMock[] = [
  {
    id: "hpp-product-rice-bowl",
    productName: "Chicken Rice Bowl",
    batchUnits: 840,
    hppPerUnit: 13_727,
    floorPrice: 17_500,
    suggestedPrice: 22_500,
    targetMarginPercent: 39,
    approvalStatus: "Ready",
  },
  {
    id: "hpp-product-family-pack",
    productName: "Family Pack 4 Pax",
    batchUnits: 180,
    hppPerUnit: 48_500,
    floorPrice: 64_000,
    suggestedPrice: 84_000,
    targetMarginPercent: 42,
    approvalStatus: "Review",
  },
  {
    id: "hpp-product-promo-box",
    productName: "Lunch Promo Box",
    batchUnits: 360,
    hppPerUnit: 11_900,
    floorPrice: 15_900,
    suggestedPrice: 18_900,
    targetMarginPercent: 28,
    approvalStatus: "Draft",
  },
];

export const hppDataPreparationMocks: HppDataPreparationMock[] = [
  {
    id: "hpp-prep-cost-components",
    domain: "Cost components",
    mockSource: "hppCostComponentMocks",
    futureApi: "GET /api/shared/hpp-calculator/components",
    futureSchema: "InventoryCostLayer, RecipeCostSnapshot, LaborCostAllocation",
    status: "Needs Schema",
    note: "UI sudah siap menerima quantity, unit cost, total cost, variance, dan module source.",
  },
  {
    id: "hpp-prep-product-price",
    domain: "Product price simulation",
    mockSource: "hppProductPriceMocks",
    futureApi: "GET /api/shared/hpp-calculator/products",
    futureSchema: "ProductCostingSnapshot",
    status: "Mock Ready",
    note: "Nanti hubungkan ke product/menu id setelah naming business mode stabil.",
  },
  {
    id: "hpp-prep-save-simulation",
    domain: "Save simulation",
    mockSource: "disabled action",
    futureApi: "POST /api/shared/hpp-calculator/simulations",
    futureSchema: "HppSimulationRun",
    status: "Draft",
    note: "Mutation ditunda sampai role permission, audit log, dan approval siap.",
  },
];

export const hppSchemaPreparation = [
  {
    model: "ProductCostingSnapshot",
    fields: "productId, periodStart, periodEnd, totalCost, outputUnits, hppPerUnit, suggestedPrice",
    reason: "Menyimpan snapshot HPP per produk dan periode.",
  },
  {
    model: "InventoryCostLayer",
    fields: "inventoryItemId, purchasePrice, quantityUsed, costMethod, effectiveAt",
    reason: "Mengambil harga bahan dari inventory/purchasing tanpa hitung manual di UI.",
  },
  {
    model: "LaborCostAllocation",
    fields: "shiftId, employeeId, costCenter, allocatedHours, hourlyCost",
    reason: "Menghubungkan payroll/shift ke biaya produksi langsung.",
  },
  {
    model: "HppSimulationRun",
    fields: "createdById, businessMode, inputJson, resultJson, approvalStatus",
    reason: "Menyimpan simulasi sebelum harga menu benar-benar diubah.",
  },
] as const;

export function getHppMockSummary() {
  const totalCost = hppCostComponentMocks.reduce((sum, item) => sum + item.totalCost, 0);
  const needsSchema = hppDataPreparationMocks.filter((item) => item.status === "Needs Schema").length;
  const needsApi = hppDataPreparationMocks.filter((item) => item.status === "Needs API").length;

  return {
    totalCost,
    needsSchema,
    needsApi,
    mockProducts: hppProductPriceMocks.length,
  };
}
