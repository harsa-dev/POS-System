import {
  Boxes,
  ClipboardList,
  Factory,
  PackageSearch,
  Scale,
  Sprout,
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
import type { V3ModuleId } from "@/app/registry";

const rawMaterialWorkspaceMeta = {
  intake: {
    title: "Supplier Intake",
    route: "/v3/raw-material/intake",
    icon: Truck,
    summary:
      "Preview surface for supplier goods arrival, intake reference, source documents, and first stock checks.",
    checks: [
      "Supplier identity and source relation",
      "Received quantity versus accepted quantity",
      "Initial stock movement source mapping",
      "Mode-aware inventory policy response",
    ],
  },
  weighing: {
    title: "Weighing",
    route: "/v3/raw-material/weighing",
    icon: Scale,
    summary:
      "Preview surface for gross, tare, net weight, weighing station notes, and batch linkage.",
    checks: [
      "Gross/tare/net calculation boundary",
      "Weight unit consistency",
      "Batch relation before stock mutation",
      "Audit event shape for measurement changes",
    ],
  },
  batches: {
    title: "Batches",
    route: "/v3/raw-material/batches",
    icon: ClipboardList,
    summary:
      "Preview surface for batch identity, lot code, source relation, age, quality state, and movement history.",
    checks: [
      "Batch isolation per tenant",
      "Lot number uniqueness strategy",
      "Inventory movement back-reference",
      "Expiry or quality status transitions",
    ],
  },
  storage: {
    title: "Storage",
    route: "/v3/raw-material/storage",
    icon: Boxes,
    summary:
      "Preview surface for warehouse/cold-storage locations, stock state, transfer, and capacity visibility.",
    checks: [
      "Storage location ownership scope",
      "Transfer in/out movement direction",
      "Low stock visibility by mode",
      "Cold-storage metadata placeholder",
    ],
  },
  processing: {
    title: "Processing",
    route: "/v3/raw-material/processing",
    icon: Factory,
    summary:
      "Preview surface for raw-to-output transformation, yield tracking, byproduct notes, and production usage.",
    checks: [
      "Input/output yield model",
      "Production usage stock reason",
      "Finished good relation",
      "Cost distribution placeholder",
    ],
  },
  kandang: {
    title: "Kandang",
    route: "/v3/raw-material/kandang",
    icon: Sprout,
    summary:
      "Preview surface for pen identity, capacity, livestock group state, feed relation, and operational events.",
    checks: [
      "Pen capacity and occupancy state",
      "Feed/medicine usage relation",
      "Livestock event log boundary",
      "Supplier and batch traceability",
    ],
  },
  suppliers: {
    title: "Suppliers",
    route: "/v3/raw-material/suppliers",
    icon: PackageSearch,
    summary:
      "Preview surface for supplier identity, source quality, contact metadata, and intake source history.",
    checks: [
      "Supplier tenant isolation",
      "Supplier to intake relation",
      "Reusable partner/customer model conflict",
      "Document attachment boundary",
    ],
  },
} as const satisfies Partial<
  Record<
    V3ModuleId,
    {
      title: string;
      route: string;
      icon: typeof Boxes;
      summary: string;
      checks: readonly string[];
    }
  >
>;

type RawMaterialPlaceholderWorkspaceProps = {
  moduleId: keyof typeof rawMaterialWorkspaceMeta;
};

export default function RawMaterialPlaceholderWorkspace({
  moduleId,
}: RawMaterialPlaceholderWorkspaceProps) {
  const workspace = rawMaterialWorkspaceMeta[moduleId];
  const Icon = workspace.icon;

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-dashed border-amber-300 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-amber-300 text-amber-700">
            Raw Material preview
          </Badge>
          <Badge variant="outline" className="border-neutral-300 text-neutral-600">
            Tenant-safe bridge mode
          </Badge>
        </div>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl space-y-3">
            <h1 className="text-2xl font-bold text-neutral-950">
              {workspace.title}
            </h1>
            <p className="text-sm leading-6 text-neutral-600">
              {workspace.summary}
            </p>
            <p className="text-xs leading-5 text-neutral-500">
              Route: <span className="font-semibold text-neutral-800">{workspace.route}</span>
            </p>
          </div>

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800">
            <Icon className="h-7 w-7" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-600">
          This workspace intentionally exposes the raw-material navigation surface
          without creating production records yet. It is meant for route, sidebar,
          mode guard, API header, and tenant-scope testing before real livestock
          or raw-material database models are added.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {workspace.checks.map((check) => (
          <Card key={check} className="rounded-lg bg-white">
            <CardHeader>
              <CardTitle className="text-base">Audit checkpoint</CardTitle>
              <CardDescription>Preview validation point</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-neutral-600">{check}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
