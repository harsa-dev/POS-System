import { useEffect, useState, type FormEvent } from "react";

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
  getRawMaterialPreviewErrorMessage,
  rawMaterialPreviewApiClient,
  type RawMaterialIntake,
  type RawMaterialStorageLocation,
  type RawMaterialSupplier,
} from "@/features/raw-material/core-system";

import type {
  RawMaterialIntakeDraft,
  RawMaterialWeighingDraft,
} from "./raw-material-workspace.types";
import { toRawMaterialPositiveNumber } from "./raw-material-workspace.utils";

type RawMaterialDraftFormsProps = {
  suppliers: readonly RawMaterialSupplier[];
  storageLocations: readonly RawMaterialStorageLocation[];
  intakes: readonly RawMaterialIntake[];
  onNoticeChange: (message: string) => void;
};

function getSupplierName(suppliers: readonly RawMaterialSupplier[], supplierId: string) {
  return suppliers.find((supplier) => supplier.id === supplierId)?.name ?? "Unknown supplier";
}

function getStorageLabel(storageLocations: readonly RawMaterialStorageLocation[], storageId: string) {
  const storage = storageLocations.find((location) => location.id === storageId);
  return storage ? `${storage.code} · ${storage.name}` : "Unassigned storage";
}

function formatPreviewIssues(issues: readonly string[]) {
  return issues.length > 0 ? issues.join(" ") : "Preview blocked this draft.";
}

export function RawMaterialDraftForms({
  suppliers,
  storageLocations,
  intakes,
  onNoticeChange,
}: RawMaterialDraftFormsProps) {
  const [intakeForm, setIntakeForm] = useState({
    materialName: "Dedak Halus",
    supplierId: suppliers[0]?.id ?? "",
    targetStorageId: storageLocations[0]?.id ?? "",
    quantityKg: "500",
  });
  const [weighingForm, setWeighingForm] = useState({
    intakeReference: intakes[0]?.referenceNumber ?? "RM-IN-DRAFT",
    grossKg: "640",
    tareKg: "40",
  });
  const [intakeDrafts, setIntakeDrafts] = useState<readonly RawMaterialIntakeDraft[]>([]);
  const [weighingDrafts, setWeighingDrafts] = useState<readonly RawMaterialWeighingDraft[]>([]);

  useEffect(() => {
    setIntakeForm((current) => ({
      ...current,
      supplierId: suppliers.some((supplier) => supplier.id === current.supplierId)
        ? current.supplierId
        : suppliers[0]?.id ?? "",
      targetStorageId: storageLocations.some((storage) => storage.id === current.targetStorageId)
        ? current.targetStorageId
        : storageLocations[0]?.id ?? "",
    }));
    setWeighingForm((current) => ({
      ...current,
      intakeReference: current.intakeReference || intakes[0]?.referenceNumber || "RM-IN-DRAFT",
    }));
  }, [intakes, storageLocations, suppliers]);

  async function handleCreateIntakeDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const quantityKg = toRawMaterialPositiveNumber(intakeForm.quantityKg);
    if (!intakeForm.materialName.trim() || !intakeForm.supplierId || !intakeForm.targetStorageId || quantityKg <= 0) {
      onNoticeChange("Intake draft needs material, supplier, storage, and a positive quantity.");
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

    try {
      const preview = await rawMaterialPreviewApiClient.previewIntake({
        materialName: nextDraft.materialName,
        supplierId: nextDraft.supplierId,
        targetStorageLocationId: nextDraft.targetStorageId,
        receivedQuantity: quantityKg,
        acceptedQuantity: quantityKg,
        rejectedQuantity: 0,
        unit: "KG",
      });

      if (!preview.canProceed) {
        onNoticeChange(`Backend intake preview blocked this draft. ${formatPreviewIssues(preview.blockingIssues)}`);
        return;
      }

      setIntakeDrafts((current) => [nextDraft, ...current]);
      onNoticeChange(
        `Backend intake preview passed. Acceptance ${preview.estimates.acceptanceRate}% · storage after ${formatRawMaterialWeight(Number(preview.estimates.storageUsedAfterAcceptance ?? 0))}. Draft kept local; write UX still disabled.`,
      );
    } catch (error) {
      setIntakeDrafts((current) => [nextDraft, ...current]);
      onNoticeChange(`${getRawMaterialPreviewErrorMessage(error)} Local intake draft created as fallback.`);
    }
  }

  function handleCreateWeighingDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const grossKg = toRawMaterialPositiveNumber(weighingForm.grossKg);
    const tareKg = toRawMaterialPositiveNumber(weighingForm.tareKg);
    const netKg = grossKg - tareKg;

    if (!weighingForm.intakeReference.trim() || grossKg <= 0 || tareKg < 0 || netKg <= 0) {
      onNoticeChange("Weighing draft needs intake reference, gross weight, tare weight, and positive net weight.");
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
    onNoticeChange("Weighing draft created locally. Backend weighing preview delegate is intentionally not part of this phase.");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle>Create intake draft</CardTitle>
          <CardDescription>Backend preview delegate validates supplier, storage, and quantity before the draft stays local.</CardDescription>
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
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
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
                  {storageLocations.map((storage) => (
                    <SelectItem key={storage.id} value={storage.id}>{storage.code} · {storage.name}</SelectItem>
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
              <Button type="submit">Preview and create local intake draft</Button>
            </div>
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
                    {formatRawMaterialWeight(draft.quantityKg)} · {getSupplierName(suppliers, draft.supplierId)} · {getStorageLabel(storageLocations, draft.targetStorageId)}
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
                {formatRawMaterialWeight(Math.max(toRawMaterialPositiveNumber(weighingForm.grossKg) - toRawMaterialPositiveNumber(weighingForm.tareKg), 0))}
              </div>
            </div>
            <div className="md:col-span-3">
              <Button type="submit">Create local weighing draft</Button>
            </div>
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
  );
}
