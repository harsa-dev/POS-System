export const v3PosCategories = [
  { label: "All Items", count: 32, tone: "bg-neutral-950 text-white" },
  { label: "Food", count: 18, tone: "bg-white text-neutral-700" },
  { label: "Drinks", count: 8, tone: "bg-white text-neutral-700" },
  { label: "Packages", count: 4, tone: "bg-white text-neutral-700" },
  { label: "Favorites", count: 6, tone: "bg-white text-neutral-700" },
] as const;

export const v3PosProducts = [
  {
    name: "Nasi Goreng Signature",
    category: "Food",
    price: "Rp 45.000",
    status: "Ready",
    imageUrl: null,
  },
  {
    name: "Chicken Katsu Set",
    category: "Food",
    price: "Rp 52.000",
    status: "Ready",
    imageUrl: null,
  },
  {
    name: "Iced Lychee Tea",
    category: "Drinks",
    price: "Rp 24.000",
    status: "Fast",
    imageUrl: null,
  },
  {
    name: "Family Bento Package",
    category: "Packages",
    price: "Rp 155.000",
    status: "Bundle",
    imageUrl: null,
  },
  {
    name: "Manual Item Placeholder",
    category: "Custom",
    price: "Rp 0",
    status: "Draft",
    imageUrl: null,
  },
  {
    name: "Coffee Latte",
    category: "Drinks",
    price: "Rp 32.000",
    status: "Ready",
    imageUrl: null,
  },
] as const;

export const v3PosCartItems = [
  {
    name: "Nasi Goreng Signature",
    quantity: 2,
    note: "Less spicy",
    total: "Rp 90.000",
  },
  {
    name: "Iced Lychee Tea",
    quantity: 2,
    note: "Normal ice",
    total: "Rp 48.000",
  },
  {
    name: "Coffee Latte",
    quantity: 1,
    note: "Take away",
    total: "Rp 32.000",
  },
] as const;

export const v3PosOpenOrders = [
  { code: "D-04", table: "Table 8", status: "Kitchen", total: "Rp 214.000" },
  { code: "T-11", table: "Takeaway", status: "Held", total: "Rp 86.000" },
] as const;
