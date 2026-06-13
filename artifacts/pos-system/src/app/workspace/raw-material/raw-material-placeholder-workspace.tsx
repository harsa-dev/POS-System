import { useState, type FormEvent } from "react";

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

import {
  rawMaterialHealthStatusTone,
  rawMaterialModuleIcons,
  rawMaterialProcessStatusTone,
  rawMaterialQualityFilterOptions,
  rawMaterialQualityStatusTone,
  rawMaterialSupplierCategoryOptions,
} from "./raw-material-workspace.constants";
import type {
  RawMaterialIntakeDraft,
  RawMaterialQualityFilterValue,
  RawMaterialSupplierCategoryFilterValue,
  RawMaterialWeighingDraft,
} from "./raw-material-workspace.types";
import {
  getRawMaterialBatchLabel,
  getRawMaterialIntakeLabel,
  getRawMaterialStorageLabel,
  getRawMaterialSupplierName,
  normalizeRawMaterialQualityFilter,
  normalizeRawMaterialSupplierCategoryFilter,
  toRawMaterialPositiveNumber,
} from "./raw-material-workspace.utils";

type RawMaterialPlaceholderWorkspaceProps = {
  moduleId: RawMaterialWorkspaceModuleId;
};

export default function RawMaterialPlaceholderWorkspace({
  moduleId,
}: RawMaterialPlaceholderWorkspaceProps) {
  const workspace = rawMaterialWorkspaceModules[moduleId];
  const Icon = rawMaterialModuleIcons[moduleId];
  const moduleContracts = rawMaterialApiContracts.filter(
    (contract) => contract.moduleId === moduleId,
  );
  const readiness = rawMaterialMockService.getContractReadiness(moduleId);
  const metricsEnvelope = rawMaterialMockService.getMetrics();
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
    intakeReference: rawMaterialIntakes[0]?.referenceNumber ?? "RM-IN-DRAFT",
    grossKg: "640",
    tareKg: "40",
  });
  const [intakeFilters, setIntakeFilters] = useState({
    supplierId: "all",
    qualityStatus: "all" as RawMaterialQualityFilterValue,
    search: "",
  });
  const [batchFilters, setBatchFilters] = useState({
    storageId: "all",
    qualityStatus: "all" as RawMaterialQualityFilterValue,
    search: "",
  });
  const [supplierFilters, setSupplierFilters] = useState({
    category: "all" as RawMaterialSupplierCategoryFilterValue,
    search: "",
  });
  const [transferPreviewForm, setTransferPreviewForm] = useState({
    batchId: rawMaterialBatches[0]?.id ?? "",
    sourceStorageId: rawMaterialStorageLocations[0]?.id ?? "",
    targetStorageId: rawMaterialStorageLocations[1]?.id ?? rawMaterialStorageLocations[0]?.id ?? "",
    quantityKg: "250",
  });
  const [processingPreviewForm, setProcessingPreviewForm] = useState({
    batchId: rawMaterialBatches[0]?.id ?? "",
    inputKg: "300",
    expectedYieldPercent: "92",
  });
  const [intakeDrafts, setIntakeDrafts] = useState<readonly RawMaterialIntakeDraft[]>([]);
  const [weighingDrafts, setWeighingDrafts] = useState<readonly RawMaterialWeighingDraft[]>([]);
  const [draftNotice, setDraftNotice] = useState(
    "Drafts and previews are local only. Refreshing the page clears them.",
  );

  const intakesEnvelope = rawMaterialMockService.listIntakes({
    supplierId: intakeFilters.supplierId === "all" ? undefined : intakeFilters.supplierId,
    qualityStatus: normalizeRawMaterialQualityFilter(intakeFilters.qualityStatus),
    search: intakeFilters.search || undefined,
  });
  const batchesEnvelope = rawMaterialMockService.listBatches({
    storageId: batchFilters.storageId === "all" ? undefined : batchFilters.storageId,
    qualityStatus: normalizeRawMaterialQualityFilter(batchFilters.qualityStatus),
    search: batchFilters.search || undefined,
  });
  const suppliersEnvelope = rawMaterialMockService.listSuppliers({
    category: normalizeRawMaterialSupplierCategoryFilter(supplierFilters.category),
    search: supplierFilters.search || undefined,
  });

  const transferBatch = rawMaterialBatches.find((batch) => batch.id === transferPreviewForm.batchId);
  const transferQuantityKg = toRawMaterialPositiveNumber(transferPreviewForm.quantityKg);
  const transferIsValid = Boolean(
    transferBatch &&
      transferQuantityKg > 0 &&
      transferQuantityKg <= transferBatch.remainingKg &&
      transferPreviewForm.sourceStorageId &&
      transferPreviewForm.targetStorageId &&
      transferPreviewForm.sourceStorageId !== transferPreviewForm.targetStorageId,
  );

  const processingBatch = rawMaterialBatches.find((batch) => batch.id === processingPreviewForm.batchId);
  const processingInputKg = toRawMaterialPositiveNumber(processingPreviewForm.inputKg);
  const expectedYieldPercent = toRawMaterialPositiveNumber(processingPreviewForm.expectedYieldPercent);
  const processingOutputKg = processingInputKg * (expectedYieldPercent / 100);
  const processingByproductKg = Math.max(processingInputKg - processingOutputKg, 0);
  const processingIsValid = Boolean(
    processingBatch &&
      processingInputKg > 0 &&
      processingInputKg <= processingBatch.remainingKg &&
      expectedYieldPercent > 0 &&
      expectedYieldPercent <= 100,
  );

  function handleCreateIntakeDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const quantityKg = toRawMaterialPositiveNumber(intakeForm.quantityKg);
    if (!intakeForm.materialName.trim() || !intakeForm.supplierId || !intakeForm.targetStorageId || quantityKg <= 0) {
      setDraftNotice("Intake draft needs material, supplier, storage, and a positive quantity.");
      return;
    }

    const nextDraft: RawMaterialIntakeDraft = {
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

    const grossKg = toRawMaterialPositiveNumber(weighingForm.grossKg);
    const tareKg = toRawMaterialPositiveNumber(weighingForm.tareKg);
    const netKg = grossKg - tareKg;

    if (!weighingForm.intakeReference.trim() || grossKg <= 0 || tareKg < 0 || netKg <= 0) {
      setDraftNotice("Weighing draft needs intake reference, gross weight, tare weight, and positive net weight.");
      return;
    }

    const nextDraft: RawMaterialWeighingDraft = {
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

  function handlePreviewTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDraftNotice(
      transferIsValid
        ? "Storage transfer preview generated locally. No stock movement was created. Civilization survives."
        : "Transfer preview needs different source/target storage and quantity within remaining batch stock.",
    );
  }

  function handlePreviewProcessingYield(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDraftNotice(
      processingIsValid
        ? "Processing yield preview generated locally. No finished goods or cost allocation created yet."
        : "Processing preview needs a valid batch, input quantity within remaining stock, and yield between 1-100%.",
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-amber-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-amber-300 text-amber-700">Raw Material mode</Badge>
          <Badge variant="outline" className="border-neutral-300 text-neutral-600">Mock data only</Badge>
          <Badge variant="outline" className="border-rose-300 text-rose-700">Schema untouched</Badge>
          <Badge variant="outline" className="border-blue-300 text-blue-700">API contract ready</Badge>
        </div>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">{workspace.eyebrow}</p>
            <h1 className="text-2xl font-bold text-neutral-950">{workspace.title}</h1>
            <p className="text-sm leading-6 text-neutral-600">{workspace.description}</p>
            <p className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm leading-6 text-neutral-600">
              <span className="font-semibold text-neutral-900">Operational goal:</span> {workspace.operationalGoal}
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

      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{draftNotice}</div>

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
                <Select value={intakeForm.supplierId} onValueChange={(supplierId) => setIntakeForm((current) => ({ ...current, supplierId }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>
                    {rawMaterialSuppliers.map((supplier) => <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target storage</Label>
                <Select value={intakeForm.targetStorageId} onValueChange={(targetStorageId) => setIntakeForm((current) => ({ ...current, targetStorageId }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select storage" /></SelectTrigger>
                  <SelectContent>
                    {rawMaterialStorageLocations.map((storage) => <SelectItem key={storage.id} value={storage.id}>{storage.code} · {storage.name}</SelectItem>)}
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

              <div className="md:col-span-2"><Button type="submit">Create local intake draft</Button></div>
            </form>

            <div className="mt-4 grid gap-3">
              {intakeDrafts.length === 0 ? (
                <p className="rounded-lg border border-dashed border-neutral-200 p-3 text-sm text-neutral-500">No local intake draft yet.</p>
              ) : (
                intakeDrafts.map((draft) => (
                  <div key={draft.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium text-neutral-900">{draft.materialName}</p>
                      <Badge variant="outline">{draft.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">
                      {formatRawMaterialWeight(draft.quantityKg)} · {getRawMaterialSupplierName(draft.supplierId)} · {getRawMaterialStorageLabel(draft.targetStorageId)}
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
                <Input id="rm-weighing-reference" value={weighingForm.intakeReference} onChange={(event) => setWeighingForm((current) => ({ ...current, intakeReference: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rm-gross-kg">Gross kg</Label>
                <Input id="rm-gross-kg" type="number" min="1" value={weighingForm.grossKg} onChange={(event) => setWeighingForm((current) => ({ ...current, grossKg: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rm-tare-kg">Tare kg</Label>
                <Input id="rm-tare-kg" type="number" min="0" value={weighingForm.tareKg} onChange={(event) => setWeighingForm((current) => ({ ...current, tareKg: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Net preview</Label>
                <div className="flex h-8 items-center rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-sm font-semibold text-neutral-900">
                  {formatRawMaterialWeight(Math.max(toRawMaterialPositiveNumber(weighingForm.grossKg) - toRawMaterialPositiveNumber(weighingForm.tareKg), 0))}
                </div>
              </div>
              <div className="md:col-span-3"><Button type="submit">Create local weighing draft</Button></div>
            </form>

            <div className="mt-4 grid gap-3">
              {weighingDrafts.length === 0 ? (
                <p className="rounded-lg border border-dashed border-neutral-200 p-3 text-sm text-neutral-500">No local weighing draft yet.</p>
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

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle>Preview storage transfer</CardTitle>
            <CardDescription>Checks quantity and storage direction without creating stock movement.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handlePreviewTransfer}>
              <div className="space-y-2 md:col-span-2">
                <Label>Batch</Label>
                <Select value={transferPreviewForm.batchId} onValueChange={(batchId) => setTransferPreviewForm((current) => ({ ...current, batchId }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>{rawMaterialBatches.map((batch) => <SelectItem key={batch.id} value={batch.id}>{batch.lotCode} · {batch.materialName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source storage</Label>
                <Select value={transferPreviewForm.sourceStorageId} onValueChange={(sourceStorageId) => setTransferPreviewForm((current) => ({ ...current, sourceStorageId }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Source" /></SelectTrigger>
                  <SelectContent>{rawMaterialStorageLocations.map((storage) => <SelectItem key={storage.id} value={storage.id}>{storage.code}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target storage</Label>
                <Select value={transferPreviewForm.targetStorageId} onValueChange={(targetStorageId) => setTransferPreviewForm((current) => ({ ...current, targetStorageId }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Target" /></SelectTrigger>
                  <SelectContent>{rawMaterialStorageLocations.map((storage) => <SelectItem key={storage.id} value={storage.id}>{storage.code}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rm-transfer-kg">Transfer kg</Label>
                <Input id="rm-transfer-kg" type="number" min="1" value={transferPreviewForm.quantityKg} onChange={(event) => setTransferPreviewForm((current) => ({ ...current, quantityKg: event.target.value }))} />
              </div>
              <div className="flex items-end"><Button type="submit" variant="outline">Preview transfer</Button></div>
            </form>

            <div className="mt-4 rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm leading-6 text-neutral-600">
              <p><span className="font-semibold text-neutral-900">Batch:</span> {transferBatch?.lotCode ?? "No batch"}</p>
              <p><span className="font-semibold text-neutral-900">Direction:</span> {getRawMaterialStorageLabel(transferPreviewForm.sourceStorageId)} → {getRawMaterialStorageLabel(transferPreviewForm.targetStorageId)}</p>
              <p><span className="font-semibold text-neutral-900">Quantity:</span> {formatRawMaterialWeight(transferQuantityKg)}</p>
              <p><span className="font-semibold text-neutral-900">Remaining after preview:</span> {formatRawMaterialWeight(Math.max((transferBatch?.remainingKg ?? 0) - transferQuantityKg, 0))}</p>
              <Badge variant="outline" className={transferIsValid ? "border-emerald-200 text-emerald-700" : "border-rose-200 text-rose-700"}>{transferIsValid ? "valid preview" : "needs review"}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle>Preview processing yield</CardTitle>
            <CardDescription>Calculates output and byproduct locally before production logic exists.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-3" onSubmit={handlePreviewProcessingYield}>
              <div className="space-y-2 md:col-span-3">
                <Label>Input batch</Label>
                <Select value={processingPreviewForm.batchId} onValueChange={(batchId) => setProcessingPreviewForm((current) => ({ ...current, batchId }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>{rawMaterialBatches.map((batch) => <SelectItem key={batch.id} value={batch.id}>{batch.lotCode} · {batch.materialName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rm-processing-input">Input kg</Label>
                <Input id="rm-processing-input" type="number" min="1" value={processingPreviewForm.inputKg} onChange={(event) => setProcessingPreviewForm((current) => ({ ...current, inputKg: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rm-yield-percent">Yield %</Label>
                <Input id="rm-yield-percent" type="number" min="1" max="100" value={processingPreviewForm.expectedYieldPercent} onChange={(event) => setProcessingPreviewForm((current) => ({ ...current, expectedYieldPercent: event.target.value }))} />
              </div>
              <div className="flex items-end"><Button type="submit" variant="outline">Preview yield</Button></div>
            </form>

            <div className="mt-4 rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm leading-6 text-neutral-600">
              <p><span className="font-semibold text-neutral-900">Batch:</span> {processingBatch?.lotCode ?? "No batch"}</p>
              <p><span className="font-semibold text-neutral-900">Input:</span> {formatRawMaterialWeight(processingInputKg)}</p>
              <p><span className="font-semibold text-neutral-900">Expected output:</span> {formatRawMaterialWeight(processingOutputKg)}</p>
              <p><span className="font-semibold text-neutral-900">Expected byproduct:</span> {formatRawMaterialWeight(processingByproductKg)}</p>
              <Badge variant="outline" className={processingIsValid ? "border-emerald-200 text-emerald-700" : "border-rose-200 text-rose-700"}>{processingIsValid ? "valid preview" : "needs review"}</Badge>
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
                <CardDescription>Filtered through mock service. Still no backend request.</CardDescription>
              </div>
              <Badge variant="outline">{intakesEnvelope.meta.total} intakes</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Input value={intakeFilters.search} onChange={(event) => setIntakeFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search intake/material/supplier" />
              <Select value={intakeFilters.supplierId} onValueChange={(supplierId) => setIntakeFilters((current) => ({ ...current, supplierId }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Supplier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All suppliers</SelectItem>
                  {rawMaterialSuppliers.map((supplier) => <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={intakeFilters.qualityStatus} onValueChange={(qualityStatus) => setIntakeFilters((current) => ({ ...current, qualityStatus: qualityStatus as RawMaterialQualityFilterValue }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Quality" /></SelectTrigger>
                <SelectContent>{rawMaterialQualityFilterOptions.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
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
                      <td className="py-3 pr-4 text-neutral-700"><div>{intake.materialName}</div><div className="text-xs text-neutral-500">Received: {intake.receivedQuantity} {intake.unit}</div></td>
                      <td className="py-3 pr-4 text-neutral-700">{getRawMaterialSupplierName(intake.supplierId)}</td>
                      <td className="py-3 pr-4 text-neutral-700">{intake.acceptedQuantity} {intake.unit}</td>
                      <td className="py-3 pr-4 text-neutral-700">{intake.rejectedQuantity} {intake.unit}</td>
                      <td className="py-3 pr-4 text-neutral-700">{getRawMaterialStorageLabel(intake.targetStorageId)}</td>
                      <td className="py-3 pr-4"><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${rawMaterialQualityStatusTone[intake.qualityStatus]}`}>{intake.qualityStatus}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-xl bg-white">
            <CardHeader>
              <CardTitle>Mock service readiness</CardTitle>
              <CardDescription>Generated from API contract metadata. Still zero schema mutation.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-neutral-600">
              <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 p-3"><span>Readiness</span><Badge variant="outline">{readiness.readinessLabel}</Badge></div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-neutral-100 p-3"><p className="text-lg font-bold text-neutral-950">{readiness.totalContracts}</p><p className="text-xs text-neutral-500">contracts</p></div>
                <div className="rounded-lg border border-neutral-100 p-3"><p className="text-lg font-bold text-neutral-950">{readiness.mockOnlyContracts}</p><p className="text-xs text-neutral-500">mock</p></div>
                <div className="rounded-lg border border-neutral-100 p-3"><p className="text-lg font-bold text-neutral-950">{readiness.futureDbContracts}</p><p className="text-xs text-neutral-500">future DB</p></div>
              </div>
              <p className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800">Service source: {metricsEnvelope.meta.source}. Schema touched: {String(metricsEnvelope.meta.schemaTouched)}.</p>
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
                  <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{contract.method}</Badge><Badge variant="outline" className="border-amber-200 text-amber-700">{contract.persistence}</Badge></div>
                  <p className="mt-2 font-mono text-xs text-neutral-700">{contract.path}</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{contract.purpose}</p>
                  <p className="mt-2 text-xs leading-5 text-neutral-500"><span className="font-semibold text-neutral-700">Request:</span> {contract.requestShape}</p>
                  <p className="mt-1 text-xs leading-5 text-neutral-500"><span className="font-semibold text-neutral-700">Response:</span> {contract.responseShape}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-xl bg-white lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Batch traceability</CardTitle>
                <CardDescription>Filtered lot, source intake, remaining quantity, expiry, quality, and storage mapping.</CardDescription>
              </div>
              <Badge variant="outline">{batchesEnvelope.meta.total} batches</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Input value={batchFilters.search} onChange={(event) => setBatchFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search lot/material" />
              <Select value={batchFilters.storageId} onValueChange={(storageId) => setBatchFilters((current) => ({ ...current, storageId }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Storage" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All storage</SelectItem>{rawMaterialStorageLocations.map((storage) => <SelectItem key={storage.id} value={storage.id}>{storage.code}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={batchFilters.qualityStatus} onValueChange={(qualityStatus) => setBatchFilters((current) => ({ ...current, qualityStatus: qualityStatus as RawMaterialQualityFilterValue }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Quality" /></SelectTrigger>
                <SelectContent>{rawMaterialQualityFilterOptions.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {batchesEnvelope.data.map((batch) => (
                <div key={batch.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-neutral-900">{batch.lotCode}</p>
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${rawMaterialQualityStatusTone[batch.qualityStatus]}`}>{batch.qualityStatus}</span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">{batch.materialName}</p>
                  <p className="mt-2 text-xs leading-5 text-neutral-500">Source: {getRawMaterialIntakeLabel(batch.intakeId)} · Remaining: {formatRawMaterialWeight(batch.remainingKg)} / {formatRawMaterialWeight(batch.quantityKg)}</p>
                  <p className="text-xs leading-5 text-neutral-500">Expiry: {batch.expiryDate} · {getRawMaterialStorageLabel(batch.storageId)}</p>
                </div>
              ))}
            </div>
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
                <p className="mt-2 text-xs leading-5 text-neutral-500">Gross {formatRawMaterialWeight(weighing.grossKg)} · Tare {formatRawMaterialWeight(weighing.tareKg)} · Net {formatRawMaterialWeight(weighing.netKg)}</p>
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
                <div className="flex items-center justify-between gap-3"><p className="font-medium text-neutral-900">{location.code}</p><Badge variant="outline">{getRawMaterialStorageUsagePercent(location)}%</Badge></div>
                <p className="mt-1 text-sm text-neutral-500">{location.name} · {location.type}</p>
                <p className="mt-2 text-xs text-neutral-500">{formatRawMaterialWeight(location.usedKg)} used from {formatRawMaterialWeight(location.capacityKg)}</p>
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
                <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-medium text-neutral-900">{run.runNumber}</p><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${rawMaterialProcessStatusTone[run.status]}`}>{run.status}</span></div>
                <p className="mt-1 text-sm text-neutral-500">{run.outputName}</p>
                <p className="mt-2 text-xs leading-5 text-neutral-500">Input: {formatRawMaterialWeight(run.inputKg)} from {getRawMaterialBatchLabel(run.inputBatchId)}</p>
                <p className="text-xs leading-5 text-neutral-500">Output: {formatRawMaterialWeight(run.outputKg)} · Byproduct: {formatRawMaterialWeight(run.byproductKg)}</p>
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
                <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-medium text-neutral-900">{pen.code}</p><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${rawMaterialHealthStatusTone[pen.healthStatus]}`}>{pen.healthStatus}</span></div>
                <p className="mt-1 text-sm text-neutral-500">{pen.flockName}</p>
                <p className="mt-2 text-xs leading-5 text-neutral-500">Occupancy: {pen.occupancy}/{pen.capacity} · Feed: {getRawMaterialBatchLabel(pen.feedBatchId)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Supplier filter preview</CardTitle>
              <CardDescription>Mock service supplier query before supplier API exists.</CardDescription>
            </div>
            <Badge variant="outline">{suppliersEnvelope.meta.total} suppliers</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={supplierFilters.search} onChange={(event) => setSupplierFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search supplier/contact/category" />
            <Select value={supplierFilters.category} onValueChange={(category) => setSupplierFilters((current) => ({ ...current, category: category as RawMaterialSupplierCategoryFilterValue }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>{rawMaterialSupplierCategoryOptions.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {suppliersEnvelope.data.map((supplier) => (
              <div key={supplier.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-medium text-neutral-900">{supplier.name}</p><Badge variant="outline">{supplier.category}</Badge></div>
                <p className="mt-1 text-sm text-neutral-500">{supplier.contactPerson} · {supplier.phone}</p>
                <p className="mt-2 text-xs text-neutral-500">Lead time: {supplier.leadTimeDays} days · Reliability: {supplier.reliabilityScore}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {workspace.checkpoints.map((checkpoint) => (
          <Card key={checkpoint} className="rounded-xl bg-white">
            <CardHeader>
              <CardTitle className="text-base">Foundation checkpoint</CardTitle>
              <CardDescription>Before API/schema integration</CardDescription>
            </CardHeader>
            <CardContent><p className="text-sm leading-6 text-neutral-600">{checkpoint}</p></CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
