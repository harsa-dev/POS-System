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
