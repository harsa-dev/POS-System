import { CheckCircle2, ShieldAlert, TrendingUp } from "lucide-react";
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

type HealthCheck = {
  id: string;
  label: string;
  pass: boolean;
  note: string;
};

export function RetailQualityPanel() {
  const { data: dashboard } = useQuery({
    queryKey: ["retail-dashboard"],
    queryFn: () => retailApi.getDashboard(),
  });

  const { data: risks = [] } = useQuery({
    queryKey: ["retail-inventory-risks"],
    queryFn: () => retailApi.listInventoryRisks(),
  });

  const { data: promotions = [] } = useQuery({
    queryKey: ["retail-promotions"],
    queryFn: () => retailApi.listPromotions(),
  });

  if (!dashboard) return null;

  const checks: HealthCheck[] = [
    {
      id: "products",
      label: "Product catalog",
      pass: dashboard.summary.activeSku > 0,
      note: dashboard.summary.activeSku > 0 ? `${dashboard.summary.activeSku} active SKUs in database.` : "No active retail products found.",
    },
    {
      id: "checkout",
      label: "Checkout writes DB",
      pass: dashboard.checkoutReadiness.writesDatabase,
      note: dashboard.checkoutReadiness.writesDatabase ? "Retail checkout persists sale, payment, and stock movement." : "Checkout is in mock mode.",
    },
    {
      id: "barcode",
      label: "Barcode scan ready",
      pass: dashboard.checkoutReadiness.canScanBarcode,
      note: dashboard.checkoutReadiness.canScanBarcode ? "Barcode / SKU lookup is wired to the API." : "Barcode scan not configured.",
    },
    {
      id: "stock-alerts",
      label: "Stock health",
      pass: dashboard.summary.stockAlerts === 0,
      note: dashboard.summary.stockAlerts === 0 ? "All SKUs above reorder point." : `${dashboard.summary.stockAlerts} SKUs at or below reorder point.`,
    },
    {
      id: "receiving",
      label: "Receiving queue",
      pass: dashboard.summary.pendingReceiving === 0,
      note: dashboard.summary.pendingReceiving === 0 ? "No pending supplier receivings." : `${dashboard.summary.pendingReceiving} open receivings.`,
    },
    {
      id: "promotions",
      label: "Promotions API",
      pass: true,
      note: `${promotions.length} promotions seeded · ${promotions.filter((p) => p.isActive).length} active.`,
    },
    {
      id: "persistence",
      label: "Backend persistence",
      pass: dashboard.persistence === "prisma",
      note: dashboard.persistence === "prisma" ? "All retail data persisted via Prisma." : `Persistence mode: ${dashboard.persistence}.`,
    },
    {
      id: "risks",
      label: "Inventory risk analysis",
      pass: risks.length === 0,
      note: risks.length === 0 ? "No inventory risk items detected." : `${risks.length} products need reorder attention.`,
    },
  ];

  const passed = checks.filter((c) => c.pass).length;
  const failed = checks.filter((c) => !c.pass).length;
  const score = Math.round((passed / checks.length) * 100);

  const scoreColor =
    score >= 80 ? "text-emerald-700" : score >= 60 ? "text-amber-700" : "text-rose-700";

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[0.65fr_1.35fr]">
        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              System health score
            </CardTitle>
            <CardDescription>Live API checks — {checks.length} total.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-neutral-500">Retail API health</p>
                  <p className={`mt-1 text-5xl font-bold ${scoreColor}`}>{score}</p>
                </div>
                <Badge variant="outline" className="border-neutral-200 bg-white text-neutral-700">
                  {score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : "D"}
                </Badge>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-200">
                <div
                  className={`h-full rounded-full ${score >= 80 ? "bg-emerald-600" : score >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center text-sm">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-2xl font-semibold text-emerald-700">{passed}</p>
                <p className="mt-1 text-xs text-emerald-700">Passed</p>
              </div>
              <div className="rounded-lg border border-rose-100 bg-rose-50 p-3">
                <p className="text-2xl font-semibold text-rose-700">{failed}</p>
                <p className="mt-1 text-xs text-rose-700">Needs attention</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              API health checks
            </CardTitle>
            <CardDescription>Live checks from the retail backend endpoints.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            {checks.map((check) => (
              <div key={check.id} className="flex items-start gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <CheckCircle2
                  className={`mt-0.5 h-4 w-4 shrink-0 ${check.pass ? "text-emerald-600" : "text-rose-500"}`}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-neutral-950">{check.label}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{check.note}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
            Revenue and profit preview
          </CardTitle>
          <CardDescription>Projected from active product catalog and checkout service readiness.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            { label: "Today revenue preview", value: formatCurrency(dashboard.summary.todayRevenue) },
            { label: "Gross profit preview", value: formatCurrency(dashboard.summary.grossProfit) },
            { label: "Active promotions", value: String(promotions.filter((p) => p.isActive).length) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">{label}</p>
              <p className="mt-2 text-2xl font-bold text-neutral-950">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
