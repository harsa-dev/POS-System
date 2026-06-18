import { useState } from "react";

import { ArrowDown, ArrowUp, ClipboardList, RefreshCw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRetailCurrency } from "@/features/retail/core-system";
import { retailApi } from "@/lib/api/retail-api";

const stockStatusTone = {
  "in-stock": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "low-stock": "border-amber-200 bg-amber-50 text-amber-700",
  "out-of-stock": "border-rose-200 bg-rose-50 text-rose-700",
} as const;

const movementTypeTone = {
  in: "border-emerald-200 bg-emerald-50 text-emerald-700",
  out: "border-rose-200 bg-rose-50 text-rose-700",
} as const;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

type AdjustState = {
  productId: string;
  quantityDelta: number;
  reason: string;
  note: string;
};

const initialAdjust: AdjustState = { productId: "", quantityDelta: 0, reason: "count-correction", note: "" };

const ADJUST_REASONS = [
  { value: "count-correction", label: "Count correction" },
  { value: "damaged-write-off", label: "Damaged / write-off" },
  { value: "supplier-variance", label: "Supplier variance" },
  { value: "theft-shrinkage", label: "Theft / shrinkage" },
  { value: "found-stock", label: "Found stock" },
  { value: "other", label: "Other" },
];

export default function RetailStockOpnameApiWorkspace() {
  const queryClient = useQueryClient();
  const [adjust, setAdjust] = useState<AdjustState>(initialAdjust);
  const [adjustResult, setAdjustResult] = useState<string | null>(null);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["retail-products"],
    queryFn: () => retailApi.listProducts(),
  });

  const { data: movements = [], isLoading: movementsLoading, refetch: refetchMovements } = useQuery({
    queryKey: ["retail-stock-movements"],
    queryFn: () => retailApi.listStockMovements(50),
  });

  const adjustMutation = useMutation({
    mutationFn: () =>
      retailApi.adjustStock({
        productId: adjust.productId,
        quantityDelta: adjust.quantityDelta,
        reason: adjust.reason,
        note: adjust.note || undefined,
      }),
    onSuccess: (data) => {
      setAdjustResult(`Adjusted ${data.sku}: ${data.beforeQuantity} → ${data.afterQuantity} (delta ${data.quantityDelta >= 0 ? "+" : ""}${data.quantityDelta}).`);
      setAdjustError(null);
      setAdjust(initialAdjust);
      queryClient.invalidateQueries({ queryKey: ["retail-products"] });
      queryClient.invalidateQueries({ queryKey: ["retail-stock-movements"] });
    },
    onError: (err) => {
      setAdjustError(err instanceof Error ? err.message : "Adjustment failed.");
      setAdjustResult(null);
    },
  });

  const selectedProduct = products.find((p) => p.id === adjust.productId) ?? null;
  const canAdjust = !!adjust.productId && adjust.quantityDelta !== 0 && !!adjust.reason && !adjustMutation.isPending;

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
              Manual stock adjustment
            </CardTitle>
            <CardDescription>
              Correct discrepancies between physical count and system stock. MANAGER+ role required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700">Product</label>
              <select
                value={adjust.productId}
                onChange={(e) => setAdjust((prev) => ({ ...prev, productId: e.target.value }))}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none ring-blue-100 focus:ring-4"
              >
                <option value="">— Select product —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name} (stock: {p.currentStock})
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct ? (
              <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-neutral-950">{selectedProduct.name}</span>
                  <Badge variant="outline" className={stockStatusTone[selectedProduct.status]}>
                    {selectedProduct.status}
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-neutral-500">
                  <span>Current: {selectedProduct.currentStock}</span>
                  <span>Reorder: {selectedProduct.reorderPoint}</span>
                  <span>Cost: {formatRetailCurrency(selectedProduct.cost)}</span>
                </div>
              </div>
            ) : null}

            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700">Quantity delta</label>
              <p className="text-xs text-neutral-400">Positive to add stock, negative to remove.</p>
              <input
                type="number"
                value={adjust.quantityDelta}
                onChange={(e) => setAdjust((prev) => ({ ...prev, quantityDelta: Number(e.target.value) }))}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none ring-blue-100 focus:ring-4"
              />
              {selectedProduct && adjust.quantityDelta !== 0 ? (
                <p className="text-xs text-neutral-500 flex items-center gap-1">
                  {adjust.quantityDelta > 0 ? <ArrowUp className="h-3 w-3 text-emerald-600" /> : <ArrowDown className="h-3 w-3 text-rose-600" />}
                  {selectedProduct.currentStock} → {Math.max(0, selectedProduct.currentStock + adjust.quantityDelta)}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700">Reason</label>
              <select
                value={adjust.reason}
                onChange={(e) => setAdjust((prev) => ({ ...prev, reason: e.target.value }))}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none ring-blue-100 focus:ring-4"
              >
                {ADJUST_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700">Note (optional)</label>
              <input
                type="text"
                value={adjust.note}
                onChange={(e) => setAdjust((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="e.g. Physical count 2026-06-18"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none ring-blue-100 focus:ring-4"
              />
            </div>

            <button
              type="button"
              disabled={!canAdjust}
              onClick={() => adjustMutation.mutate()}
              className="w-full rounded-lg bg-neutral-950 px-3 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {adjustMutation.isPending ? "Submitting…" : "Submit adjustment"}
            </button>

            {adjustResult ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                {adjustResult}
              </div>
            ) : null}
            {adjustError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                {adjustError}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-white">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" aria-hidden="true" />
                  Current stock levels
                </CardTitle>
                <CardDescription>
                  {productsLoading ? "Loading…" : `${products.length} active SKUs`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-[0.12em] text-neutral-400">
                <tr>
                  <th className="py-3 pr-4">SKU</th>
                  <th className="py-3 pr-4">Product</th>
                  <th className="py-3 pr-4">Stock</th>
                  <th className="py-3 pr-4">Reorder at</th>
                  <th className="py-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="py-3 pr-4 font-mono text-xs text-neutral-600">{product.sku}</td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-neutral-950">{product.name}</div>
                      <div className="text-xs text-neutral-500">{product.shelfLocation}</div>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-neutral-950">{product.currentStock}</td>
                    <td className="py-3 pr-4 text-neutral-500">{product.reorderPoint}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className={stockStatusTone[product.status]}>
                        {product.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Recent stock movements</CardTitle>
              <CardDescription>
                {movementsLoading ? "Loading…" : `${movements.length} recent movements from the API`}
              </CardDescription>
            </div>
            <button
              type="button"
              onClick={() => refetchMovements()}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {movements.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
              No stock movements recorded yet. Complete a checkout or adjustment above.
            </div>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-[0.12em] text-neutral-400">
                <tr>
                  <th className="py-3 pr-4">Time</th>
                  <th className="py-3 pr-4">SKU</th>
                  <th className="py-3 pr-4">Product</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Reason</th>
                  <th className="py-3 pr-4">Qty</th>
                  <th className="py-3 pr-4">Before → After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="py-3 pr-4 text-xs text-neutral-400">{formatDateTime(movement.createdAt)}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-neutral-600">{movement.sku}</td>
                    <td className="py-3 pr-4 font-medium text-neutral-950">{movement.productName}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className={movementTypeTone[movement.type as keyof typeof movementTypeTone] ?? "border-neutral-200 bg-neutral-50 text-neutral-600"}>
                        {movement.type}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-neutral-500">{movement.reason}</td>
                    <td className="py-3 pr-4 font-semibold text-neutral-950">
                      {movement.type === "out" ? "-" : "+"}{movement.quantity}
                    </td>
                    <td className="py-3 pr-4 text-neutral-500">
                      {movement.beforeQuantity} → {movement.afterQuantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
