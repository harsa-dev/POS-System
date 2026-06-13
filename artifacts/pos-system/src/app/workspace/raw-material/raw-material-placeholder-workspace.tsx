import { useState, type FormEvent } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatRawMaterialWeight,
  getRawMaterialStorageUsagePercent,
  rawMaterialApiContracts,
  rawMaterialBatches,
  rawMaterialIntakes,
  rawMaterialMockService,
  rawMaterialStorageLocations,
  rawMaterialSuppliers,
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

type IntakeDraft = Readonly<{
  id: string;
  materialName: string;
  supplierId: string;
  targetStorageId: string;
  quantityKg: number;
  status: "draft";
}>;

type WeighingDraft = Readonly<{
  id: string;
  intakeReference: string;
  grossKg: number;
  tareKg: number;
  netKg: number;
  status: "draft";
}>;

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

function toPositiveNumber(value: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export default function RawMaterialPlaceholderWorkspace({
  moduleId,
}: RawMaterialPlaceholderWorkspaceProps) {
  const workspace = rawMaterialWorkspaceModules[moduleId];
  const Icon = moduleIcons[moduleId];
  const moduleContracts = rawMaterialApiContracts.filter(
    (contract) => contract.moduleId === moduleId,
  );
  const readiness = rawMaterialMockService.getContractReadiness(moduleId);
  const metricsEnvelope = rawMaterialMockService.getMetrics();
  const intakesEnvelope = rawMaterialMockService.listIntakes();
  const batchesEnvelope = rawMaterialMockService.listBatches();
  const weighingsEnvelope = rawMaterialMockService.listWeighings();
  const storageEnvelope = rawMaterialMockService.listStorageLocations();
  const processingEnvelope = rawMaterialMockService.listProcessingRuns();
  const kandangEnvelope = rawMaterialMockService.listKandangPens();

  const [intakeForm, setIntakeForm] = useState({
    materialName: "Dedak Halus",
    supplierId: rawMaterialSuppliers[0]?.id ?? "",
    targetStorageId: rawMaterialStorageLocations[0]?.id ?? "",
    quantityKg: "500",
  });
  const [weighingForm, setWeighingForm] = useState({
    intakeReference: intakesEnvelope.data[0]?.referenceNumber ?? "RM-IN-DRAFT",
    grossKg: "640",
    tareKg: "40",
  });
  const [intakeDrafts, setIntakeDrafts] = useState<readonly IntakeDraft[]>([]);
  const [weighingDrafts, setWeighingDrafts] = useState<readonly WeighingDraft[]>([]);
  const [draftNotice, setDraftNotice] = useState("Drafts are local only. Refreshing the page clears them.");

  function handleCreateIntakeDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const quantityKg = toPositiveNumber(intakeForm.quantityKg);
    if (!intakeForm.materialName.trim() || !intakeForm.supplierId || !intakeForm.targetStorageId || quantityKg <= 0) {
      setDraftNotice("Intake draft needs material, supplier, storage, and a positive quantity.");
      return;
    }

    const nextDraft: IntakeDraft = {
      id: `local-intake-${Date.now()}`,
      materialName: intakeForm.materialName.trim(),
      supplierId: intakeForm.supplierId,
      targetStorageId: intakeForm.targetStorageId,
      quantityKg,
      status: "draft",
    };

    setIntakeDrafts((current) => [nextDraft, ...current]);
    setDraftNotice("Intake draft created locally. No API call, no schema write, no fake confidence parade.");
  }

  function handleCreateWeighingDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const grossKg = toPositiveNumber(weighingForm.grossKg);
    const tareKg = toPositiveNumber(weighingForm.tareKg);
    const netKg = grossKg - tareKg;

    if (!weighingForm.intakeReference.trim() || grossKg <= 0 || tareKg < 0 || netKg <= 0) {
      setDraftNotice("Weighing draft needs intake reference, gross weight, tare weight, and positive net weight.");
      return;
    }

    const nextDraft: WeighingDraft = {
      id: `local-weighing-${Date.now()}`,
      intakeReference: weighingForm.intakeReference.trim(),
      grossKg,
      tareKg,
      netKg,
      status: "draft",
    };

    setWeighingDrafts((current) => [nextDraft, ...current]);
    setDraftNotice("Weighing draft created locally. Still frontend-only, blessedly harmless.");
  }

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
        {metricsEnvelope.data.map((metric) => (
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

      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        {draftNotice}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle>Create intake draft</CardTitle>
            <CardDescription>Local component state only. This validates form shape before POST exists.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateIntakeDraft}>
              <div className="space-y-2">
                <Label htmlFor="rm-material-name">Material</Label>
                <Input
                  id="rm-material-name"
                  value={intakeForm.materialName}
                  onChange={(event) => setIntakeForm((current) => ({ ...current, materialName: event.target.value }))}
                  placeholder="Pakan starter, jagung, dedak..."
                />
              </div>

              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select
                  value={intakeForm.supplierId}
                  onValueChange={(supplierId) => setIntakeForm((current) => ({ ...current, supplierId }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {rawMaterialSuppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target storage</Label>
                <Select
                  value={intakeForm.targetStorageId}
                  onValueChange={(targetStorageId) => setIntakeForm((current) => ({ ...current, targetStorageId }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select storage" />
                  </SelectTrigger>
                  <SelectContent>
                    {rawMaterialStorageLocations.map((storage) => (
                      <SelectItem key={storage.id} value={storage.id}>
                        {storage.code} · {storage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rm-intake-quantity">Quantity kg</Label>
                <Input
                  id="rm-intake-quantity"
                  type="number"
                  min="1"
                  value={intakeForm.quantityKg}
                  onChange={(event) => setIntakeForm((current) => ({ ...current, quantityKg: event.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <Button type="submit">Create local intake draft</Button>
              </div>
            </form>

            <div className="mt-4 grid gap-3">
              {intakeDrafts.length === 0 ? (
                <p className="rounded-lg border border-dashed border-neutral-200 p-3 text-sm text-neutral-500">
                  No local intake draft yet.
                </p>
              ) : (
                intakeDrafts.map((draft) => (
                  <div key={draft.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium text-neutral-900">{draft.materialName}</p>
                      <Badge variant="outline">{draft.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">
                      {formatRawMaterialWeight(draft.quantityKg)} · {getSupplierName(draft.supplierId)} · {getStorageLabel(draft.targetStorageId)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle>Create weighing draft</CardTitle>
            <CardDescription>Local net-weight preview. No scale hardware, no API, no audit record yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-3" onSubmit={handleCreateWeighingDraft}>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="rm-weighing-reference">Intake reference</Label>
                <Input
                  id="rm-weighing-reference"
                  value={weighingForm.intakeReference}
                  onChange={(event) => setWeighingForm((current) => ({ ...current, intakeReference: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rm-gross-kg">Gross kg</Label>
                <Input
                  id="rm-gross-kg"
                  type="number"
                  min="1"
                  value={weighingForm.grossKg}
                  onChange={(event) => setWeighingForm((current) => ({ ...current, grossKg: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rm-tare-kg">Tare kg</Label>
                <Input
                  id="rm-tare-kg"
                  type="number"
                  min="0"
                  value={weighingForm.tareKg}
                  onChange={(event) => setWeighingForm((current) => ({ ...current, tareKg: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Net preview</Label>
                <div className="flex h-8 items-center rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-sm font-semibold text-neutral-900">
                  {formatRawMaterialWeight(Math.max(toPositiveNumber(weighingForm.grossKg) - toPositiveNumber(weighingForm.tareKg), 0))}
                </div>
              </div>

              <div className="md:col-span-3">
                <Button type="submit">Create local weighing draft</Button>
              </div>
            </form>

            <div className="mt-4 grid gap-3">
              {weighingDrafts.length === 0 ? (
                <p className="rounded-lg border border-dashed border-neutral-200 p-3 text-sm text-neutral-500">
                  No local weighing draft yet.
                </p>
              ) : (
                weighingDrafts.map((draft) => (
                  <div key={draft.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium text-neutral-900">{draft.intakeReference}</p>
                      <Badge variant="outline">{draft.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">
                      Gross {formatRawMaterialWeight(draft.grossKg)} · Tare {formatRawMaterialWeight(draft.tareKg)} · Net {formatRawMaterialWeight(draft.netKg)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="rounded-xl bg-white">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Supplier intake queue</CardTitle>
                <CardDescription>Local mock service data for receiving, quality checks, and target storage.</CardDescription>
              </div>
              <Badge variant="outline">{intakesEnvelope.meta.total} intakes</Badge>
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
                {intakesEnvelope.data.map((intake) => (
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

        <div className="space-y-4">
          <Card className="rounded-xl bg-white">
            <CardHeader>
              <CardTitle>Mock service readiness</CardTitle>
              <CardDescription>Generated from API contract metadata. Still zero schema mutation.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-neutral-600">
              <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <span>Readiness</span>
                <Badge variant="outline">{readiness.readinessLabel}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-neutral-100 p-3">
                  <p className="text-lg font-bold text-neutral-950">{readiness.totalContracts}</p>
                  <p className="text-xs text-neutral-500">contracts</p>
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
                Service source: {metricsEnvelope.meta.source}. Schema touched: {String(metricsEnvelope.meta.schemaTouched)}.
              </p>
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
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-xl bg-white lg:col-span-2">
          <CardHeader>
            <CardTitle>Batch traceability</CardTitle>
            <CardDescription>Lot, source intake, remaining quantity, expiry, quality, and storage mapping.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {batchesEnvelope.data.map((batch) => (
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
            {weighingsEnvelope.data.map((weighing) => (
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
            {storageEnvelope.data.map((location) => (
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
            {processingEnvelope.data.map((run) => (
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
            {kandangEnvelope.data.map((pen) => (
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
