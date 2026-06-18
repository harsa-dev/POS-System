import { AlertTriangle, ClipboardCheck, ReceiptText, ShieldCheck, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { retailApi } from "@/lib/api/retail-api";

const severityTone = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-rose-200 bg-rose-50 text-rose-700",
} as const;

const movementTypeTone = {
  in: "border-emerald-200 bg-emerald-50 text-emerald-700",
  out: "border-rose-200 bg-rose-50 text-rose-700",
} as const;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function DashboardInsightGrid() {
  const { data: dashboard } = useQuery({
    queryKey: ["retail-dashboard"],
    queryFn: () => retailApi.getDashboard(),
  });

  if (!dashboard) return null;

  const insights = [
    {
      id: "revenue",
      title: "Today revenue preview",
      value: formatCurrency(dashboard.summary.todayRevenue),
      description: "Projected from retail checkout service and active products.",
      severity: "good" as const,
    },
    {
      id: "profit",
      title: "Gross profit preview",
      value: formatCurrency(dashboard.summary.grossProfit),
      description: "Margin from cost vs. sell price across active SKUs.",
      severity: dashboard.summary.grossProfit > 0 ? ("good" as const) : ("warning" as const),
    },
    {
      id: "stock-alerts",
      title: "Stock alerts",
      value: String(dashboard.summary.stockAlerts),
      description: "Products at or below reorder point. Review receiving queue.",
      severity: dashboard.summary.stockAlerts === 0 ? ("good" as const) : dashboard.summary.stockAlerts < 3 ? ("warning" as const) : ("critical" as const),
    },
    {
      id: "receiving",
      title: "Pending receiving",
      value: String(dashboard.summary.pendingReceiving),
      description: "Open supplier receiving orders not yet fully received.",
      severity: dashboard.summary.pendingReceiving === 0 ? ("good" as const) : ("info" as const),
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {insights.map((insight) => (
        <Card key={insight.id} className="rounded-xl bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardDescription>{insight.title}</CardDescription>
                <p className="mt-1 text-2xl font-bold text-neutral-950">{insight.value}</p>
              </div>
              <Badge variant="outline" className={severityTone[insight.severity]}>
                {insight.severity}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-neutral-500">{insight.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RecentSalesPanel() {
  const { data: sales = [] } = useQuery({
    queryKey: ["retail-sales"],
    queryFn: () => retailApi.listSales(10),
  });

  if (sales.length === 0) return null;

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalProfit = sales.reduce((sum, s) => sum + s.grossProfit, 0);

  return (
    <Card className="rounded-xl bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptText className="h-5 w-5" aria-hidden="true" />
          Recent sales
        </CardTitle>
        <CardDescription>
          Last {sales.length} transactions · {formatCurrency(totalRevenue)} revenue · {formatCurrency(totalProfit)} gross profit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {sales.map((sale) => (
          <div key={sale.id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm">
            <div>
              <span className="font-medium text-neutral-950">{sale.receiptNumber}</span>
              <span className="ml-2 text-neutral-400">{sale.paymentMethod}</span>
            </div>
            <div className="flex items-center gap-3 text-right">
              <span className="font-semibold text-neutral-950">{formatCurrency(sale.total)}</span>
              <Badge variant="outline" className={sale.status === "completed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-neutral-200 bg-neutral-50 text-neutral-600"}>
                {sale.status}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function InventoryRiskPanel() {
  const { data: risks = [] } = useQuery({
    queryKey: ["retail-inventory-risks"],
    queryFn: () => retailApi.listInventoryRisks(),
  });

  if (risks.length === 0) return (
    <Card className="rounded-xl bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          Inventory risk
        </CardTitle>
        <CardDescription>No products at or below reorder point.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          All SKUs are above their reorder point. Stock is healthy.
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="rounded-xl bg-white xl:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          Inventory risk — reorder suggestions
        </CardTitle>
        <CardDescription>{risks.length} SKUs at or below reorder point.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b text-xs uppercase tracking-[0.12em] text-neutral-400">
            <tr>
              <th className="py-3 pr-4">SKU</th>
              <th className="py-3 pr-4">Product</th>
              <th className="py-3 pr-4">Stock / Reorder</th>
              <th className="py-3 pr-4">Suggest order</th>
              <th className="py-3 pr-4">Est. cost</th>
              <th className="py-3 pr-4">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {risks.map((risk) => (
              <tr key={risk.productId}>
                <td className="py-3 pr-4 font-mono text-xs text-neutral-600">{risk.sku}</td>
                <td className="py-3 pr-4 font-medium text-neutral-950">{risk.name}</td>
                <td className="py-3 pr-4 text-neutral-700">{risk.currentStock} / {risk.reorderPoint}</td>
                <td className="py-3 pr-4 font-semibold text-neutral-950">+{risk.suggestedOrderQty}</td>
                <td className="py-3 pr-4 text-neutral-700">{formatCurrency(risk.estimatedCost)}</td>
                <td className="py-3 pr-4">
                  <Badge variant="outline" className={risk.currentStock <= 0 ? severityTone.critical : severityTone.warning}>
                    {risk.currentStock <= 0 ? "critical" : "warning"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function StockMovementPanel() {
  const { data: movements = [] } = useQuery({
    queryKey: ["retail-stock-movements"],
    queryFn: () => retailApi.listStockMovements(8),
  });

  if (movements.length === 0) return null;

  return (
    <Card className="rounded-xl bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          Recent stock movements
        </CardTitle>
        <CardDescription>Latest {movements.length} inventory mutations from the API.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {movements.map((m) => (
          <div key={m.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-neutral-950">{m.productName}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {m.sku} · {m.reason} · {formatDateTime(m.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-950">
                  {m.type === "out" ? "-" : "+"}{m.quantity}
                </span>
                <Badge variant="outline" className={movementTypeTone[m.type as keyof typeof movementTypeTone] ?? "border-neutral-200 bg-neutral-50 text-neutral-600"}>
                  {m.type}
                </Badge>
              </div>
            </div>
            <p className="mt-2 text-xs text-neutral-400">{m.beforeQuantity} → {m.afterQuantity}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ActivityTimelinePanel() {
  const { data: sales = [] } = useQuery({
    queryKey: ["retail-sales"],
    queryFn: () => retailApi.listSales(6),
  });
  const { data: movements = [] } = useQuery({
    queryKey: ["retail-stock-movements"],
    queryFn: () => retailApi.listStockMovements(6),
  });

  type TimelineEvent = {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    severity: "good" | "info" | "warning";
  };

  const events: TimelineEvent[] = [
    ...sales.map((s) => ({
      id: `sale-${s.id}`,
      title: `Sale ${s.receiptNumber}`,
      description: `${s.paymentMethod} · ${formatCurrency(s.total)} · ${s.itemCount} items`,
      timestamp: s.createdAt,
      severity: "good" as const,
    })),
    ...movements.map((m) => ({
      id: `mov-${m.id}`,
      title: `${m.type === "out" ? "Stock out" : "Stock in"} — ${m.sku}`,
      description: `${m.reason} · ${m.beforeQuantity} → ${m.afterQuantity}`,
      timestamp: m.createdAt,
      severity: (m.reason === "adjustment" ? "info" : m.type === "out" ? "warning" : "good") as "good" | "info" | "warning",
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6);

  if (events.length === 0) return null;

  return (
    <Card className="rounded-xl bg-white xl:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
          Activity timeline
        </CardTitle>
        <CardDescription>Sales and stock events merged from the API.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {events.map((event) => (
          <div key={event.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-neutral-950">{event.title}</p>
              <Badge variant="outline" className={severityTone[event.severity]}>{event.severity}</Badge>
            </div>
            <p className="mt-1 text-xs text-neutral-400">{formatDateTime(event.timestamp)}</p>
            <p className="mt-2 text-sm leading-6 text-neutral-500">{event.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RetailOperationsPanel() {
  return (
    <section className="space-y-6">
      <DashboardInsightGrid />

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <RecentSalesPanel />
        <StockMovementPanel />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <InventoryRiskPanel />
        <ActivityTimelinePanel />
      </div>
    </section>
  );
}
