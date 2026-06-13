import {
  Boxes,
  ClipboardList,
  Factory,
  PackageSearch,
  Scale,
  Sprout,
  Truck,
  type LucideIcon,
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
  formatRawMaterialWeight,
  getRawMaterialStorageUsagePercent,
  rawMaterialApiContracts,
  rawMaterialBatches,
  rawMaterialIntakes,
  rawMaterialKandangPens,
  rawMaterialMetrics,
  rawMaterialProcessingRuns,
  rawMaterialStorageLocations,
  rawMaterialSuppliers,
  rawMaterialWeighings,
  rawMaterialWorkspaceModules,
  type RawMaterialWorkspaceModuleId,
} from "@/features/raw-material/core-system";

const moduleIcons: Record<RawMaterialWorkspaceModuleId, LucideIcon> = {
  intake: Truck,
  weighing: Scale,
  batches: ClipboardList,
  storage: Boxes,
  processing: Factory,
  kandang: Sprout,
  suppliers: PackageSearch,
};

const qualityStatusTone = {
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inspection: "border-amber-200 bg-amber-50 text-amber-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
} as const;

const processStatusTone = {
  planned: "border-neutral-200 bg-neutral-50 text-neutral-600",
  running: "border-blue-200 bg-blue-50 text-blue-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
} as const;

const healthStatusTone = {
  stable: "border-emerald-200 bg-emerald-50 text-emerald-700",
  monitoring: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-rose-200 bg-rose-50 text-rose-700",
} as const;

type RawMaterialPlaceholderWorkspaceProps = {
  moduleId: RawMaterialWorkspaceModuleId;
};

function getSupplierName(supplierId: string) {
  return rawMaterialSuppliers.find((supplier) => supplier.id === supplierId)?.name ?? "Unknown supplier";
}

function getStorageLabel(storageId: string) {
  const storage = rawMaterialStorageLocations.find((location) => location.id === storageId);

  return storage ? `${storage.code} · ${storage.name}` : "Unassigned storage";
}

function getIntakeLabel(intakeId: string) {
  const intake = rawMaterialIntakes.find((candidate) => candidate.id === intakeId);

  return intake ? intake.referenceNumber : "Unknown intake";
}

function getBatchLabel(batchId: string) {
  const batch = rawMaterialBatches.find((candidate) => candidate.id === batchId);

  return batch ? batch.lotCode : "Unknown batch";
}

export default function RawMaterialPlaceholderWorkspace({
  moduleId,
}: RawMaterialPlaceholderWorkspaceProps) {
  const workspace = rawMaterialWorkspaceModules[moduleId];
  const Icon = moduleIcons[moduleId];
  const moduleContracts = rawMaterialApiContracts.filter(
    (contract) => contract.moduleId === moduleId,
  );

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-amber-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-amber-300 text-amber-700">
            Raw Material mode
          </Badge>
          <Badge variant="outline" className="border-neutral-300 text-neutral-600">
            Mock data only
          </Badge>
          <Badge variant="outline" className="border-rose-300 text-rose-700">
            Schema untouched
          </Badge>
          <Badge variant="outline" className="border-blue-300 text-blue-700">
            API contract ready
          </Badge>
        </div>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
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
        {rawMaterialMetrics.map((metric) => (
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Supplier intake queue</CardTitle>
                <CardDescription>Local mock data for receiving, quality checks, and target storage.</CardDescription>
              </div>
              <Badge variant="outline">{rawMaterialIntakes.length} intakes</Badge>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-[0.12em] text-neutral-400">
                <tr>
                  <th className="py-3 pr-4">Reference</th>
                  <th className="py-3 pr-4">Material</th>
                  <th className="py-3 pr-4">Supplier</th>
                  <th className="py-3 pr-4">Accepted</th>
                  <th className="py-3 pr-4">Rejected</th>
                  <th className="py-3 pr-4">Storage</th>
                  <th className="py-3 pr-4">Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rawMaterialIntakes.map((intake) => (
                  <tr key={intake.id}>
                    <td className="py-3 pr-4 font-medium text-neutral-950">{intake.referenceNumber}</td>
                    <td className="py-3 pr-4 text-neutral-700">
                      <div>{intake.materialName}</div>
                      <div className="text-xs text-neutral-500">Received: {intake.receivedQuantity} {intake.unit}</div>
                    </td>
                    <td className="py-3 pr-4 text-neutral-700">{getSupplierName(intake.supplierId)}</td>
                    <td className="py-3 pr-4 text-neutral-700">{intake.acceptedQuantity} {intake.unit}</td>
                    <td className="py-3 pr-4 text-neutral-700">{intake.rejectedQuantity} {intake.unit}</td>
                    <td className="py-3 pr-4 text-neutral-700">{getStorageLabel(intake.targetStorageId)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${qualityStatusTone[intake.qualityStatus]}`}>
                        {intake.qualityStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle>API contract for this module</CardTitle>
            <CardDescription>Frontend contract only. No handler, Prisma call, or schema mutation yet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {moduleContracts.map((contract) => (
              <div key={contract.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{contract.method}</Badge>
                  <Badge variant="outline" className="border-amber-200 text-amber-700">
                    {contract.persistence}
                  </Badge>
                </div>
                <p className="mt-2 font-mono text-xs text-neutral-700">{contract.path}</p>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{contract.purpose}</p>
                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  <span className="font-semibold text-neutral-700">Request:</span> {contract.requestShape}
                </p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  <span className="font-semibold text-neutral-700">Response:</span> {contract.responseShape}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-xl bg-white lg:col-span-2">
          <CardHeader>
            <CardTitle>Batch traceability</CardTitle>
            <CardDescription>Lot, source intake, remaining quantity, expiry, quality, and storage mapping.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {rawMaterialBatches.map((batch) => (
              <div key={batch.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium text-neutral-900">{batch.lotCode}</p>
                  <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${qualityStatusTone[batch.qualityStatus]}`}>
                    {batch.qualityStatus}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-600">{batch.materialName}</p>
                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  Source: {getIntakeLabel(batch.intakeId)} · Remaining: {formatRawMaterialWeight(batch.remainingKg)} / {formatRawMaterialWeight(batch.quantityKg)}
                </p>
                <p className="text-xs leading-5 text-neutral-500">
                  Expiry: {batch.expiryDate} · {getStorageLabel(batch.storageId)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle>Weighing records</CardTitle>
            <CardDescription>Gross, tare, and net preview.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rawMaterialWeighings.map((weighing) => (
              <div key={weighing.id} className="rounded-lg border border-neutral-100 p-3">
                <p className="font-medium text-neutral-900">{weighing.referenceNumber}</p>
                <p className="mt-1 text-sm text-neutral-500">{weighing.stationName} · {weighing.operatorName}</p>
                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  Gross {formatRawMaterialWeight(weighing.grossKg)} · Tare {formatRawMaterialWeight(weighing.tareKg)} · Net {formatRawMaterialWeight(weighing.netKg)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle>Storage capacity</CardTitle>
            <CardDescription>Usage preview before transfer API exists.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rawMaterialStorageLocations.map((location) => (
              <div key={location.id} className="rounded-lg border border-neutral-100 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-neutral-900">{location.code}</p>
                  <Badge variant="outline">{getRawMaterialStorageUsagePercent(location)}%</Badge>
                </div>
                <p className="mt-1 text-sm text-neutral-500">{location.name} · {location.type}</p>
                <p className="mt-2 text-xs text-neutral-500">
                  {formatRawMaterialWeight(location.usedKg)} used from {formatRawMaterialWeight(location.capacityKg)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle>Processing runs</CardTitle>
            <CardDescription>Input, output, byproduct, and yield preview.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rawMaterialProcessingRuns.map((run) => (
              <div key={run.id} className="rounded-lg border border-neutral-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium text-neutral-900">{run.runNumber}</p>
                  <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${processStatusTone[run.status]}`}>
                    {run.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-500">{run.outputName}</p>
                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  Input: {formatRawMaterialWeight(run.inputKg)} from {getBatchLabel(run.inputBatchId)}
                </p>
                <p className="text-xs leading-5 text-neutral-500">
                  Output: {formatRawMaterialWeight(run.outputKg)} · Byproduct: {formatRawMaterialWeight(run.byproductKg)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle>Kandang snapshot</CardTitle>
            <CardDescription>Livestock support data without new tables.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rawMaterialKandangPens.map((pen) => (
              <div key={pen.id} className="rounded-lg border border-neutral-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium text-neutral-900">{pen.code}</p>
                  <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${healthStatusTone[pen.healthStatus]}`}>
                    {pen.healthStatus}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-500">{pen.flockName}</p>
                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  Occupancy: {pen.occupancy}/{pen.capacity} · Feed: {getBatchLabel(pen.feedBatchId)}
                </p>
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
