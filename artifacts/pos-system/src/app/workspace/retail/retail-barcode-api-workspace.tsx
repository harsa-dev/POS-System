import { useState } from "react";

import { AlertTriangle, Barcode, CheckCircle2, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRetailCurrency } from "@/features/retail/core-system";
import { retailApi, type RetailApiProduct } from "@/lib/api/retail-api";

const stockStatusTone = {
  "in-stock": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "low-stock": "border-amber-200 bg-amber-50 text-amber-700",
  "out-of-stock": "border-rose-200 bg-rose-50 text-rose-700",
} as const;

type LookupResult = {
  product: RetailApiProduct;
  canSell: boolean;
  warning?: string;
};

export default function RetailBarcodeApiWorkspace() {
  const [scanInput, setScanInput] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["retail-products"],
    queryFn: () => retailApi.listProducts(),
  });

  async function handleLookup(code: string) {
    const trimmed = code.trim();
    if (!trimmed) return;
    setIsLookingUp(true);
    setLookupError(null);
    setResult(null);
    setSubmitted(trimmed);
    try {
      const data = await retailApi.lookupBarcode(trimmed);
      setResult(data);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "Lookup failed.");
    } finally {
      setIsLookingUp(false);
    }
  }

  return (
    <section className="space-y-6">
      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Barcode className="h-5 w-5" aria-hidden="true" />
            Barcode / SKU lookup
          </CardTitle>
          <CardDescription>
            Scan or type a barcode, SKU, or product name to look up live stock and pricing from the API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup(scanInput)}
              placeholder="Barcode / SKU / product name"
              className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 font-mono text-sm outline-none ring-blue-100 focus:ring-4"
            />
            <button
              type="button"
              onClick={() => handleLookup(scanInput)}
              disabled={isLookingUp || !scanInput.trim()}
              className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-neutral-300"
            >
              {isLookingUp ? "Scanning…" : "Scan"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {products.slice(0, 6).map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  setScanInput(product.barcode);
                  handleLookup(product.barcode);
                }}
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
              >
                {product.sku}
              </button>
            ))}
          </div>

          {lookupError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              No product matched &ldquo;{submitted}&rdquo;. {lookupError}
            </div>
          ) : result ? (
            <div className="space-y-3 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-neutral-950">{result.product.name}</p>
                  <p className="text-sm text-neutral-500">
                    {result.product.sku} · {result.product.brand} · {result.product.category}
                  </p>
                </div>
                <Badge variant="outline" className={stockStatusTone[result.product.status]}>
                  {result.product.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                {[
                  { label: "Price", value: formatRetailCurrency(result.product.price) },
                  { label: "Stock", value: `${result.product.currentStock} ${result.product.unit}` },
                  { label: "Shelf", value: result.product.shelfLocation },
                  { label: "Tax rate", value: `${result.product.taxRatePercent}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border border-neutral-100 bg-white p-3">
                    <p className="text-xs text-neutral-500">{label}</p>
                    <p className="mt-1 font-semibold text-neutral-950">{value}</p>
                  </div>
                ))}
              </div>

              {result.warning ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {result.warning}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" /> Ready to sell
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" aria-hidden="true" />
            All active SKUs
          </CardTitle>
          <CardDescription>
            {isLoading ? "Loading…" : `${products.length} active SKUs from the API.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-[0.12em] text-neutral-400">
              <tr>
                <th className="py-3 pr-4">SKU</th>
                <th className="py-3 pr-4">Product</th>
                <th className="py-3 pr-4">Barcode</th>
                <th className="py-3 pr-4">Stock</th>
                <th className="py-3 pr-4">Price</th>
                <th className="py-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="py-3 pr-4 font-mono text-xs text-neutral-600">{product.sku}</td>
                  <td className="py-3 pr-4">
                    <div className="font-medium text-neutral-950">{product.name}</div>
                    <div className="text-xs text-neutral-500">
                      {product.brand} · {product.category}
                    </div>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-neutral-600">{product.barcode}</td>
                  <td className="py-3 pr-4 text-neutral-700">
                    {product.currentStock} {product.unit}
                  </td>
                  <td className="py-3 pr-4 text-neutral-700">{formatRetailCurrency(product.price)}</td>
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
    </section>
  );
}
