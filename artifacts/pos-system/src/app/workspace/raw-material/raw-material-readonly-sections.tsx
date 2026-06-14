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
  type RawMaterialApiContract,
  type RawMaterialApiSource,
  type RawMaterialContractReadiness,
  type RawMaterialKandangPen,
  type RawMaterialMetric,
  type RawMaterialProcessingRun,
  type RawMaterialStorageLocation,
} from "@/features/raw-material/core-system";

import {
  rawMaterialHealthStatusTone,
  rawMaterialProcessStatusTone,
} from "./raw-material-workspace.constants";
import { getRawMaterialBatchLabel } from "./raw-material-workspace.utils";

type RawMaterialMetricsGridProps = {
  metrics: readonly RawMaterialMetric[];
};

type RawMaterialReadinessCardProps = {
  readiness: RawMaterialContractReadiness;
  source: RawMaterialApiSource;
  schemaTouched: boolean;
  apiStatusLabel?: string;
};

type RawMaterialApiContractCardProps = {
  contracts: readonly RawMaterialApiContract[];
};

type RawMaterialStaticSnapshotsProps = {
  storageLocations: readonly RawMaterialStorageLocation[];
  processingRuns: readonly RawMaterialProcessingRun[];
  kandangPens: readonly RawMaterialKandangPen[];
};

function getPersistenceTone(persistence: RawMaterialApiContract["persistence"]) {
  if (persistence === "backend-backed" || persistence === "backend-backed-with-mock-fallback") {
    return "border-emerald-200 text-emerald-700";
  }

  if (persistence === "future-db") {
    return "border-blue-200 text-blue-700";
  }

  return "border-amber-200 text-amber-700";
}

export function RawMaterialMetricsGrid({ metrics }: RawMaterialMetricsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
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
  );
}

export function RawMaterialReadinessCard({
  readiness,
  source,
  schemaTouched,
  apiStatusLabel = "Mock fallback retained.",
}: RawMaterialReadinessCardProps) {
  return (
    <Card className="rounded-xl bg-white">
      <CardHeader>
        <CardTitle>Raw Material API readiness</CardTitle>
        <CardDescription>Generated from frontend contract metadata and current workspace data source.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-neutral-600">
        <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 p-3">
          <span>Readiness</span>
          <Badge variant="outline">{readiness.readinessLabel}</Badge>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-lg border border-neutral-100 p-3">
            <p className="text-lg font-bold text-neutral-950">{readiness.totalContracts}</p>
            <p className="text-xs text-neutral-500">contracts</p>
          </div>
          <div className="rounded-lg border border-neutral-100 p-3">
            <p className="text-lg font-bold text-neutral-950">{readiness.backendBackedContracts}</p>
            <p className="text-xs text-neutral-500">backend</p>
          </div>
          <div className="rounded-lg border border-neutral-100 p-3">
            <p className="text-lg font-bold text-neutral-950">{readiness.mockOnlyContracts}</p>
            <p className="text-xs text-neutral-500">mock</p>
          </div>
          <div className="rounded-lg border border-neutral-100 p-3">
            <p className="text-lg font-bold text-neutral-950">{readiness.futureDbContracts}</p>
            <p className="text-xs text-neutral-500">future DB</p>
          </div>
        </div>
        <p className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          Service source: {source}. Schema touched: {String(schemaTouched)}. {apiStatusLabel}
        </p>
      </CardContent>
    </Card>
  );
}

export function RawMaterialApiContractCard({ contracts }: RawMaterialApiContractCardProps) {
  return (
    <Card className="rounded-xl bg-white">
      <CardHeader>
        <CardTitle>API contract for this module</CardTitle>
        <CardDescription>Frontend contract synced to current Raw Material backend routes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {contracts.map((contract) => (
          <div key={contract.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{contract.method}</Badge>
              <Badge variant="outline" className={getPersistenceTone(contract.persistence)}>
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
  );
}

export function RawMaterialStaticSnapshots({
  storageLocations,
  processingRuns,
  kandangPens,
}: RawMaterialStaticSnapshotsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle>Storage capacity</CardTitle>
          <CardDescription>Usage preview before transfer API exists.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {storageLocations.map((location) => (
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
          <CardDescription>Input, output, extra material, and yield preview.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {processingRuns.map((run) => (
            <div key={run.id} className="rounded-lg border border-neutral-100 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium text-neutral-900">{run.runNumber}</p>
                <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${rawMaterialProcessStatusTone[run.status]}`}>
                  {run.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-500">{run.outputName}</p>
              <p className="mt-2 text-xs leading-5 text-neutral-500">
                Input: {formatRawMaterialWeight(run.inputKg)} from {getRawMaterialBatchLabel(run.inputBatchId)}
              </p>
              <p className="text-xs leading-5 text-neutral-500">
                Output: {formatRawMaterialWeight(run.outputKg)} · Extra: {formatRawMaterialWeight(run.byproductKg)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle>Kandang snapshot</CardTitle>
          <CardDescription>Pen support data without new tables.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {kandangPens.map((pen) => (
            <div key={pen.id} className="rounded-lg border border-neutral-100 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium text-neutral-900">{pen.code}</p>
                <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${rawMaterialHealthStatusTone[pen.healthStatus]}`}>
                  {pen.healthStatus}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-500">{pen.flockName}</p>
              <p className="mt-2 text-xs leading-5 text-neutral-500">
                Occupancy: {pen.occupancy}/{pen.capacity} · Feed: {getRawMaterialBatchLabel(pen.feedBatchId)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
