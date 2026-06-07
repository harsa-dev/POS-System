export type PosCategoryItem = {
  label: string;
  count: number;
  tone: string;
};

export type PosProductItem = {
  id: string;
  name: string;
  category: string;
  price: string;
  priceValue: number;
  status: string;
  imageUrl?: string | null;
};

export type PosCartItem = {
  productId: string;
  name: string;
  category: string;
  unitPrice: number;
  unitPriceLabel: string;
  quantity: number;
};

export type PosCartTotals = {
  subtotal: number;
  serviceAmount: number;
  taxAmount: number;
  total: number;
  serviceRate: number;
  taxRate: number;
};

export type PosTableStatus =
  | "AVAILABLE"
  | "OCCUPIED"
  | "RESERVED"
  | "CLEANING"
  | "INACTIVE"
  | string;

export type PosTableItem = {
  id: string;
  name: string;
  capacity: number;
  status: PosTableStatus;
};

export type PosTableSummary = {
  total: number;
  available: number;
  occupied: number;
  reserved: number;
  cleaning: number;
};

export type PosOpenOrderItem = {
  id: string;
  code: string;
  table: string;
  status: string;
  total: string;
  createdTime: string;
  itemCount: number;
};
