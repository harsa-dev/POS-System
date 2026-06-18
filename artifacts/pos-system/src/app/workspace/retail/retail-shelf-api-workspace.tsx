import { Boxes, MapPin } from "lucide-react";
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
import { retailApi } from "@/lib/api/retail-api";

const stockStatusTone = {
  "in-stock": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "low-stock": "border-amber-200 bg-amber-50 text-amber-700",
  "out-of-stock": "border-rose-200 bg-rose-50 text-rose-700",
} as const;

function getShelfHealth(product: { currentStock: number; reorderPoint: number }) {
  if (product.currentStock <= 0) return { label: "empty", tone: "border-rose-200 bg-rose-50 text-rose-700" };
  if (product.currentStock <= product.reorderPoint) return { label: "needs-restock", tone: "border-amber-200 bg-amber-50 text-amber-700" };
  return { label: "healthy", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" };
}

type ShelfGroup = {
  zone: string;
  products: typeof import("@/lib/api/retail-api").retailApi extends { listProducts: (...args: any[]) => Promise<infer P> } ? P : never;
};

export default function RetailShelfApiWorkspace() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["retail-products"],
    queryFn: () => retailApi.listProducts(),
  });

  const shelfGroups = products.reduce<Record<string, typeof products>>((groups, product) => {
    const zone = product.shelfLocation.split("-")[0] ?? product.shelfLocation;
    if (!groups[zone]) groups[zone] = [];
    groups[zone]!.push(product);
    return groups;
  }, {});

  const zones = Object.keys(shelfGroups).sort();
  const totalSku = products.length;
  const healthyCnt = products.filter((p) => p.currentStock > p.reorderPoint).length;
  const restockCnt = products.filter((p) => p.currentStock > 0 && p.currentStock <= p.reorderPoint).length;
  const emptyCnt = products.filter((p) => p.currentStock <= 0).length;

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total SKUs", value: String(totalSku), tone: "border-neutral-200 bg-neutral-50 text-neutral-700" },
          { label: "Shelf zones", value: String(zones.length), tone: "border-blue-200 bg-blue-50 text-blue-700" },
          { label: "Healthy shelves", value: String(healthyCnt), tone: "border-emerald-200 bg-emerald-50 text-emerald-700" },
          { label: "Needs restock / empty", value: `${restockCnt + emptyCnt}`, tone: restockCnt + emptyCnt > 0 ? "border-amber-200 bg-amber-50 text-amber-700" : "border-neutral-200 bg-neutral-50 text-neutral-700" },
        ].map(({ label, value, tone }) => (
          <Card key={label} className="rounded-xl bg-white">
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <p className="text-2xl font-bold text-neutral-950">{value}</p>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className={tone}>{label}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <Card className="rounded-xl bg-white">
          <CardContent className="py-8 text-center text-sm text-neutral-500">Loading shelf data…</CardContent>
        </Card>
      ) : zones.length === 0 ? (
        <Card className="rounded-xl bg-white">
          <CardContent className="py-8 text-center text-sm text-neutral-500">
            No shelf locations assigned. Set shelfLocation on products via the catalog.
          </CardContent>
        </Card>
      ) : (
        zones.map((zone) => {
          const zoneProducts = shelfGroups[zone] ?? [];
          return (
            <Card key={zone} className="rounded-xl bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                  Zone {zone}
                </CardTitle>
                <CardDescription>
                  {zoneProducts.length} SKUs · {zoneProducts.filter((p) => p.currentStock > p.reorderPoint).length} healthy · {zoneProducts.filter((p) => p.currentStock <= p.reorderPoint).length} needs attention
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b text-xs uppercase tracking-[0.12em] text-neutral-400">
                    <tr>
                      <th className="py-3 pr-4">Shelf</th>
                      <th className="py-3 pr-4">SKU</th>
                      <th className="py-3 pr-4">Product</th>
                      <th className="py-3 pr-4">Category</th>
                      <th className="py-3 pr-4">Stock</th>
                      <th className="py-3 pr-4">Price</th>
                      <th className="py-3 pr-4">Shelf health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {zoneProducts.map((product) => {
                      const health = getShelfHealth(product);
                      return (
                        <tr key={product.id}>
                          <td className="py-3 pr-4 font-mono text-xs text-neutral-600">{product.shelfLocation}</td>
                          <td className="py-3 pr-4 font-mono text-xs text-neutral-600">{product.sku}</td>
                          <td className="py-3 pr-4">
                            <div className="font-medium text-neutral-950">{product.name}</div>
                            <div className="text-xs text-neutral-500">{product.brand}</div>
                          </td>
                          <td className="py-3 pr-4 text-neutral-500">{product.category}</td>
                          <td className="py-3 pr-4 font-semibold text-neutral-950">
                            {product.currentStock} {product.unit}
                          </td>
                          <td className="py-3 pr-4 text-neutral-700">{formatRetailCurrency(product.price)}</td>
                          <td className="py-3 pr-4">
                            <Badge variant="outline" className={health.tone}>{health.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          );
        })
      )}

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Boxes className="h-5 w-5" aria-hidden="true" />
            All products by shelf location
          </CardTitle>
          <CardDescription>Sorted by shelf location for physical walk-through.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-[0.12em] text-neutral-400">
              <tr>
                <th className="py-3 pr-4">Shelf</th>
                <th className="py-3 pr-4">SKU</th>
                <th className="py-3 pr-4">Product</th>
                <th className="py-3 pr-4">Stock / Reorder</th>
                <th className="py-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {[...products].sort((a, b) => a.shelfLocation.localeCompare(b.shelfLocation)).map((product) => (
                <tr key={product.id}>
                  <td className="py-3 pr-4 font-mono text-xs text-neutral-600">{product.shelfLocation}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-neutral-600">{product.sku}</td>
                  <td className="py-3 pr-4 font-medium text-neutral-950">{product.name}</td>
                  <td className="py-3 pr-4 text-neutral-700">{product.currentStock} / {product.reorderPoint}</td>
                  <td className="py-3 pr-4">
                    <Badge variant="outline" className={stockStatusTone[product.status]}>{product.status}</Badge>
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
