import { useMemo, useState } from "react";

import {
  AlertTriangle,
  BadgePercent,
  Barcode,
  Boxes,
  Calculator,
  CheckCircle2,
  ClipboardList,
  PackageSearch,
  ReceiptText,
  RotateCcw,
  Search,
  ShoppingCart,
  Store,
  Truck,
} from "lucide-react";

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
  getRetailProductById,
  getRetailProductMarginPercent,
  getRetailSupplierName,
  getRetailTransactionTotal,
  retailBarcodeLookups,
  retailMetrics,
  retailProducts,
  retailPromotions,
  retailReceivings,
  retailRegisterSummary,
  retailShelfSlots,
  retailStockCountSessions,
  retailTransactions,
  retailWorkflowSteps,
  retailWorkspaceModules,
  type RetailPaymentMethod,
  type RetailProduct,
  type RetailWorkspaceModuleId,
} from "@/features/retail/core-system";

type RetailWorkspaceProps = {
  moduleId: RetailWorkspaceModuleId;
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
  profit: number;
  total: number;
};

type ReceivingPreviewMode = "recorded" | "receive-all";

const moduleIcons: Record<RetailWorkspaceModuleId, typeof ShoppingCart> = {
  cashier: ShoppingCart,
  catalog: PackageSearch,
  barcode: Barcode,
  receiving: Truck,
  "stock-opname": ClipboardList,
  "shelf-management": Boxes,
  promotions: BadgePercent,
};

const stockStatusTone = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "low-stock": "border-amber-200 bg-amber-50 text-amber-700",
  "out-of-stock": "border-rose-200 bg-rose-50 text-rose-700",
} as const;

const scanResultTone = {
  found: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "low-stock-warning": "border-amber-200 bg-amber-50 text-amber-700",
  "blocked-out-of-stock": "border-rose-200 bg-rose-50 text-rose-700",
} as const;

const receivingStatusTone = {
  draft: "border-neutral-200 bg-neutral-50 text-neutral-600",
  received: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "partially-received": "border-amber-200 bg-amber-50 text-amber-700",
} as const;

const stockCountStatusTone = {
  draft: "border-neutral-200 bg-neutral-50 text-neutral-600",
  counting: "border-blue-200 bg-blue-50 text-blue-700",
  "review-needed": "border-amber-200 bg-amber-50 text-amber-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
} as const;

const shelfStatusTone = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "needs-restock": "border-amber-200 bg-amber-50 text-amber-700",
  empty: "border-rose-200 bg-rose-50 text-rose-700",
} as const;

const workflowStatusTone = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "mock-only": "border-blue-200 bg-blue-50 text-blue-700",
  "blocked-until-api": "border-amber-200 bg-amber-50 text-amber-700",
} as const;

const paymentMethods: readonly RetailPaymentMethod[] = ["Cash", "QRIS", "Card", "Transfer"];

const initialCartItems: EditableCartItem[] =
  retailTransactions[0]?.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    discountPercent: item.discountPercent,
  })) ?? [];

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function formatDate(value: string | null) {
  if (!value) return "Not received";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getLatestTransactionLabel() {
  const latest = retailTransactions[0];

  if (!latest) return "No transaction";

  return `${latest.receiptNumber} · ${formatRetailCurrency(getRetailTransactionTotal(latest))}`;
}

function getActivePromotionForProduct(product: RetailProduct) {
  return retailPromotions.find(
    (promotion) => promotion.isActive && promotion.targetCategory === product.category,
  );
}

function getCartLines(items: readonly EditableCartItem[]): CartLine[] {
  return items.flatMap((item) => {
    const product = getRetailProductById(item.productId);

    if (!product) return [];

    const gross = product.price * item.quantity;
    const discount = gross * (item.discountPercent / 100);
    const total = gross - discount;
    const taxIncluded = total * (product.taxRatePercent / (100 + product.taxRatePercent));
    const profit = (product.price - product.cost) * item.quantity - discount;

    return [
      {
        product,
        quantity: item.quantity,
        discountPercent: item.discountPercent,
        gross,
        discount,
        taxIncluded,
        profit,
        total,
      },
    ];
  });
}

function findProductByQuery(query: string) {
  const normalized = normalizeSearch(query);

  if (!normalized) return null;

  return (
    retailProducts.find((product) => {
      return [product.barcode, product.sku, product.name, product.brand]
        .map((value) => value.toLowerCase())
        .some((value) => value.includes(normalized));
    }) ?? null
  );
}

function getProductSearchBlob(product: RetailProduct) {
  return [product.name, product.sku, product.barcode, product.category, product.brand, product.shelfLocation]
    .join(" ")
    .toLowerCase();
}

function getStockAfterCart(product: RetailProduct, cartItems: readonly EditableCartItem[]) {
  const reserved = cartItems
    .filter((item) => item.productId === product.id)
    .reduce((total, item) => total + item.quantity, 0);

  return product.stock - reserved;
}

function getShelfUtilizationPercent(slotProductIds: readonly string[], capacity: number) {
  if (capacity <= 0) return 0;

  const stockOnShelf = slotProductIds.reduce((total, productId) => {
    return total + (getRetailProductById(productId)?.stock ?? 0);
  }, 0);

  return Math.min(100, Math.round((stockOnShelf / capacity) * 100));
}

function WorkspaceHeader({ moduleId }: RetailWorkspaceProps) {
  const workspace = retailWorkspaceModules[moduleId];
  const Icon = moduleIcons[moduleId];

  return (
    <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-blue-200 text-blue-700">
          Retail mode foundation
        </Badge>
        <Badge variant="outline" className="border-emerald-300 text-emerald-700">
          Interactive mock flow
        </Badge>
        <Badge variant="outline" className="border-amber-300 text-amber-700">
          No API or schema touched
        </Badge>
      </div>

      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-4xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
            {workspace.eyebrow}
          </p>
          <h1 className="text-2xl font-bold text-neutral-950">{workspace.title}</h1>
          <p className="text-sm leading-6 text-neutral-600">{workspace.description}</p>
          <p className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm leading-6 text-neutral-600">
            <span className="font-semibold text-neutral-900">Operational goal:</span>{" "}
            {workspace.operationalGoal}
          </p>
        </div>

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function RetailMetricsGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {retailMetrics.map((metric) => (
        <Card key={metric.label} className="rounded-xl bg-white">
          <CardHeader className="pb-2">
            <CardDescription>{metric.label}</CardDescription>
            <CardTitle className="text-2xl">{metric.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-neutral-500">{metric.helper}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CashierModule() {
  const [scanInput, setScanInput] = useState(retailBarcodeLookups[0]?.barcode ?? "");
  const [cartItems, setCartItems] = useState<EditableCartItem[]>(initialCartItems);
  const [paymentMethod, setPaymentMethod] = useState<RetailPaymentMethod>("QRIS");

  const scannedProduct = useMemo(() => findProductByQuery(scanInput), [scanInput]);
  const cartLines = useMemo(() => getCartLines(cartItems), [cartItems]);

  const subtotal = cartLines.reduce((total, line) => total + line.gross, 0);
  const discountTotal = cartLines.reduce((total, line) => total + line.discount, 0);
  const taxIncluded = cartLines.reduce((total, line) => total + line.taxIncluded, 0);
  const profitPreview = cartLines.reduce((total, line) => total + line.profit, 0);
  const payable = cartLines.reduce((total, line) => total + line.total, 0);
  const blockedCartLines = cartLines.filter((line) => line.quantity > line.product.stock || line.product.status === "out-of-stock");
  const canCheckout = cartLines.length > 0 && blockedCartLines.length === 0;

  function addScannedProduct() {
    if (!scannedProduct || scannedProduct.stock <= 0) return;

    const activePromotion = getActivePromotionForProduct(scannedProduct);

    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.productId === scannedProduct.id);
      const reservedStock = currentItems
        .filter((item) => item.productId === scannedProduct.id)
        .reduce((total, item) => total + item.quantity, 0);

      if (reservedStock >= scannedProduct.stock) return currentItems;

      if (!existingItem) {
        return [
          ...currentItems,
          {
            productId: scannedProduct.id,
            quantity: 1,
            discountPercent: activePromotion?.discountPercent ?? 0,
          },
        ];
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

  function removeItem(productId: string) {
    setCartItems((currentItems) => currentItems.filter((item) => item.productId !== productId));
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.35fr_0.75fr]">
      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Barcode className="h-5 w-5" aria-hidden="true" />
            Live cashier simulator
          </CardTitle>
          <CardDescription>Scan by barcode, SKU, product name, or brand. Still local-only, tragically obedient.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="retail-scan-input" className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
              Barcode / SKU input
            </label>
            <input
              id="retail-scan-input"
              value={scanInput}
              onChange={(event) => setScanInput(event.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-3 font-mono text-sm outline-none ring-blue-100 focus:ring-4"
              placeholder="8991001005001 or RTL-RCE-5KG"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {retailBarcodeLookups.map((lookup) => {
              const product = getRetailProductById(lookup.productId);

              return (
                <button
                  type="button"
                  key={lookup.barcode}
                  onClick={() => setScanInput(lookup.barcode)}
                  className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-xs text-neutral-500">{lookup.barcode}</p>
                    <Badge variant="outline" className={scanResultTone[lookup.scanResult]}>
                      {lookup.scanResult}
                    </Badge>
                  </div>
                  <p className="mt-2 font-medium text-neutral-950">{product?.name ?? "Unknown product"}</p>
                  <p className="mt-1 text-sm leading-6 text-neutral-500">{lookup.message}</p>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Current scan result</p>
            {scannedProduct ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-950">{scannedProduct.name}</p>
                    <p className="text-sm text-neutral-500">{scannedProduct.sku} · Stock {getStockAfterCart(scannedProduct, cartItems)}</p>
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
              <p className="mt-3 text-sm leading-6 text-neutral-500">No local product matched. API lookup stays blocked until contract exists.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Editable cart preview</CardTitle>
              <CardDescription>{retailRegisterSummary.registerCode} · {retailRegisterSummary.cashierName}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{cartLines.length} lines</Badge>
              <button
                type="button"
                onClick={() => setCartItems(initialCartItems)}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 overflow-x-auto">
          {cartLines.length > 0 ? (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-[0.12em] text-neutral-400">
                <tr>
                  <th className="py-3 pr-4">Item</th>
                  <th className="py-3 pr-4">Qty</th>
                  <th className="py-3 pr-4">Price</th>
                  <th className="py-3 pr-4">Discount</th>
                  <th className="py-3 pr-4">Tax incl.</th>
                  <th className="py-3 pr-4">Total</th>
                  <th className="py-3 pr-4">Action</th>
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
                    <td className="py-3 pr-4 text-neutral-700">{line.discountPercent}%</td>
                    <td className="py-3 pr-4 text-neutral-700">{formatRetailCurrency(line.taxIncluded)}</td>
                    <td className="py-3 pr-4 font-semibold text-neutral-950">{formatRetailCurrency(line.total)}</td>
                    <td className="py-3 pr-4">
                      <button type="button" onClick={() => removeItem(line.product.id)} className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
              Cart is empty. Scan something. Humanity invented commerce for this exact button.
            </div>
          )}

          {blockedCartLines.length > 0 ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {blockedCartLines.length} cart line is blocked because requested quantity exceeds current mock stock.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" aria-hidden="true" />
            Payment preview
          </CardTitle>
          <CardDescription>{retailRegisterSummary.shiftCode}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method) => (
              <button
                type="button"
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={classNames(
                  "rounded-lg border px-3 py-2 text-center text-sm font-medium transition",
                  paymentMethod === method
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
                )}
              >
                {method}
              </button>
            ))}
          </div>

          <div className="space-y-2 rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm">
            <div className="flex justify-between gap-4"><span>Subtotal</span><span>{formatRetailCurrency(subtotal)}</span></div>
            <div className="flex justify-between gap-4"><span>Discount</span><span>-{formatRetailCurrency(discountTotal)}</span></div>
            <div className="flex justify-between gap-4"><span>Tax included</span><span>{formatRetailCurrency(taxIncluded)}</span></div>
            <div className="flex justify-between gap-4"><span>Profit preview</span><span>{formatRetailCurrency(profitPreview)}</span></div>
            <div className="flex justify-between gap-4 border-t pt-2 font-bold text-neutral-950"><span>Payable</span><span>{formatRetailCurrency(payable)}</span></div>
          </div>

          <div className="rounded-lg border border-neutral-100 p-3 text-sm text-neutral-500">
            <p>Expected cash: {formatRetailCurrency(retailRegisterSummary.expectedCash)}</p>
            <p>Actual drawer: {formatRetailCurrency(retailRegisterSummary.cashDrawer)}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.12em] text-amber-600">
              {retailRegisterSummary.pendingVoidReview} void review pending
            </p>
          </div>

          <button
            type="button"
            disabled={!canCheckout}
            className="w-full rounded-lg bg-neutral-950 px-3 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {canCheckout ? `Ready for ${paymentMethod} mock payment` : "Checkout blocked in mock validation"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

function CatalogModule() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [selectedProductId, setSelectedProductId] = useState(retailProducts[0]?.id ?? "");

  const categories = useMemo(() => Array.from(new Set(retailProducts.map((product) => product.category))), []);
  const selectedProduct = getRetailProductById(selectedProductId) ?? retailProducts[0] ?? null;

  const filteredProducts = useMemo(() => {
    const normalized = normalizeSearch(searchQuery);

    return retailProducts.filter((product) => {
      const matchesSearch = !normalized || getProductSearchBlob(product).includes(normalized);
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      const matchesStock = stockFilter === "all" || product.status === stockFilter;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [categoryFilter, searchQuery, stockFilter]);

  const reorderProducts = retailProducts.filter((product) => product.stock <= product.reorderPoint);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
      <Card className="rounded-xl bg-white">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Product catalog control</CardTitle>
              <CardDescription>Search, filter, and inspect SKU readiness before product API exists.</CardDescription>
            </div>
            <Badge variant="outline">{filteredProducts.length}/{retailProducts.length} SKUs</Badge>
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
                <tr
                  key={product.id}
                  onClick={() => setSelectedProductId(product.id)}
                  className="cursor-pointer hover:bg-neutral-50"
                >
                  <td className="py-3 pr-4">
                    <div className="font-medium text-neutral-950">{product.name}</div>
                    <div className="text-xs text-neutral-500">{product.sku} · {product.category} · {product.brand}</div>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-neutral-600">{product.barcode}</td>
                  <td className="py-3 pr-4 text-neutral-700">{formatRetailCurrency(product.price)}</td>
                  <td className="py-3 pr-4 text-neutral-700">{formatRetailCurrency(product.cost)}</td>
                  <td className="py-3 pr-4 text-neutral-700">{getRetailProductMarginPercent(product)}%</td>
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
            <CardDescription>Click a product row to inspect operational fields.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedProduct ? (
              <>
                <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                  <p className="font-semibold text-neutral-950">{selectedProduct.name}</p>
                  <p className="mt-1 font-mono text-xs text-neutral-500">{selectedProduct.sku} · {selectedProduct.barcode}</p>
                </div>
                <div className="grid gap-2 text-sm text-neutral-600">
                  <div className="flex justify-between gap-4"><span>Supplier</span><span className="text-right">{getRetailSupplierName(selectedProduct.supplierId)}</span></div>
                  <div className="flex justify-between gap-4"><span>Tax</span><span>{selectedProduct.taxRatePercent}%</span></div>
                  <div className="flex justify-between gap-4"><span>Margin</span><span>{getRetailProductMarginPercent(selectedProduct)}%</span></div>
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
            {reorderProducts.map((product) => (
              <div key={product.id} className="rounded-lg border border-neutral-100 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-neutral-950">{product.name}</p>
                  <Badge variant="outline" className={stockStatusTone[product.status]}>{product.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-neutral-500">Need +{Math.max(product.reorderPoint * 2 - product.stock, 0)} {product.unit} to reach buffer.</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BarcodeModule() {
  const [lookupQuery, setLookupQuery] = useState("RTL-OIL-2L");
  const resultProduct = useMemo(() => findProductByQuery(lookupQuery), [lookupQuery]);
  const exactBarcodeLookup = retailBarcodeLookups.find((lookup) => lookup.productId === resultProduct?.id) ?? null;
  const duplicateBarcodeCount = resultProduct
    ? retailProducts.filter((product) => product.barcode === resultProduct.barcode).length
    : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" aria-hidden="true" />
            Lookup simulator
          </CardTitle>
          <CardDescription>Local product index. No scanner hardware mythology added yet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            value={lookupQuery}
            onChange={(event) => setLookupQuery(event.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-3 font-mono text-sm outline-none ring-blue-100 focus:ring-4"
            placeholder="Barcode, SKU, name, brand"
          />

          <div className="flex flex-wrap gap-2">
            {retailProducts.slice(0, 4).map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => setLookupQuery(product.sku)}
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
              >
                {product.sku}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-800">
            USB barcode scanners usually behave like keyboard input. So yes, the glamorous future is basically a very fast typist.
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle>Lookup result</CardTitle>
          <CardDescription>Validates found, warning, blocked, and not-found states.</CardDescription>
        </CardHeader>
        <CardContent>
          {resultProduct ? (
            <div className="grid gap-4 md:grid-cols-[1fr_0.7fr]">
              <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-950">{resultProduct.name}</p>
                    <p className="mt-1 font-mono text-xs text-neutral-500">{resultProduct.sku} · {resultProduct.barcode}</p>
                  </div>
                  <Badge variant="outline" className={stockStatusTone[resultProduct.status]}>{resultProduct.status}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-neutral-500">
                  {exactBarcodeLookup?.message ?? "Product exists locally, but no predefined scan message is attached."}
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-neutral-100 p-4 text-sm text-neutral-600">
                <div className="flex justify-between gap-4"><span>Duplicate barcode</span><span>{duplicateBarcodeCount > 1 ? "Yes" : "No"}</span></div>
                <div className="flex justify-between gap-4"><span>Can sell</span><span>{resultProduct.stock > 0 ? "Yes" : "Blocked"}</span></div>
                <div className="flex justify-between gap-4"><span>Stock</span><span>{resultProduct.stock}</span></div>
                <div className="flex justify-between gap-4"><span>Shelf</span><span>{resultProduct.shelfLocation}</span></div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
              No local product found. Later this becomes API-backed fuzzy search, because apparently stores enjoy having twelve names for the same item.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReceivingModule() {
  const [selectedReceivingId, setSelectedReceivingId] = useState(retailReceivings[1]?.id ?? retailReceivings[0]?.id ?? "");
  const [previewMode, setPreviewMode] = useState<ReceivingPreviewMode>("recorded");
  const selectedReceiving = retailReceivings.find((receiving) => receiving.id === selectedReceivingId) ?? retailReceivings[0];

  const previewItems = selectedReceiving.items.map((item) => {
    const product = getRetailProductById(item.productId);
    const previewReceivedQuantity = previewMode === "receive-all" ? item.orderedQuantity : item.receivedQuantity;

    return {
      ...item,
      product,
      previewReceivedQuantity,
      missingQuantity: item.orderedQuantity - previewReceivedQuantity,
      projectedStock: (product?.stock ?? 0) + previewReceivedQuantity,
    };
  });

  const totalPreviewCost = previewItems.reduce((total, item) => total + item.previewReceivedQuantity * item.unitCost, 0);

  return (
    <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle>Receiving queue</CardTitle>
          <CardDescription>Select purchase order mock state.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {retailReceivings.map((receiving) => (
            <button
              type="button"
              key={receiving.id}
              onClick={() => setSelectedReceivingId(receiving.id)}
              className={classNames(
                "w-full rounded-xl border p-3 text-left transition",
                selectedReceivingId === receiving.id ? "border-blue-300 bg-blue-50" : "border-neutral-100 bg-white hover:bg-neutral-50",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-neutral-950">{receiving.referenceNumber}</p>
                  <p className="mt-1 text-sm text-neutral-500">{getRetailSupplierName(receiving.supplierId)}</p>
                </div>
                <Badge variant="outline" className={receivingStatusTone[receiving.status]}>{receiving.status}</Badge>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{selectedReceiving.referenceNumber} stock intake preview</CardTitle>
              <CardDescription>{formatDate(selectedReceiving.expectedDate)} · {formatDate(selectedReceiving.receivedDate)}</CardDescription>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPreviewMode("recorded")} className={classNames("rounded-lg border px-3 py-2 text-sm", previewMode === "recorded" ? "border-blue-300 bg-blue-50 text-blue-700" : "border-neutral-200")}>Recorded</button>
              <button type="button" onClick={() => setPreviewMode("receive-all")} className={classNames("rounded-lg border px-3 py-2 text-sm", previewMode === "receive-all" ? "border-blue-300 bg-blue-50 text-blue-700" : "border-neutral-200")}>Receive all</button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 overflow-x-auto">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3"><p className="text-sm text-neutral-400">Preview cost</p><p className="mt-1 font-bold text-neutral-950">{formatRetailCurrency(totalPreviewCost)}</p></div>
            <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3"><p className="text-sm text-neutral-400">Supplier</p><p className="mt-1 font-bold text-neutral-950">{getRetailSupplierName(selectedReceiving.supplierId)}</p></div>
            <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3"><p className="text-sm text-neutral-400">Status</p><p className="mt-1 font-bold text-neutral-950">{selectedReceiving.status}</p></div>
          </div>

          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-[0.12em] text-neutral-400">
              <tr>
                <th className="py-3 pr-4">Product</th>
                <th className="py-3 pr-4">Ordered</th>
                <th className="py-3 pr-4">Preview receive</th>
                <th className="py-3 pr-4">Missing</th>
                <th className="py-3 pr-4">Projected stock</th>
                <th className="py-3 pr-4">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {previewItems.map((item) => (
                <tr key={item.productId}>
                  <td className="py-3 pr-4"><div className="font-medium text-neutral-950">{item.product?.name ?? "Unknown product"}</div><div className="text-xs text-neutral-500">{item.product?.sku ?? "No SKU"}</div></td>
                  <td className="py-3 pr-4 text-neutral-700">{item.orderedQuantity}</td>
                  <td className="py-3 pr-4 text-neutral-700">{item.previewReceivedQuantity}</td>
                  <td className="py-3 pr-4 font-semibold text-neutral-950">{item.missingQuantity}</td>
                  <td className="py-3 pr-4 text-neutral-700">{item.projectedStock}</td>
                  <td className="py-3 pr-4 text-neutral-700">{formatRetailCurrency(item.previewReceivedQuantity * item.unitCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function StockOpnameModule() {
  const [selectedSessionId, setSelectedSessionId] = useState(retailStockCountSessions[0]?.id ?? "");
  const [countOverrides, setCountOverrides] = useState<Record<string, number>>({});
  const selectedSession = retailStockCountSessions.find((session) => session.id === selectedSessionId) ?? retailStockCountSessions[0];

  const previewRows = selectedSession.items.map((item) => {
    const key = `${selectedSession.id}:${item.productId}`;
    const countedStock = countOverrides[key] ?? item.countedStock;
    return {
      ...item,
      key,
      countedStock,
      product: getRetailProductById(item.productId),
      variance: countedStock - item.systemStock,
    };
  });

  const totalVariance = previewRows.reduce((total, row) => total + row.variance, 0);
  const reviewCount = previewRows.filter((row) => row.variance !== 0).length;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="rounded-xl bg-white">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Interactive stock count preview</CardTitle>
              <CardDescription>Edit counted stock locally. No adjustment is saved.</CardDescription>
            </div>
            <select value={selectedSessionId} onChange={(event) => setSelectedSessionId(event.target.value)} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm">
              {retailStockCountSessions.map((session) => (
                <option key={session.id} value={session.id}>{session.code}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 overflow-x-auto">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={stockCountStatusTone[selectedSession.status]}>{selectedSession.status}</Badge>
            <span className="text-sm text-neutral-500">{selectedSession.locationScope} · {selectedSession.countedBy} · {formatDateTime(selectedSession.startedAt)}</span>
          </div>

          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-[0.12em] text-neutral-400">
              <tr>
                <th className="py-3 pr-4">Product</th>
                <th className="py-3 pr-4">System</th>
                <th className="py-3 pr-4">Counted input</th>
                <th className="py-3 pr-4">Variance</th>
                <th className="py-3 pr-4">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {previewRows.map((row) => (
                <tr key={row.key}>
                  <td className="py-3 pr-4"><div className="font-medium text-neutral-950">{row.product?.name ?? "Unknown product"}</div><div className="text-xs text-neutral-500">{row.product?.shelfLocation ?? "No shelf"}</div></td>
                  <td className="py-3 pr-4 text-neutral-700">{row.systemStock}</td>
                  <td className="py-3 pr-4">
                    <input
                      type="number"
                      min={0}
                      value={row.countedStock}
                      onChange={(event) => setCountOverrides((current) => ({ ...current, [row.key]: Number(event.target.value) }))}
                      className="w-24 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                    />
                  </td>
                  <td className={classNames("py-3 pr-4 font-semibold", row.variance < 0 ? "text-rose-700" : row.variance > 0 ? "text-emerald-700" : "text-neutral-700")}>{row.variance}</td>
                  <td className="py-3 pr-4 text-neutral-500">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" aria-hidden="true" />Variance review</CardTitle>
          <CardDescription>Preview only. Real stock movement is intentionally blocked.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3"><p className="text-sm text-neutral-400">Rows to review</p><p className="mt-1 text-2xl font-bold text-neutral-950">{reviewCount}</p></div>
            <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3"><p className="text-sm text-neutral-400">Net variance</p><p className="mt-1 text-2xl font-bold text-neutral-950">{totalVariance}</p></div>
          </div>
          {retailProducts.filter((product) => product.status !== "healthy").map((product) => (
            <div key={product.id} className="rounded-lg border border-neutral-100 p-3">
              <div className="flex items-center justify-between gap-3"><p className="font-medium text-neutral-950">{product.name}</p><Badge variant="outline" className={stockStatusTone[product.status]}>{product.status}</Badge></div>
              <p className="mt-1 text-sm text-neutral-500">Stock {product.stock} · Reorder {product.reorderPoint} · Shelf {product.shelfLocation}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ShelfManagementModule() {
  const [zoneFilter, setZoneFilter] = useState("all");
  const zones = useMemo(() => Array.from(new Set(retailShelfSlots.map((slot) => slot.zone))), []);
  const filteredSlots = retailShelfSlots.filter((slot) => zoneFilter === "all" || slot.zone === zoneFilter);

  return (
    <div className="space-y-4">
      <Card className="rounded-xl bg-white">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Shelf map preview</CardTitle>
              <CardDescription>Filter shelf zones and inspect utilization. Stock transfer logic is still planned.</CardDescription>
            </div>
            <select value={zoneFilter} onChange={(event) => setZoneFilter(event.target.value)} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm">
              <option value="all">All zones</option>
              {zones.map((zone) => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {filteredSlots.map((slot) => {
          const utilization = getShelfUtilizationPercent(slot.productIds, slot.capacity);

          return (
            <Card key={slot.id} className="rounded-xl bg-white">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" aria-hidden="true" />{slot.location}</CardTitle>
                    <CardDescription>{slot.zone} · {slot.category}</CardDescription>
                  </div>
                  <Badge variant="outline" className={shelfStatusTone[slot.status]}>{slot.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm text-neutral-600">
                  <div className="flex justify-between gap-4"><span>Capacity</span><span>{slot.capacity}</span></div>
                  <div className="flex justify-between gap-4"><span>Facing</span><span>{slot.facingCount}</span></div>
                  <div className="flex justify-between gap-4"><span>Utilization</span><span>{utilization}%</span></div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200"><div className="h-full rounded-full bg-neutral-900" style={{ width: `${utilization}%` }} /></div>
                </div>

                {slot.productIds.map((productId) => {
                  const product = getRetailProductById(productId);

                  return (
                    <div key={productId} className="rounded-lg border border-neutral-100 p-3">
                      <p className="font-medium text-neutral-950">{product?.name ?? "Unknown product"}</p>
                      <p className="mt-1 text-sm text-neutral-500">Stock {product?.stock ?? 0} · {product?.sku ?? "No SKU"}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function PromotionsModule() {
  const [activePromotionIds, setActivePromotionIds] = useState<string[]>(retailPromotions.filter((promotion) => promotion.isActive).map((promotion) => promotion.id));

  function togglePromotion(promotionId: string) {
    setActivePromotionIds((currentIds) => {
      if (currentIds.includes(promotionId)) {
        return currentIds.filter((id) => id !== promotionId);
      }

      return [...currentIds, promotionId];
    });
  }

  function getCategoryRevenue(category: string) {
    return retailTransactions.reduce((total, transaction) => {
      return total + getCartLines(transaction.items).reduce((lineTotal, line) => {
        if (line.product.category !== category) return lineTotal;
        return lineTotal + line.total;
      }, 0);
    }, 0);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {retailPromotions.map((promotion) => {
        const isActive = activePromotionIds.includes(promotion.id);
        const affectedProducts = retailProducts.filter((product) => product.category === promotion.targetCategory);
        const categoryRevenue = getCategoryRevenue(promotion.targetCategory);
        const estimatedLift = categoryRevenue * (promotion.estimatedLiftPercent / 100);
        const discountCost = categoryRevenue * (promotion.discountPercent / 100);
        const netImpact = estimatedLift - discountCost;

        return (
          <Card key={promotion.id} className="rounded-xl bg-white">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>{promotion.name}</CardTitle>
                  <CardDescription>{promotion.targetCategory}</CardDescription>
                </div>
                <Badge variant="outline" className={isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-neutral-200 bg-neutral-50 text-neutral-600"}>
                  {isActive ? "active" : "draft"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-neutral-600">{promotion.description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3"><p className="text-neutral-400">Discount</p><p className="mt-1 text-lg font-bold text-neutral-950">{promotion.discountPercent}%</p></div>
                <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3"><p className="text-neutral-400">Est. lift</p><p className="mt-1 text-lg font-bold text-neutral-950">{promotion.estimatedLiftPercent}%</p></div>
              </div>
              <div className="rounded-lg border border-neutral-100 p-3 text-sm text-neutral-500">{formatDate(promotion.startsAt)} → {formatDate(promotion.endsAt)}</div>
              <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm text-neutral-600">
                <div className="flex justify-between gap-4"><span>Base revenue</span><span>{formatRetailCurrency(categoryRevenue)}</span></div>
                <div className="flex justify-between gap-4"><span>Lift preview</span><span>{formatRetailCurrency(estimatedLift)}</span></div>
                <div className="flex justify-between gap-4"><span>Discount cost</span><span>{formatRetailCurrency(discountCost)}</span></div>
                <div className="flex justify-between gap-4 border-t pt-2 font-bold text-neutral-950"><span>Net impact</span><span>{formatRetailCurrency(netImpact)}</span></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {affectedProducts.map((product) => (
                  <span key={product.id} className="rounded-full border border-neutral-200 px-2 py-1 text-xs text-neutral-600">{product.name}</span>
                ))}
              </div>
              <button type="button" onClick={() => togglePromotion(promotion.id)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
                {isActive ? "Disable locally" : "Enable locally"}
              </button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function WorkflowReadiness() {
  return (
    <Card className="rounded-xl bg-white">
      <CardHeader>
        <CardTitle>Retail implementation readiness</CardTitle>
        <CardDescription>Interactive mock is advancing, but database and API are still intentionally blocked.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {retailWorkflowSteps.map((step) => (
          <div key={step.title} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
            <Badge variant="outline" className={workflowStatusTone[step.status]}>{step.status}</Badge>
            <p className="mt-3 font-medium text-neutral-950">{step.title}</p>
            <p className="mt-1 text-sm leading-6 text-neutral-500">{step.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CheckpointGrid({ moduleId }: RetailWorkspaceProps) {
  const workspace = retailWorkspaceModules[moduleId];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {workspace.checkpoints.map((checkpoint) => (
        <Card key={checkpoint} className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Foundation checkpoint</CardTitle>
            <CardDescription>Before API/schema integration</CardDescription>
          </CardHeader>
          <CardContent><p className="text-sm leading-6 text-neutral-600">{checkpoint}</p></CardContent>
        </Card>
      ))}
    </div>
  );
}

function LatestActivityPanel() {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><ReceiptText className="h-4 w-4" aria-hidden="true" />Latest cashier activity</CardTitle>
          <CardDescription>{getLatestTransactionLabel()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {retailTransactions.map((transaction) => (
            <div key={transaction.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
              <div className="flex items-center justify-between gap-3"><p className="font-medium text-neutral-900">{transaction.receiptNumber}</p><Badge variant="outline">{transaction.paymentMethod}</Badge></div>
              <p className="mt-1 text-sm text-neutral-500">{transaction.cashierName} · {formatRetailCurrency(getRetailTransactionTotal(transaction))}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle>Interactive mock strategy</CardTitle>
          <CardDescription>Retail surfaces now support local state without mutating external data.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
            <p className="font-medium text-neutral-950">Advanced now</p>
            <p className="mt-1 text-sm leading-6 text-neutral-500">Cashier cart edits, scanner lookup, catalog filters, receiving preview, stock count overrides, shelf utilization, and promo toggles.</p>
          </div>
          <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
            <p className="font-medium text-neutral-950">Still blocked</p>
            <p className="mt-1 text-sm leading-6 text-neutral-500">API routes, Prisma schema, migrations, stock mutations, payment mutations, and audit logs. Monster stays chained for now.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RetailModuleContent({ moduleId }: RetailWorkspaceProps) {
  switch (moduleId) {
    case "cashier":
      return <CashierModule />;
    case "catalog":
      return <CatalogModule />;
    case "barcode":
      return <BarcodeModule />;
    case "receiving":
      return <ReceivingModule />;
    case "stock-opname":
      return <StockOpnameModule />;
    case "shelf-management":
      return <ShelfManagementModule />;
    case "promotions":
      return <PromotionsModule />;
    default:
      return <CashierModule />;
  }
}

export default function RetailInteractiveWorkspace({ moduleId }: RetailWorkspaceProps) {
  return (
    <section className="space-y-6">
      <WorkspaceHeader moduleId={moduleId} />
      <RetailMetricsGrid />
      <RetailModuleContent moduleId={moduleId} />
      <LatestActivityPanel />
      <WorkflowReadiness />
      <CheckpointGrid moduleId={moduleId} />
    </section>
  );
}
