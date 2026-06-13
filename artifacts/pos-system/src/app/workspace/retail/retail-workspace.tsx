import {
  AlertTriangle,
  BadgePercent,
  Barcode,
  Boxes,
  ClipboardList,
  PackageSearch,
  ReceiptText,
  ShoppingCart,
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
  getRetailTransactionTotal,
  retailMetrics,
  retailProducts,
  retailPromotions,
  retailReceivings,
  retailSuppliers,
  retailTransactions,
  retailWorkspaceModules,
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

type RetailWorkspaceProps = {
  moduleId: RetailWorkspaceModuleId;
};

function getSupplierName(supplierId: string) {
  return retailSuppliers.find((supplier) => supplier.id === supplierId)?.name ?? "Unknown supplier";
}

function getLatestTransactionLabel() {
  const latest = retailTransactions[0];

  if (!latest) return "No transaction";

  return `${latest.receiptNumber} · ${formatRetailCurrency(getRetailTransactionTotal(latest))}`;
}

export default function RetailWorkspace({ moduleId }: RetailWorkspaceProps) {
  const workspace = retailWorkspaceModules[moduleId];
  const Icon = moduleIcons[moduleId];
  const stockAlerts = retailProducts.filter((product) => product.status !== "healthy");

  return (
    <section className="space-y-6">
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="rounded-xl bg-white">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Retail products</CardTitle>
                <CardDescription>SKU, barcode, price, stock, shelf, and supplier mock data.</CardDescription>
              </div>
              <Badge variant="outline">{retailProducts.length} SKUs</Badge>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-[0.12em] text-neutral-400">
                <tr>
                  <th className="py-3 pr-4">Product</th>
                  <th className="py-3 pr-4">Barcode</th>
                  <th className="py-3 pr-4">Price</th>
                  <th className="py-3 pr-4">Stock</th>
                  <th className="py-3 pr-4">Shelf</th>
                  <th className="py-3 pr-4">Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {retailProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-neutral-950">{product.name}</div>
                      <div className="text-xs text-neutral-500">{product.sku} · {product.category}</div>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-neutral-600">{product.barcode}</td>
                    <td className="py-3 pr-4 text-neutral-700">{formatRetailCurrency(product.price)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${stockStatusTone[product.status]}`}>
                        {product.stock} {product.unit}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-neutral-700">{product.shelfLocation}</td>
                    <td className="py-3 pr-4 text-neutral-700">{getSupplierName(product.supplierId)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="space-y-4">
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
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Stock alerts
              </CardTitle>
              <CardDescription>Mock alerts before real stock movement exists.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stockAlerts.map((product) => (
                <div key={product.id} className="rounded-lg border border-neutral-100 p-3">
                  <p className="font-medium text-neutral-900">{product.name}</p>
                  <p className="mt-1 text-sm text-neutral-500">
                    Current: {product.stock} · Reorder point: {product.reorderPoint}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-xl bg-white lg:col-span-2">
          <CardHeader>
            <CardTitle>Receiving queue</CardTitle>
            <CardDescription>Supplier purchase order intake preview.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {retailReceivings.map((receiving) => (
              <div key={receiving.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <p className="font-medium text-neutral-900">{receiving.referenceNumber}</p>
                <p className="mt-1 text-sm text-neutral-500">{getSupplierName(receiving.supplierId)}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.12em] text-neutral-400">{receiving.status}</p>
                <p className="mt-1 text-sm text-neutral-600">{formatRetailCurrency(receiving.totalCost)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle>Promotions</CardTitle>
            <CardDescription>Frontend-only campaign preview.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {retailPromotions.map((promotion) => (
              <div key={promotion.id} className="rounded-lg border border-neutral-100 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-neutral-900">{promotion.name}</p>
                  <Badge variant="outline">{promotion.discountPercent}%</Badge>
                </div>
                <p className="mt-1 text-sm leading-6 text-neutral-500">{promotion.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {workspace.checkpoints.map((checkpoint) => (
          <Card key={checkpoint} className="rounded-xl bg-white">
            <CardHeader>
              <CardTitle className="text-base">Foundation checkpoint</CardTitle>
              <CardDescription>Before API/schema integration</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-neutral-600">{checkpoint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
