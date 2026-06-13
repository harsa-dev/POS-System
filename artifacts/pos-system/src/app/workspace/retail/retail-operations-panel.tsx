import {
  AlertTriangle,
  ClipboardCheck,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
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
  retailActivityTimeline,
  retailDailyReport,
  retailInventoryRiskReport,
  retailManagerReviewQueue,
  retailOperationInsights,
  retailReceiptPreview,
  type RetailOperationSeverity,
} from "@/features/retail/core-system";

const severityTone: Record<RetailOperationSeverity, string> = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-rose-200 bg-rose-50 text-rose-700",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function OperationInsightGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {retailOperationInsights.map((insight) => (
        <Card key={insight.id} className="rounded-xl bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardDescription>{insight.title}</CardDescription>
                <CardTitle className="mt-1 text-2xl">{insight.value}</CardTitle>
              </div>
              <Badge variant="outline" className={severityTone[insight.severity]}>
                {insight.severity}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-6 text-neutral-500">{insight.description}</p>
            <p className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-xs leading-5 text-neutral-600">
              {insight.action}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DailyReportPanel() {
  const reportRows = [
    ["Business date", retailDailyReport.businessDate],
    ["Paid transactions", String(retailDailyReport.paidTransactionCount)],
    ["Items sold", String(retailDailyReport.itemSoldCount)],
    ["Average basket", formatRetailCurrency(retailDailyReport.averageBasket)],
    ["Discount total", formatRetailCurrency(retailDailyReport.discountTotal)],
    ["Tax included", formatRetailCurrency(retailDailyReport.taxIncluded)],
    ["Gross profit", formatRetailCurrency(retailDailyReport.grossProfit)],
    ["Register variance", formatRetailCurrency(retailDailyReport.registerVariance)],
  ] as const;

  return (
    <Card className="rounded-xl bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" aria-hidden="true" />
          Daily retail report mock
        </CardTitle>
        <CardDescription>Sales, margin, discount, tax, and register preview. Still frontend-only, mercifully.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm text-neutral-600">
        {reportRows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
            <span>{label}</span>
            <span className="font-semibold text-neutral-950">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ReceiptPreviewPanel() {
  return (
    <Card className="rounded-xl bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptText className="h-5 w-5" aria-hidden="true" />
          Receipt preview
        </CardTitle>
        <CardDescription>
          {retailReceiptPreview.receiptNumber} · {retailReceiptPreview.cashierName} · {retailReceiptPreview.paymentMethod}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {retailReceiptPreview.lines.map((line) => (
            <div key={`${line.sku}-${line.quantity}`} className="rounded-lg border border-neutral-100 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-neutral-950">{line.productName}</p>
                  <p className="mt-1 font-mono text-xs text-neutral-500">{line.sku}</p>
                </div>
                <p className="text-right text-sm font-semibold text-neutral-950">{formatRetailCurrency(line.lineTotal)}</p>
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                {line.quantity} × {formatRetailCurrency(line.unitPrice)} · discount {line.discountPercent}%
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm text-neutral-600">
          <div className="flex justify-between gap-4"><span>Subtotal</span><span>{formatRetailCurrency(retailReceiptPreview.subtotal)}</span></div>
          <div className="flex justify-between gap-4"><span>Discount</span><span>-{formatRetailCurrency(retailReceiptPreview.discountTotal)}</span></div>
          <div className="flex justify-between gap-4"><span>Tax included</span><span>{formatRetailCurrency(retailReceiptPreview.taxIncluded)}</span></div>
          <div className="flex justify-between gap-4"><span>Profit preview</span><span>{formatRetailCurrency(retailReceiptPreview.profitPreview)}</span></div>
          <div className="flex justify-between gap-4 border-t pt-2 font-bold text-neutral-950"><span>Payable</span><span>{formatRetailCurrency(retailReceiptPreview.payable)}</span></div>
        </div>
      </CardContent>
    </Card>
  );
}

function InventoryRiskPanel() {
  return (
    <Card className="rounded-xl bg-white xl:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          Inventory risk and purchase suggestion
        </CardTitle>
        <CardDescription>Mock reorder intelligence before purchase order and stock movement API exist.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b text-xs uppercase tracking-[0.12em] text-neutral-400">
            <tr>
              <th className="py-3 pr-4">SKU</th>
              <th className="py-3 pr-4">Product</th>
              <th className="py-3 pr-4">Stock</th>
              <th className="py-3 pr-4">Recommended order</th>
              <th className="py-3 pr-4">Est. cost</th>
              <th className="py-3 pr-4">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {retailInventoryRiskReport.map((risk) => (
              <tr key={risk.productId}>
                <td className="py-3 pr-4 font-mono text-xs text-neutral-600">{risk.sku}</td>
                <td className="py-3 pr-4">
                  <div className="font-medium text-neutral-950">{risk.name}</div>
                  <div className="text-xs text-neutral-500">{risk.category} · {risk.reason}</div>
                </td>
                <td className="py-3 pr-4 text-neutral-700">{risk.currentStock}/{risk.reorderPoint}</td>
                <td className="py-3 pr-4 font-semibold text-neutral-950">+{risk.recommendedOrderQuantity}</td>
                <td className="py-3 pr-4 text-neutral-700">{formatRetailCurrency(risk.estimatedRestockCost)}</td>
                <td className="py-3 pr-4"><Badge variant="outline" className={severityTone[risk.severity]}>{risk.severity}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function ManagerReviewPanel() {
  return (
    <Card className="rounded-xl bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          Manager review queue
        </CardTitle>
        <CardDescription>Approval surfaces prepared before real permission checks exist.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {retailManagerReviewQueue.map((item) => (
          <div key={item.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-neutral-950">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-neutral-500">{item.description}</p>
              </div>
              <Badge variant="outline" className={severityTone[item.severity]}>{item.value}</Badge>
            </div>
            <p className="mt-3 text-xs leading-5 text-neutral-500">{item.action}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ActivityTimelinePanel() {
  return (
    <Card className="rounded-xl bg-white xl:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
          Operational activity timeline
        </CardTitle>
        <CardDescription>Cashier, receiving, and stock count events merged into one local timeline.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {retailActivityTimeline.slice(0, 6).map((event) => (
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
      <Card className="rounded-xl border-blue-100 bg-blue-50">
        <CardHeader>
          <CardTitle>Retail operations layer</CardTitle>
          <CardDescription>
            This phase adds local business calculations, manager review surfaces, receipt preview, inventory risk, and activity timeline without touching API or Prisma schema.
          </CardDescription>
        </CardHeader>
      </Card>

      <OperationInsightGrid />

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <DailyReportPanel />
        <ReceiptPreviewPanel />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <InventoryRiskPanel />
        <ManagerReviewPanel />
      </div>

      <ActivityTimelinePanel />
    </section>
  );
}
