"use client";

import { Calculator, Database, Server } from "lucide-react";

import { StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";

type RoadmapItem = {
  domain: string;
  description: string;
  futureApi: string;
  status: "Planned" | "In Progress";
};

const roadmapItems: RoadmapItem[] = [
  {
    domain: "Raw Material Cost",
    description: "Pull unit cost per gram/kg from raw material intake and batch records.",
    futureApi: "GET /api/hpp/components/raw-material",
    status: "Planned",
  },
  {
    domain: "Packaging Cost",
    description: "Link purchasing records to packaging components per product.",
    futureApi: "GET /api/hpp/components/packaging",
    status: "Planned",
  },
  {
    domain: "Labor Cost",
    description: "Allocate workforce hours and payroll cost per production batch.",
    futureApi: "GET /api/hpp/components/labor",
    status: "Planned",
  },
  {
    domain: "Overhead & Utilities",
    description: "Distribute shared overhead (rent, power, water) across active batches.",
    futureApi: "GET /api/hpp/components/overhead",
    status: "Planned",
  },
  {
    domain: "Product Price Simulation",
    description: "Compute floor price, suggested price, and target margin per SKU.",
    futureApi: "GET /api/hpp/products",
    status: "Planned",
  },
];

const schemaItems = [
  {
    model: "HppBatch",
    fields: "id, productId, batchDate, totalCost, batchUnits, hppPerUnit",
    note: "Stores a computed cost snapshot per production run.",
  },
  {
    model: "HppCostComponent",
    fields: "id, hppBatchId, category, sourceDomain, quantity, unitCost, totalCost",
    note: "One row per cost input (raw material, labor, packaging, overhead).",
  },
  {
    model: "HppPriceSimulation",
    fields: "id, productId, hppPerUnit, floorPrice, suggestedPrice, targetMarginPercent, approvalStatus",
    note: "Pricing recommendation derived from the latest HppBatch for that product.",
  },
];

export function HppCalculatorPreparation() {
  return (
    <section className="mt-5 grid gap-5">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <div className="flex items-start gap-3">
          <Calculator className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">HPP Calculator — API & Schema Required</p>
            <p className="mt-1 leading-6">
              This feature needs a cost-aggregation API and new Prisma schema before live data can be shown.
              The roadmap below defines the required endpoints and data model. No calculations are run yet.
            </p>
          </div>
        </div>
      </div>

      <DashboardPanel
        title="API Roadmap"
        description="Endpoints to build. Each domain maps to a cost input category that feeds the HPP calculation."
      >
        <div className="divide-y divide-border">
          {roadmapItems.map((item) => (
            <div key={item.domain} className="flex items-start justify-between gap-4 px-4 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="font-semibold text-foreground">{item.domain}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                <code className="mt-1.5 block text-xs text-muted-foreground/70">{item.futureApi}</code>
              </div>
              <StatusPill tone="slate">{item.status}</StatusPill>
            </div>
          ))}
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="Schema Plan"
        description="Prisma models to add. No migration has been run yet — this is a design specification."
      >
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {schemaItems.map((item) => (
            <article key={item.model} className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <h3 className="font-semibold text-foreground">{item.model}</h3>
                </div>
                <StatusPill tone="slate">Planned</StatusPill>
              </div>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{item.note}</p>
              <code className="mt-3 block rounded-md bg-background px-3 py-2 text-xs leading-5 text-muted-foreground">
                {item.fields}
              </code>
            </article>
          ))}
        </div>
      </DashboardPanel>
    </section>
  );
}
