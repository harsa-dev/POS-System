export type RetailStockStatus = "healthy" | "low-stock" | "out-of-stock";

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
  stock: number;
  reorderPoint: number;
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
  paymentMethod: "Cash" | "QRIS" | "Card" | "Transfer";
  status: "paid" | "refunded" | "voided";
  createdAt: string;
  items: readonly RetailCartItem[];
}>;

export type RetailReceivingStatus = "draft" | "received" | "partially-received";

export type RetailReceiving = Readonly<{
  id: string;
  referenceNumber: string;
  supplierId: string;
  status: RetailReceivingStatus;
  expectedDate: string;
  receivedDate: string | null;
  itemCount: number;
  totalCost: number;
}>;

export type RetailPromotion = Readonly<{
  id: string;
  name: string;
  description: string;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  targetCategory: string;
  isActive: boolean;
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
