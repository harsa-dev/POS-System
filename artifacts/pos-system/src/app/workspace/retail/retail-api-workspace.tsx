import { useEffect, useMemo, useState } from "react";
import { Barcode, Calculator, PackageSearch, RotateCcw, ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatRetailCurrency,
  retailProducts,
  type RetailPaymentMethod,
  type RetailProduct,
  type RetailStockStatus,
} from "@/features/retail/core-system";

type RetailApiWorkspaceModuleId = "cashier" | "catalog";

type RetailApiProductDto = {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  price: number;
  cost: number;
  taxRatePercent: number;
  currentStock: number;
  reorderPoint: number;
  shelfLocation: string;
  supplierId: string | null;
  status: "in-stock" | "low-stock" | "out-of-stock";
};

type RetailApiResponse<TData> = {
  success: boolean;
  data?: TData;
  message?: string;
};

type RetailCheckoutResponse = {
  persisted: boolean;
  canCheckout: boolean;
  receiptNumber?: string;
  saleId?: string;
  paymentId?: string;
  payableTotal: number;
  blockedReasons: string[];
};

type EditableCartItem = {
  productId: string;
  quantity: number;
  discountPercent: number;
};

type CartLine = {
  product: RetailProduct;
  quantity: number;
  discountPercent: number;
  gross: number;
  discount: number;
  taxIncluded: number;
  total: number;
};

type ApiState = "loading" | "api" | "mock-fallback";

const paymentMethods: readonly RetailPaymentMethod[] = ["Cash", "QRIS", "Card", "Transfer"];

const stockStatusTone: Record<RetailStockStatus, string> = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "low-stock": "border-amber-200 bg-amber-50 text-amber-700",
  "out-of-stock": "border-rose-200 bg-rose-50 text-rose-700",
};

const apiStateTone: Record<ApiState, string> = {
  loading: "border-blue-200 bg-blue-50 text-blue-700",
  api: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "mock-fallback": "border-amber-200 bg-amber-50 text-amber-700",
};

function toRetailStockStatus(status: RetailApiProductDto["status"]): RetailStockStatus {
  if (status === "in-stock") return "healthy";
  return status;
}

function toRetailProduct(product: RetailApiProductDto): RetailProduct {
  return {
    id: product.id,
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    category: product.category,
    brand: product.brand,
    unit: product.unit,
    price: Number(product.price),
    cost: Number(product.cost),
    taxRatePercent: Number(product.taxRatePercent),
    stock: Number(product.currentStock),
    reorderPoint: Number(product.reorderPoint),
    shelfCapacity: Math.max(Number(product.reorderPoint) * 3, Number(product.currentStock), 1),
    shelfLocation: product.shelfLocation,
    supplierId: product.supplierId ?? "api-supplier",
    status: toRetailStockStatus(product.status),
  };
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function getProductSearchBlob(product: RetailProduct) {
  return [product.name, product.sku, product.barcode, product.category, product.brand, product.shelfLocation]
    .join(" ")
    .toLowerCase();
}

function getProductMarginPercent(product: RetailProduct) {
  if (product.price <= 0) return 0;
  return Math.round(((product.price - product.cost) / product.price) * 100);
}

function getCartLines(products: readonly RetailProduct[], items: readonly EditableCartItem[]): CartLine[] {
  return items.flatMap((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!product) return [];

    const gross = product.price * item.quantity;
    const discount = gross * (item.discountPercent / 100);
    const total = gross - discount;
    const taxIncluded = total * (product.taxRatePercent / (100 + product.taxRatePercent));

    return [
      {
        product,
        quantity: item.quantity,
        discountPercent: item.discountPercent,
        gross,
        discount,
        taxIncluded,
        total,
      },
    ];
  });
}

function toCheckoutPaymentMethod(method: RetailPaymentMethod) {
  return method.toLowerCase() as "cash" | "qris" | "card" | "transfer";
}

async function fetchRetailProducts() {
  const response = await fetch("/api/retail/products", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Retail products request failed with ${response.status}`);
  }

  const payload = (await response.json()) as RetailApiResponse<RetailApiProductDto[]>;

  if (!payload.success || !payload.data) {
    throw new Error(payload.message ?? "Retail products response is invalid.");
  }

  return payload.data.map(toRetailProduct);
}

async function checkoutRetailSale(input: {
  paymentMethod: RetailPaymentMethod;
  lines: EditableCartItem[];
}) {
  const response = await fetch("/api/retail/sales/checkout", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentMethod: toCheckoutPaymentMethod(input.paymentMethod),
      lines: input.lines,
    }),
  });

  const payload = (await response.json()) as RetailApiResponse<RetailCheckoutResponse>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.message ?? `Retail checkout failed with ${response.status}`);
  }

  return payload.data;
}

function useRetailProducts() {
  const [products, setProducts] = useState<readonly RetailProduct[]>(retailProducts);
  const [source, setSource] = useState<ApiState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setSource("loading");
      setError(null);

      try {
        const nextProducts = await fetchRetailProducts();
        if (cancelled) return;

        setProducts(nextProducts.length > 0 ? nextProducts : retailProducts);
        setSource(nextProducts.length > 0 ? "api" : "mock-fallback");
        if (nextProducts.length === 0) {
          setError("Retail API returned zero products, so the workspace is using local mock data.");
        }
      } catch (caughtError) {
        if (cancelled) return;

        setProducts(retailProducts);
        setSource("mock-fallback");
        setError(caughtError instanceof Error ? caughtError.message : "Retail API request failed.");
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  return { products, source, error };
}

function ApiStatusBanner({ source, error }: { source: ApiState; error: string | null }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={apiStateTone[source]}>
          {source === "api" ? "Prisma API" : source === "loading" ? "Loading API" : "Mock fallback"}
        </Badge>
        <Badge variant="outline" className="border-blue-200 text-blue-700">
          Phase 5 frontend wiring
        </Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-neutral-600">
        Retail catalog and cashier now try the backend first. If auth, business mode, or the API fails, the UI falls back to local mock data instead of collapsing dramatically like a cheap folding chair.
      </p>
      {error ? <p className="mt-2 text-xs text-amber-700">Fallback reason: {error}</p> : null}
    </div>
  );
}

function CatalogApiModule({ products }: { products: readonly RetailProduct[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");

  useEffect(() => {
    if (products.length > 0 && !products.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(products[0]?.id ?? "");
    }
  }, [products, selectedProductId]);

  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.category))), [products]);
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? products[0] ?? null;

  const filteredProducts = useMemo(() => {
    const normalized = normalizeSearch(searchQuery);

    return products.filter((product) => {
      const matchesSearch = !normalized || getProductSearchBlob(product).includes(normalized);
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      const matchesStock = stockFilter === "all" || product.status === stockFilter;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [categoryFilter, products, searchQuery, stockFilter]);

  const reorderProducts = products.filter((product) => product.stock <= product.reorderPoint);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
      <Card className="rounded-xl bg-white">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>API-backed product catalog</CardTitle>
              <CardDescription>Search, filter, and inspect SKU readiness from the Retail products endpoint.</CardDescription>
            </div>
            <Badge variant="outline">{filteredProducts.length}/{products.length} SKUs</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 overflow-x-auto">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_180px]">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none ring-blue-100 focus:ring-4"
              placeholder="Search name, SKU, barcode, shelf..."
            />
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none ring-blue-100 focus:ring-4"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none ring-blue-100 focus:ring-4"
            >
              <option value="all">All stock</option>
              <option value="healthy">Healthy</option>
              <option value="low-stock">Low stock</option>
              <option value="out-of-stock">Out of stock</option>
            </select>
          </div>

          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-[0.12em] text-neutral-400">
              <tr>
                <th className="py-3 pr-4">Product</th>
                <th className="py-3 pr-4">Barcode</th>
                <th className="py-3 pr-4">Price</th>
                <th className="py-3 pr-4">Cost</th>
                <th className="py-3 pr-4">Margin</th>
                <th className="py-3 pr-4">Stock</th>
                <th className="py-3 pr-4">Shelf</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} onClick={() => setSelectedProductId(product.id)} className="cursor-pointer hover:bg-neutral-50">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-neutral-950">{product.name}</div>
                    <div className="text-xs text-neutral-500">{product.sku} · {product.category} · {product.brand}</div>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-neutral-600">{product.barcode}</td>
                  <td className="py-3 pr-4 text-neutral-700">{formatRetailCurrency(product.price)}</td>
                  <td className="py-3 pr-4 text-neutral-700">{formatRetailCurrency(product.cost)}</td>
                  <td className="py-3 pr-4 text-neutral-700">{getProductMarginPercent(product)}%</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${stockStatusTone[product.status]}`}>
                      {product.stock}/{product.reorderPoint}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-neutral-700">{product.shelfLocation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle>Selected SKU detail</CardTitle>
            <CardDescription>Click a product row to inspect backend-mapped fields.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedProduct ? (
              <>
                <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                  <p className="font-semibold text-neutral-950">{selectedProduct.name}</p>
                  <p className="mt-1 font-mono text-xs text-neutral-500">{selectedProduct.sku} · {selectedProduct.barcode}</p>
                </div>
                <div className="grid gap-2 text-sm text-neutral-600">
                  <div className="flex justify-between gap-4"><span>Supplier</span><span className="text-right">{selectedProduct.supplierId}</span></div>
                  <div className="flex justify-between gap-4"><span>Tax</span><span>{selectedProduct.taxRatePercent}%</span></div>
                  <div className="flex justify-between gap-4"><span>Margin</span><span>{getProductMarginPercent(selectedProduct)}%</span></div>
                  <div className="flex justify-between gap-4"><span>Shelf cap.</span><span>{selectedProduct.shelfCapacity}</span></div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle>Reorder candidates</CardTitle>
            <CardDescription>Products at or below reorder point.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reorderProducts.length > 0 ? reorderProducts.map((product) => (
              <div key={product.id} className="rounded-lg border border-neutral-100 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-neutral-950">{product.name}</p>
                  <Badge variant="outline" className={stockStatusTone[product.status]}>{product.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-neutral-500">Need +{Math.max(product.reorderPoint * 2 - product.stock, 0)} {product.unit} to reach buffer.</p>
              </div>
            )) : (
              <p className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm text-neutral-500">No reorder candidates.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CashierApiModule({ products }: { products: readonly RetailProduct[] }) {
  const [scanInput, setScanInput] = useState(products[0]?.barcode ?? "");
  const [cartItems, setCartItems] = useState<EditableCartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<RetailPaymentMethod>("QRIS");
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!scanInput && products[0]?.barcode) {
      setScanInput(products[0].barcode);
    }
  }, [products, scanInput]);

  useEffect(() => {
    if (cartItems.length === 0 && products.length > 0) {
      setCartItems(products.slice(0, 2).filter((product) => product.stock > 0).map((product) => ({
        productId: product.id,
        quantity: 1,
        discountPercent: 0,
      })));
    }
  }, [cartItems.length, products]);

  const scannedProduct = useMemo(() => {
    const normalized = normalizeSearch(scanInput);
    if (!normalized) return null;

    return products.find((product) => {
      return [product.barcode, product.sku, product.name, product.brand]
        .map((value) => value.toLowerCase())
        .some((value) => value.includes(normalized));
    }) ?? null;
  }, [products, scanInput]);

  const cartLines = useMemo(() => getCartLines(products, cartItems), [cartItems, products]);
  const subtotal = cartLines.reduce((total, line) => total + line.gross, 0);
  const discountTotal = cartLines.reduce((total, line) => total + line.discount, 0);
  const taxIncluded = cartLines.reduce((total, line) => total + line.taxIncluded, 0);
  const payable = cartLines.reduce((total, line) => total + line.total, 0);
  const blockedCartLines = cartLines.filter((line) => line.quantity > line.product.stock || line.product.status === "out-of-stock");
  const canCheckout = cartLines.length > 0 && blockedCartLines.length === 0 && checkoutStatus !== "submitting";

  function addScannedProduct() {
    if (!scannedProduct || scannedProduct.stock <= 0) return;

    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.productId === scannedProduct.id);
      const reservedStock = currentItems
        .filter((item) => item.productId === scannedProduct.id)
        .reduce((total, item) => total + item.quantity, 0);

      if (reservedStock >= scannedProduct.stock) return currentItems;

      if (!existingItem) {
        return [...currentItems, { productId: scannedProduct.id, quantity: 1, discountPercent: 0 }];
      }

      return currentItems.map((item) => {
        if (item.productId !== scannedProduct.id) return item;
        return { ...item, quantity: item.quantity + 1 };
      });
    });
  }

  function updateQuantity(product: RetailProduct, nextQuantity: number) {
    const safeQuantity = Math.min(Math.max(nextQuantity, 0), product.stock);

    setCartItems((currentItems) => {
      if (safeQuantity === 0) {
        return currentItems.filter((item) => item.productId !== product.id);
      }

      return currentItems.map((item) => {
        if (item.productId !== product.id) return item;
        return { ...item, quantity: safeQuantity };
      });
    });
  }

  async function submitCheckout() {
    if (!canCheckout) return;

    setCheckoutStatus("submitting");
    setCheckoutMessage(null);

    try {
      const result = await checkoutRetailSale({ paymentMethod, lines: cartItems });
      setCheckoutStatus("success");
      setCheckoutMessage(
        result.receiptNumber
          ? `Persisted ${result.receiptNumber} for ${formatRetailCurrency(result.payableTotal)}.`
          : `Checkout accepted for ${formatRetailCurrency(result.payableTotal)}.`,
      );
      setCartItems([]);
    } catch (caughtError) {
      setCheckoutStatus("error");
      setCheckoutMessage(caughtError instanceof Error ? caughtError.message : "Checkout request failed.");
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.85fr_1.35fr_0.8fr]">
      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Barcode className="h-5 w-5" aria-hidden="true" />
            API cashier scanner
          </CardTitle>
          <CardDescription>Scan by barcode, SKU, product name, or brand from the Retail products endpoint.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            value={scanInput}
            onChange={(event) => setScanInput(event.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-3 font-mono text-sm outline-none ring-blue-100 focus:ring-4"
            placeholder="Barcode / SKU / product name"
          />

          <div className="flex flex-wrap gap-2">
            {products.slice(0, 4).map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => setScanInput(product.barcode)}
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
              >
                {product.sku}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Current scan result</p>
            {scannedProduct ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-950">{scannedProduct.name}</p>
                    <p className="text-sm text-neutral-500">{scannedProduct.sku} · Stock {scannedProduct.stock}</p>
                  </div>
                  <Badge variant="outline" className={stockStatusTone[scannedProduct.status]}>
                    {scannedProduct.status}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={addScannedProduct}
                  disabled={scannedProduct.stock <= 0}
                  className="w-full rounded-lg bg-neutral-950 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                  {scannedProduct.stock <= 0 ? "Blocked: out of stock" : "Add scanned item"}
                </button>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-neutral-500">No product matched this input.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                API checkout cart
              </CardTitle>
              <CardDescription>Checkout posts to /api/retail/sales/checkout.</CardDescription>
            </div>
            <button
              type="button"
              onClick={() => setCartItems([])}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Clear
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 overflow-x-auto">
          {cartLines.length > 0 ? (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-[0.12em] text-neutral-400">
                <tr>
                  <th className="py-3 pr-4">Item</th>
                  <th className="py-3 pr-4">Qty</th>
                  <th className="py-3 pr-4">Price</th>
                  <th className="py-3 pr-4">Tax incl.</th>
                  <th className="py-3 pr-4">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {cartLines.map((line) => (
                  <tr key={line.product.id}>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-neutral-950">{line.product.name}</div>
                      <div className="text-xs text-neutral-500">{line.product.sku} · {line.product.shelfLocation}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="inline-flex items-center rounded-lg border border-neutral-200">
                        <button type="button" onClick={() => updateQuantity(line.product, line.quantity - 1)} className="px-3 py-1 text-neutral-600">-</button>
                        <span className="min-w-8 border-x px-3 py-1 text-center font-semibold">{line.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(line.product, line.quantity + 1)} className="px-3 py-1 text-neutral-600">+</button>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-neutral-700">{formatRetailCurrency(line.product.price)}</td>
                    <td className="py-3 pr-4 text-neutral-700">{formatRetailCurrency(line.taxIncluded)}</td>
                    <td className="py-3 pr-4 font-semibold text-neutral-950">{formatRetailCurrency(line.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
              Cart is empty. Scan a product or use one of the SKU pills.
            </div>
          )}

          {blockedCartLines.length > 0 ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {blockedCartLines.length} cart line is blocked because requested quantity exceeds current stock.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" aria-hidden="true" />
            Payment API
          </CardTitle>
          <CardDescription>Posts persisted checkout when backend session and Retail business are valid.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method) => (
              <button
                type="button"
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={paymentMethod === method
                  ? "rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-center text-sm font-medium text-blue-700"
                  : "rounded-lg border border-neutral-200 bg-white px-3 py-2 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"}
              >
                {method}
              </button>
            ))}
          </div>

          <div className="space-y-2 rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm">
            <div className="flex justify-between gap-4"><span>Subtotal</span><span>{formatRetailCurrency(subtotal)}</span></div>
            <div className="flex justify-between gap-4"><span>Discount</span><span>-{formatRetailCurrency(discountTotal)}</span></div>
            <div className="flex justify-between gap-4"><span>Tax included</span><span>{formatRetailCurrency(taxIncluded)}</span></div>
            <div className="flex justify-between gap-4 border-t pt-2 font-bold text-neutral-950"><span>Payable</span><span>{formatRetailCurrency(payable)}</span></div>
          </div>

          <button
            type="button"
            disabled={!canCheckout}
            onClick={submitCheckout}
            className="w-full rounded-lg bg-neutral-950 px-3 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {checkoutStatus === "submitting" ? "Submitting checkout..." : canCheckout ? `Persist ${paymentMethod} checkout` : "Checkout blocked"}
          </button>

          {checkoutMessage ? (
            <div className={checkoutStatus === "success"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
              : "rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"}
            >
              {checkoutMessage}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export function RetailApiWorkspace({ moduleId }: { moduleId: RetailApiWorkspaceModuleId }) {
  const { products, source, error } = useRetailProducts();

  return (
    <section className="space-y-6">
      <ApiStatusBanner source={source} error={error} />
      {moduleId === "catalog" ? <CatalogApiModule products={products} /> : <CashierApiModule products={products} />}
    </section>
  );
}
