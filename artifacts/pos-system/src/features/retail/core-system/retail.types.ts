export type RetailStockStatus = "healthy" | "low-stock" | "out-of-stock";

export type RetailPaymentMethod = "Cash" | "QRIS" | "Card" | "Transfer";

export type RetailProduct = Readonly<{
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  price: number;
  cost: number;
  taxRatePercent: number;
  stock: number;
  reorderPoint: number;
  shelfCapacity: number;
  shelfLocation: string;
  supplierId: string;
  status: RetailStockStatus;
}>;

export type RetailSupplier = Readonly<{
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  leadTimeDays: number;
  reliabilityScore: number;
}>;

export type RetailCartItem = Readonly<{
  productId: string;
  quantity: number;
  discountPercent: number;
}>;

export type RetailTransaction = Readonly<{
  id: string;
  receiptNumber: string;
  cashierName: string;
  paymentMethod: RetailPaymentMethod;
  status: "paid" | "refunded" | "voided";
  createdAt: string;
  items: readonly RetailCartItem[];
}>;

export type RetailRegisterSummary = Readonly<{
  registerCode: string;
  shiftCode: string;
  cashierName: string;
  openedAt: string;
  expectedCash: number;
  cashDrawer: number;
  pendingVoidReview: number;
}>;

export type RetailBarcodeLookup = Readonly<{
  barcode: string;
  productId: string;
  scanResult: "found" | "low-stock-warning" | "blocked-out-of-stock";
  message: string;
}>;

export type RetailReceivingStatus = "draft" | "received" | "partially-received";

export type RetailReceivingItem = Readonly<{
  productId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
}>;

export type RetailReceiving = Readonly<{
  id: string;
  referenceNumber: string;
  supplierId: string;
  status: RetailReceivingStatus;
  expectedDate: string;
  receivedDate: string | null;
  itemCount: number;
  totalCost: number;
  items: readonly RetailReceivingItem[];
}>;

export type RetailStockCountStatus = "draft" | "counting" | "review-needed" | "completed";

export type RetailStockCountItem = Readonly<{
  productId: string;
  systemStock: number;
  countedStock: number;
  variance: number;
  note: string;
}>;

export type RetailStockCountSession = Readonly<{
  id: string;
  code: string;
  status: RetailStockCountStatus;
  countedBy: string;
  startedAt: string;
  locationScope: string;
  items: readonly RetailStockCountItem[];
}>;

export type RetailShelfSlot = Readonly<{
  id: string;
  location: string;
  zone: string;
  category: string;
  productIds: readonly string[];
  capacity: number;
  facingCount: number;
  status: "healthy" | "needs-restock" | "empty";
}>;

export type RetailPromotion = Readonly<{
  id: string;
  name: string;
  description: string;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  targetCategory: string;
  estimatedLiftPercent: number;
  isActive: boolean;
}>;

export type RetailWorkflowStep = Readonly<{
  title: string;
  description: string;
  status: "ready" | "mock-only" | "blocked-until-api";
}>;

export type RetailWorkspaceModuleId =
  | "cashier"
  | "catalog"
  | "barcode"
  | "receiving"
  | "stock-opname"
  | "shelf-management"
  | "promotions";

export type RetailMetric = Readonly<{
  label: string;
  value: string;
  helper: string;
}>;

export type RetailModuleMetadata = Readonly<{
  id: RetailWorkspaceModuleId;
  title: string;
  eyebrow: string;
  description: string;
  operationalGoal: string;
  checkpoints: readonly string[];
}>;