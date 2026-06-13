import {
  AlertTriangle,
  BadgePercent,
  Barcode,
  Boxes,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  PackageSearch,
  ReceiptText,
  ScanLine,
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
  type RetailCartItem,
  type RetailProduct,
  type RetailWorkspaceModuleId,
} from "@/features/retail/core-system";

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

type RetailWorkspaceProps = {
  moduleId: RetailWorkspaceModuleId;
};

type CartLine = {
  product: RetailProduct;
  quantity: number;
  discountPercent: number;
  gross: number;
  discount: number;
  total: number;
};

function getCartLines(items: readonly RetailCartItem[]): CartLine[] {
  return items.flatMap((item) => {
    const product = getRetailProductById(item.productId);

    if (!product) return [];

    const gross = product.price * item.quantity;
    const discount = gross * (item.discountPercent / 100);

    return [
      {
        product,
        quantity: item.quantity,
        discountPercent: item.discountPercent,
        gross,
        discount,
        total: gross - discount,
      },
    ];
  });
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

function WorkspaceHeader({ moduleId }: RetailWorkspaceProps) {
  const workspace = retailWorkspaceModules[moduleId];
  const Icon = moduleIcons[moduleId];

  return (
    <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-blue-200 text-blue-700">
          Retail mode foundation
        </Badge>
        <Badge variant="outline" className="border-neutral-300 text-neutral-600">
          Mock data only
        </Badge>
        <Badge variant="outline" className="border-amber-300 text-amber-700">
          API and schema intentionally untouched
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

function WorkflowReadiness() {
  return (
    <Card className="rounded-xl bg-white">
      <CardHeader>
        <CardTitle>Retail implementation readiness</CardTitle>
        <CardDescription>What is safe to build now, and what is intentionally blocked.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {retailWorkflowSteps.map((step) => (
          <div key={step.title} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
            <Badge variant="outline" className={workflowStatusTone[step.status]}>
              {step.status}
            </Badge>
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
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Foundation checkpoint
            </CardTitle>
            <CardDescription>Before API/schema integration</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-neutral-600">{checkpoint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CashierModule() {
  const activeTransaction = retailTransactions[0];
  const cartLines = getCartLines(activeTransaction.items);
  const subtotal = cartLines.reduce((total, line) => total + line.gross, 0);
  const discountTotal = cartLines.reduce((total, line) => total + line.discount, 0);
  const payable = cartLines.reduce((total, line) => total + line.total, 0);
  const lowStockCartLines = cartLines.filter((line) => line.product.status !== "healthy");

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.35fr_0.7fr]">
      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" aria-hidden="true" />
            Scan panel
          </CardTitle>
          <CardDescription>Mock scanner surface for barcode-first checkout.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Barcode input</p>
            <div className="mt-3 rounded-lg border bg-white px-3 py-3 font-mono text-sm text-neutral-700">
              8991001005001
            </div>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Scanner hardware is not connected yet. This field only defines the future cashier interaction.
            </p>
          </div>

          <div className="grid gap-3">
            {retailBarcodeLookups.map((lookup) => {
              const product = getRetailProductById(lookup.productId);

              return (
                <div key={lookup.barcode} className="rounded-lg border border-neutral-100 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-xs text-neutral-500">{lookup.barcode}</p>
                    <Badge variant="outline" className={scanResultTone[lookup.scanResult]}>
                      {lookup.scanResult}
                    </Badge>
                  </div>
                  <p className="mt-2 font-medium text-neutral-950">{product?.name ?? "Unknown product"}</p>
                  <p className="mt-1 text-sm leading-6 text-neutral-500">{lookup.message}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Active cart</CardTitle>
              <CardDescription>{activeTransaction.receiptNumber} · {activeTransaction.cashierName}</CardDescription>
            </div>
            <Badge variant="outline">{cartLines.length} lines</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-[0.12em] text-neutral-400">
              <tr>
                <th className="py-3 pr-4">Item</th>
                <th className="py-3 pr-4">Qty</th>
                <th className="py-3 pr-4">Price</th>
                <th className="py-3 pr-4">Discount</th>
                <th className="py-3 pr-4">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {cartLines.map((line) => (
                <tr key={line.product.id}>
                  <td className="py-3 pr-4">
                    <div className="font-medium text-neutral-950">{line.product.name}</div>
                    <div className="text-xs text-neutral-500">{line.product.sku} · {line.product.barcode}</div>
                  </td>
                  <td className="py-3 pr-4 text-neutral-700">{line.quantity}</td>
                  <td className="py-3 pr-4 text-neutral-700">{formatRetailCurrency(line.product.price)}</td>
                  <td className="py-3 pr-4 text-neutral-700">{line.discountPercent}%</td>
                  <td className="py-3 pr-4 font-semibold text-neutral-950">{formatRetailCurrency(line.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {lowStockCartLines.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {lowStockCartLines.length} cart item needs stock attention before real checkout mutation is added.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" aria-hidden="true" />
            Payment summary
          </CardTitle>
          <CardDescription>{retailRegisterSummary.registerCode} · {retailRegisterSummary.shiftCode}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm">
            <div className="flex justify-between gap-4"><span>Subtotal</span><span>{formatRetailCurrency(subtotal)}</span></div>
            <div className="flex justify-between gap-4"><span>Discount</span><span>-{formatRetailCurrency(discountTotal)}</span></div>
            <div className="flex justify-between gap-4 border-t pt-2 font-bold text-neutral-950"><span>Payable</span><span>{formatRetailCurrency(payable)}</span></div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {["Cash", "QRIS", "Card", "Transfer"].map((method) => (
              <div key={method} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-center text-sm font-medium text-neutral-700">
                {method}
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-neutral-100 p-3">
            <p className="text-sm font-medium text-neutral-950">Cash drawer mock</p>
            <p className="mt-1 text-sm text-neutral-500">Expected: {formatRetailCurrency(retailRegisterSummary.expectedCash)}</p>
            <p className="text-sm text-neutral-500">Actual: {formatRetailCurrency(retailRegisterSummary.cashDrawer)}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.12em] text-amber-600">
              {retailRegisterSummary.pendingVoidReview} void review pending
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CatalogModule() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
      <Card className="rounded-xl bg-white">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Product catalog control</CardTitle>
              <CardDescription>SKU, barcode, cost, margin, tax, supplier, stock, and shelf visibility.</CardDescription>
            </div>
            <Badge variant="outline">{retailProducts.length} SKUs</Badge>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-[0.12em] text-neutral-400">
              <tr>
                <th className="py-3 pr-4">Product</th>
                <th className="py-3 pr-4">Barcode</th>
                <th className="py-3 pr-4">Price</th>
                <th className="py-3 pr-4">Cost</th>
                <th className="py-3 pr-4">Margin</th>
                <th className="py-3 pr-4">Tax</th>
                <th className="py-3 pr-4">Stock</th>
                <th className="py-3 pr-4">Shelf</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {retailProducts.map((product) => (
                <tr key={product.id}>
                  <td className="py-3 pr-4">
                    <div className="font-medium text-neutral-950">{product.name}</div>
                    <div className="text-xs text-neutral-500">{product.sku} · {product.category} · {product.brand}</div>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-neutral-600">{product.barcode}</td>
                  <td className="py-3 pr-4 text-neutral-700">{formatRetailCurrency(product.price)}</td>
                  <td className="py-3 pr-4 text-neutral-700">{formatRetailCurrency(product.cost)}</td>
                  <td className="py-3 pr-4 text-neutral-700">{getRetailProductMarginPercent(product)}%</td>
                  <td className="py-3 pr-4 text-neutral-700">{product.taxRatePercent}%</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${stockStatusTone[product.status]}`}>
                      {product.stock}/{product.shelfCapacity} {product.unit}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-neutral-700">{product.shelfLocation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle>Supplier relation preview</CardTitle>
          <CardDescription>Still mock-only. No supplier API yet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {retailProducts.slice(0, 4).map((product) => (
            <div key={product.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
              <p className="font-medium text-neutral-950">{product.name}</p>
              <p className="mt-1 text-sm text-neutral-500">{getRetailSupplierName(product.supplierId)}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-neutral-400">{product.category}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function BarcodeModule() {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" aria-hidden="true" />
            Lookup simulator
          </CardTitle>
          <CardDescription>Local-only barcode and SKU matching surface.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Search input mock</p>
            <div className="mt-3 rounded-lg border bg-white px-3 py-3 font-mono text-sm text-neutral-700">
              RTL-OIL-2L / 8991002002007
            </div>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Later this should support barcode scan, SKU typing, fuzzy product search, and duplicate barcode validation.
            </p>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-800">
            Scanner note: common USB scanners usually act like keyboard input. No special hardware integration should be added before basic lookup flow is stable.
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle>Lookup result states</CardTitle>
          <CardDescription>Found, warning, and blocked states before real inventory mutation.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {retailBarcodeLookups.map((lookup) => {
            const product = getRetailProductById(lookup.productId);

            return (
              <div key={lookup.barcode} className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                <Badge variant="outline" className={scanResultTone[lookup.scanResult]}>
                  {lookup.scanResult}
                </Badge>
                <p className="mt-3 font-medium text-neutral-950">{product?.name ?? "Unknown product"}</p>
                <p className="mt-1 font-mono text-xs text-neutral-500">{lookup.barcode}</p>
                <p className="mt-3 text-sm leading-6 text-neutral-500">{lookup.message}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function ReceivingModule() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {retailReceivings.map((receiving) => (
        <Card key={receiving.id} className="rounded-xl bg-white">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{receiving.referenceNumber}</CardTitle>
                <CardDescription>{getRetailSupplierName(receiving.supplierId)}</CardDescription>
              </div>
              <Badge variant="outline" className={receivingStatusTone[receiving.status]}>
                {receiving.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm text-neutral-600">
              <div className="flex justify-between gap-4"><span>Expected</span><span>{formatDate(receiving.expectedDate)}</span></div>
              <div className="flex justify-between gap-4"><span>Received</span><span>{formatDate(receiving.receivedDate)}</span></div>
              <div className="flex justify-between gap-4"><span>Total cost</span><span>{formatRetailCurrency(receiving.totalCost)}</span></div>
            </div>

            <div className="space-y-2">
              {receiving.items.map((item) => {
                const product = getRetailProductById(item.productId);
                const missing = item.orderedQuantity - item.receivedQuantity;

                return (
                  <div key={item.productId} className="rounded-lg border border-neutral-100 p-3">
                    <p className="font-medium text-neutral-950">{product?.name ?? "Unknown product"}</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      Ordered {item.orderedQuantity} · Received {item.receivedQuantity} · Missing {missing}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">Unit cost: {formatRetailCurrency(item.unitCost)}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StockOpnameModule() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        {retailStockCountSessions.map((session) => (
          <Card key={session.id} className="rounded-xl bg-white">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>{session.code}</CardTitle>
                  <CardDescription>{session.locationScope} · {session.countedBy} · {formatDateTime(session.startedAt)}</CardDescription>
                </div>
                <Badge variant="outline" className={stockCountStatusTone[session.status]}>
                  {session.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b text-xs uppercase tracking-[0.12em] text-neutral-400">
                  <tr>
                    <th className="py-3 pr-4">Product</th>
                    <th className="py-3 pr-4">System</th>
                    <th className="py-3 pr-4">Counted</th>
                    <th className="py-3 pr-4">Variance</th>
                    <th className="py-3 pr-4">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {session.items.map((item) => {
                    const product = getRetailProductById(item.productId);

                    return (
                      <tr key={item.productId}>
                        <td className="py-3 pr-4">
                          <div className="font-medium text-neutral-950">{product?.name ?? "Unknown product"}</div>
                          <div className="text-xs text-neutral-500">{product?.shelfLocation ?? "No shelf"}</div>
                        </td>
                        <td className="py-3 pr-4 text-neutral-700">{item.systemStock}</td>
                        <td className="py-3 pr-4 text-neutral-700">{item.countedStock}</td>
                        <td className="py-3 pr-4 font-semibold text-neutral-950">{item.variance}</td>
                        <td className="py-3 pr-4 text-neutral-500">{item.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            Count priority
          </CardTitle>
          <CardDescription>Products that need physical checking first.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {retailProducts.filter((product) => product.status !== "healthy").map((product) => (
            <div key={product.id} className="rounded-lg border border-neutral-100 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-neutral-950">{product.name}</p>
                <Badge variant="outline" className={stockStatusTone[product.status]}>
                  {product.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-neutral-500">
                Stock {product.stock} · Reorder {product.reorderPoint} · Shelf {product.shelfLocation}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ShelfManagementModule() {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {retailShelfSlots.map((slot) => (
        <Card key={slot.id} className="rounded-xl bg-white">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" aria-hidden="true" />
                  {slot.location}
                </CardTitle>
                <CardDescription>{slot.zone} · {slot.category}</CardDescription>
              </div>
              <Badge variant="outline" className={shelfStatusTone[slot.status]}>
                {slot.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm text-neutral-600">
              <div className="flex justify-between gap-4"><span>Capacity</span><span>{slot.capacity}</span></div>
              <div className="flex justify-between gap-4"><span>Facing</span><span>{slot.facingCount}</span></div>
              <div className="flex justify-between gap-4"><span>Products</span><span>{slot.productIds.length}</span></div>
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
      ))}
    </div>
  );
}

function PromotionsModule() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {retailPromotions.map((promotion) => (
        <Card key={promotion.id} className="rounded-xl bg-white">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{promotion.name}</CardTitle>
                <CardDescription>{promotion.targetCategory}</CardDescription>
              </div>
              <Badge variant="outline" className={promotion.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-neutral-200 bg-neutral-50 text-neutral-600"}>
                {promotion.isActive ? "active" : "draft"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-neutral-600">{promotion.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <p className="text-neutral-400">Discount</p>
                <p className="mt-1 text-lg font-bold text-neutral-950">{promotion.discountPercent}%</p>
              </div>
              <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <p className="text-neutral-400">Est. lift</p>
                <p className="mt-1 text-lg font-bold text-neutral-950">{promotion.estimatedLiftPercent}%</p>
              </div>
            </div>
            <div className="rounded-lg border border-neutral-100 p-3 text-sm text-neutral-500">
              {formatDate(promotion.startsAt)} → {formatDate(promotion.endsAt)}
            </div>
          </CardContent>
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
          <CardTitle className="flex items-center gap-2 text-base">
            <ReceiptText className="h-4 w-4" aria-hidden="true" />
            Latest cashier activity
          </CardTitle>
          <CardDescription>{getLatestTransactionLabel()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {retailTransactions.map((transaction) => (
            <div key={transaction.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-neutral-900">{transaction.receiptNumber}</p>
                <Badge variant="outline">{transaction.paymentMethod}</Badge>
              </div>
              <p className="mt-1 text-sm text-neutral-500">
                {transaction.cashierName} · {formatRetailCurrency(getRetailTransactionTotal(transaction))}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle>Module content strategy</CardTitle>
          <CardDescription>Retail surfaces are now module-specific, but still database-safe.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
            <p className="font-medium text-neutral-950">Frontend now</p>
            <p className="mt-1 text-sm leading-6 text-neutral-500">Shape screens, validate flow, test route boundaries, and refine operator UX using deterministic mock data.</p>
          </div>
          <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
            <p className="font-medium text-neutral-950">Backend later</p>
            <p className="mt-1 text-sm leading-6 text-neutral-500">Only after screens stabilize: write API contracts, Prisma schema, seed data, mutations, and audit behavior.</p>
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

export default function RetailWorkspace({ moduleId }: RetailWorkspaceProps) {
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