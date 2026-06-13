"use client";

import { Database, FileText, Server } from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import type { DashboardTone } from "@/features/shared/types";

import {
  getHppMockSummary,
  hppCostComponentMocks,
  hppDataPreparationMocks,
  hppProductPriceMocks,
  hppSchemaPreparation,
  type HppCostComponentMock,
  type HppDataPreparationMock,
  type HppProductPriceMock,
} from "./hpp-calculator.mock";

const statusTone: Record<string, DashboardTone> = {
  "Mock Ready": "green",
  "Needs API": "amber",
  "Needs Schema": "rose",
  Draft: "slate",
  Ready: "green",
  Review: "amber",
};

function getTone(status: string): DashboardTone {
  return statusTone[status] ?? "slate";
}

const componentColumns: DataTableColumn<HppCostComponentMock>[] = [
  { key: "name", header: "Component", cell: (row) => <span className="font-medium text-foreground">{row.name}</span> },
  { key: "category", header: "Category", cell: (row) => row.category },
  { key: "sourceModule", header: "Mock Source", cell: (row) => row.sourceModule },
  { key: "quantity", header: "Qty", cell: (row) => `${formatNumber(row.quantity)} ${row.unit}` },
  { key: "totalCost", header: "Total", cell: (row) => formatCurrency(row.totalCost) },
  { key: "status", header: "Readiness", cell: (row) => <StatusPill tone={getTone(row.status)}>{row.status}</StatusPill> },
];

const productColumns: DataTableColumn<HppProductPriceMock>[] = [
  { key: "productName", header: "Product", cell: (row) => <span className="font-medium text-foreground">{row.productName}</span> },
  { key: "hppPerUnit", header: "HPP / Unit", cell: (row) => formatCurrency(row.hppPerUnit) },
  { key: "floorPrice", header: "Floor Price", cell: (row) => formatCurrency(row.floorPrice) },
  { key: "suggestedPrice", header: "Suggested", cell: (row) => formatCurrency(row.suggestedPrice) },
  { key: "approvalStatus", header: "Approval", cell: (row) => <StatusPill tone={getTone(row.approvalStatus)}>{row.approvalStatus}</StatusPill> },
];

const preparationColumns: DataTableColumn<HppDataPreparationMock>[] = [
  { key: "domain", header: "Domain", cell: (row) => <span className="font-medium text-foreground">{row.domain}</span> },
  { key: "mockSource", header: "Mock Source", cell: (row) => row.mockSource },
  { key: "futureApi", header: "Future API", cell: (row) => <code className="text-xs">{row.futureApi}</code> },
  { key: "futureSchema", header: "Future Schema", cell: (row) => row.futureSchema },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={getTone(row.status)}>{row.status}</StatusPill> },
];

export function HppCalculatorPreparation() {
  const summary = getHppMockSummary();

  return (
    <section className="mt-5 grid gap-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mock Cost Total" value={formatCurrency(summary.totalCost)} note="From hppCostComponentMocks" icon={Database} tone="green" />
        <StatCard label="Mock Products" value={formatNumber(summary.mockProducts)} note="Product price candidates" icon={FileText} tone="blue" />
        <StatCard label="Schema Items" value={formatNumber(summary.needsSchema)} note="Prepared only" icon={Database} tone="rose" />
        <StatCard label="API Pending" value={formatNumber(summary.needsApi)} note="Future contract only" icon={Server} tone="amber" />
      </div>

      <DashboardPanel title="HPP Mock Data Source" description="Dummy data sudah dipisah dari JSX agar nanti mudah diganti API.">
        <DataTable columns={componentColumns} data={hppCostComponentMocks} getRowKey={(row) => row.id} minWidth={980} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Product Price Simulation Mock" description="Simulasi harga jual per produk, masih hardcoded.">
        <DataTable columns={productColumns} data={hppProductPriceMocks} getRowKey={(row) => row.id} minWidth={900} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="API Contract Preparation" description="Daftar target endpoint dan field mapping untuk fase backend nanti.">
        <DataTable columns={preparationColumns} data={hppDataPreparationMocks} getRowKey={(row) => row.id} minWidth={1100} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Schema Preparation Only" description="Kandidat model Prisma. Belum ada schema update atau migration.">
        <div className="grid gap-3 p-4 md:grid-cols-2">
          {hppSchemaPreparation.map((item) => (
            <article key={item.model} className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{item.model}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.reason}</p>
                </div>
                <StatusPill tone="slate">Planned</StatusPill>
              </div>
              <code className="mt-3 block rounded-md bg-background px-3 py-2 text-xs leading-5 text-muted-foreground">{item.fields}</code>
            </article>
          ))}
        </div>
      </DashboardPanel>
    </section>
  );
}
