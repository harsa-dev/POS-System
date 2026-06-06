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
  status: string;
  imageUrl?: string | null;
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
