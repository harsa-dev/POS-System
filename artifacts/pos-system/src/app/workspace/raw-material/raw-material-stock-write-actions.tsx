import { useEffect, useMemo, useState, type FormEvent } from "react";

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
  getRawMaterialStockWriteErrorMessage,
  getRawMaterialWorkflowReadErrorMessage,
  rawMaterialApiClient,
  rawMaterialStockWriteApiClient,
  type RawMaterialBatch,
  type RawMaterialProcessingRun,
  type RawMaterialStorageLocation,
  type RawMaterialWorkflowReadData,
} from "@/features/raw-material/core-system";

import { toRawMaterialPositiveNumber } from "./raw-material-workspace.utils";

type RawMaterialStockWriteActionsProps = {
  onNoticeChange: (message: string) => void;
};

type StockWriteSource = "loading" | "api" | "fallback";

type StockWriteAction = "adjust" | "transfer" | "consume";

function createEmptyWorkflowReads(): RawMaterialWorkflowReadData {
  return {
    suppliers: [],
    storageLocations: [],
    intakes: [],
    weighings: [],
    batches: [],
    processingRuns: [],
    kandangPens: [],
    stockMovements: [],
  };
}

function getBatchLabel(batch?: RawMaterialBatch) {
  return batch ? `${batch.lotCode} · ${batch.materialName}` : "No batch selected";
}

function getStorageLabel(storage?: RawMaterialStorageLocation) {
  return storage ? `${storage.code} · ${storage.name}` : "No storage selected";
}

function getProcessingRunLabel(run?: RawMaterialProcessingRun) {
  return run ? `${run.runNumber} · ${run.outputName}` : "No processing run selected";
}

function getWriteSourceBadge(source: StockWriteSource) {
  if (source === "api") return "Backend workflow data";
  if (source === "loading") return "Loading workflow data";
  return "Write disabled: API fallback";
}

export function RawMaterialStockWriteActions({ onNoticeChange }: RawMaterialStockWriteActionsProps) {
  const [workflowReads, setWorkflowReads] = useState<RawMaterialWorkflowReadData>(() => createEmptyWorkflowReads());
  const [source, setSource] = useState<StockWriteSource>("loading");
  const [status, setStatus] = useState("Loading backend workflow data before enabling guarded stock writes.");
  const [submittingAction, setSubmittingAction] = useState<StockWriteAction | null>(null);

  const [adjustmentForm, setAdjustmentForm] = useState({
    batchId: "",
    deltaQuantity: "25",
    reason: "STOCK_COUNT" as "MANUAL_ADJUSTMENT" | "STOCK_COUNT" | "CORRECTION",
    note: "Stock count correction from Raw Material workspace.",
  });

  const [transferForm, setTransferForm] = useState({
    batchId: "",
    targetStorageLocationId: "",
    note: "Guarded transfer from Raw Material workspace.",
  });

  const [consumeForm, setConsumeForm] = useState({
    processingRunId: "",
    note: "Guarded processing consumption from Raw Material workspace.",
  });

  async function loadWorkflowReads() {
    setSource("loading");
    setStatus("Loading backend workflow data before enabling guarded stock writes.");

    try {
      const data = await rawMaterialApiClient.getWorkflowReads();
      setWorkflowReads(data);
      setSource("api");
      setStatus(`Backend workflow data loaded. ${data.batches.length} batches · ${data.storageLocations.length} storage locations · ${data.processingRuns.length} processing runs.`);
      setAdjustmentForm((current) => ({
        ...current,
        batchId: data.batches[0]?.id ?? current.batchId,
      }));
      setTransferForm((current) => {
        const selectedBatch = data.batches.find((batch) => batch.id === current.batchId) ?? data.batches[0];
        const fallbackTarget = data.storageLocations.find((storage) => storage.id !== selectedBatch?.storageId) ?? data.storageLocations[0];

        return {
          ...current,
          batchId: selectedBatch?.id ?? current.batchId,
          targetStorageLocationId: fallbackTarget?.id ?? current.targetStorageLocationId,
        };
      });
      setConsumeForm((current) => ({
        ...current,
        processingRunId: data.processingRuns[0]?.id ?? current.processingRunId,
      }));
    } catch (error) {
      setWorkflowReads(createEmptyWorkflowReads());
      setSource("fallback");
      setStatus(getRawMaterialWorkflowReadErrorMessage(error));
    }
  }

  useEffect(() => {
    void loadWorkflowReads();
  }, []);

  const selectedAdjustmentBatch = useMemo(
    () => workflowReads.batches.find((batch) => batch.id === adjustmentForm.batchId),
    [adjustmentForm.batchId, workflowReads.batches],
  );
  const selectedTransferBatch = useMemo(
    () => workflowReads.batches.find((batch) => batch.id === transferForm.batchId),
    [transferForm.batchId, workflowReads.batches],
  );
  const selectedTransferTarget = useMemo(
    () => workflowReads.storageLocations.find((storage) => storage.id === transferForm.targetStorageLocationId),
    [transferForm.targetStorageLocationId, workflowReads.storageLocations],
  );
  const selectedProcessingRun = useMemo(
    () => workflowReads.processingRuns.find((run) => run.id === consumeForm.processingRunId),
    [consumeForm.processingRunId, workflowReads.processingRuns],
  );

  const canSubmitWrites = source === "api" && submittingAction === null;

  async function handleAdjustStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const deltaQuantity = Number(adjustmentForm.deltaQuantity);
    if (!canSubmitWrites || !adjustmentForm.batchId || !Number.isFinite(deltaQuantity) || deltaQuantity === 0 || !adjustmentForm.note.trim()) {
      onNoticeChange("Stock adjustment needs backend data, a batch, non-zero delta quantity, reason, and note.");
      return;
    }

    setSubmittingAction("adjust");
    try {
      const movement = await rawMaterialStockWriteApiClient.adjustStock({
        batchId: adjustmentForm.batchId,
        deltaQuantity,
        reason: adjustmentForm.reason,
        note: adjustmentForm.note.trim(),
      });
      onNoticeChange(`Stock adjustment applied. Movement ${movement.id} · ${movement.reason} · ${formatRawMaterialWeight(movement.quantity)}.`);
      await loadWorkflowReads();
    } catch (error) {
      onNoticeChange(getRawMaterialStockWriteErrorMessage(error));
    } finally {
      setSubmittingAction(null);
    }
  }

  async function handleTransferStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmitWrites || !selectedTransferBatch || !transferForm.targetStorageLocationId || selectedTransferBatch.storageId === transferForm.targetStorageLocationId) {
      onNoticeChange("Stock transfer needs backend data, a batch, and a different target storage location.");
      return;
    }

    setSubmittingAction("transfer");
    try {
      const movement = await rawMaterialStockWriteApiClient.transferStock({
        batchId: selectedTransferBatch.id,
        targetStorageLocationId: transferForm.targetStorageLocationId,
        note: transferForm.note.trim() || undefined,
      });
      onNoticeChange(`Stock transfer applied. Movement ${movement.id} · ${getBatchLabel(selectedTransferBatch)} → ${getStorageLabel(selectedTransferTarget)}.`);
      await loadWorkflowReads();
    } catch (error) {
      onNoticeChange(getRawMaterialStockWriteErrorMessage(error));
    } finally {
      setSubmittingAction(null);
    }
  }

  async function handleConsumeProcessing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmitWrites || !consumeForm.processingRunId) {
      onNoticeChange("Processing consumption needs backend data and a processing run.");
      return;
    }

    setSubmittingAction("consume");
    try {
      const movement = await rawMaterialStockWriteApiClient.consumeForProcessing({
        processingRunId: consumeForm.processingRunId,
        note: consumeForm.note.trim() || undefined,
      });
      onNoticeChange(`Processing consumption applied. Movement ${movement.id} · ${getProcessingRunLabel(selectedProcessingRun)} · ${formatRawMaterialWeight(movement.quantity)}.`);
      await loadWorkflowReads();
    } catch (error) {
      onNoticeChange(getRawMaterialStockWriteErrorMessage(error));
    } finally {
      setSubmittingAction(null);
    }
  }

  return (
    <Card className="rounded-xl bg-white">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Guarded stock write delegate</CardTitle>
            <CardDescription>
              Executes backend-hardened stock adjustment, transfer, and processing consumption only when API workflow data is loaded.
            </CardDescription>
          </div>
          <Badge variant="outline" className={source === "api" ? "border-emerald-200 text-emerald-700" : "border-amber-200 text-amber-700"}>
            {getWriteSourceBadge(source)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm leading-6 text-neutral-600">
          {status}
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <form className="space-y-4 rounded-lg border border-neutral-100 p-4" onSubmit={handleAdjustStock}>
            <div>
              <p className="font-semibold text-neutral-950">Adjust stock</p>
              <p className="mt-1 text-sm text-neutral-500">Uses manual adjustment, stock count, or correction guard rules.</p>
            </div>
            <div className="space-y-2">
              <Label>Batch</Label>
              <Select value={adjustmentForm.batchId} onValueChange={(batchId) => setAdjustmentForm((current) => ({ ...current, batchId }))} disabled={source !== "api"}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>
                  {workflowReads.batches.map((batch) => <SelectItem key={batch.id} value={batch.id}>{batch.lotCode} · {formatRawMaterialWeight(batch.remainingKg)} remaining</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rm-adjust-delta">Delta kg</Label>
                <Input id="rm-adjust-delta" type="number" value={adjustmentForm.deltaQuantity} onChange={(event) => setAdjustmentForm((current) => ({ ...current, deltaQuantity: event.target.value }))} disabled={source !== "api"} />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Select value={adjustmentForm.reason} onValueChange={(reason) => setAdjustmentForm((current) => ({ ...current, reason: reason as typeof current.reason }))} disabled={source !== "api"}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STOCK_COUNT">STOCK_COUNT</SelectItem>
                    <SelectItem value="CORRECTION">CORRECTION</SelectItem>
                    <SelectItem value="MANUAL_ADJUSTMENT">MANUAL_ADJUSTMENT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rm-adjust-note">Note</Label>
              <Input id="rm-adjust-note" value={adjustmentForm.note} onChange={(event) => setAdjustmentForm((current) => ({ ...current, note: event.target.value }))} disabled={source !== "api"} />
            </div>
            <p className="text-xs leading-5 text-neutral-500">Selected: {getBatchLabel(selectedAdjustmentBatch)}</p>
            <Button type="submit" disabled={!canSubmitWrites}>{submittingAction === "adjust" ? "Applying..." : "Apply adjustment"}</Button>
          </form>

          <form className="space-y-4 rounded-lg border border-neutral-100 p-4" onSubmit={handleTransferStock}>
            <div>
              <p className="font-semibold text-neutral-950">Transfer stock</p>
              <p className="mt-1 text-sm text-neutral-500">Moves the whole remaining batch to another storage location.</p>
            </div>
            <div className="space-y-2">
              <Label>Batch</Label>
              <Select value={transferForm.batchId} onValueChange={(batchId) => setTransferForm((current) => ({ ...current, batchId }))} disabled={source !== "api"}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>
                  {workflowReads.batches.map((batch) => <SelectItem key={batch.id} value={batch.id}>{batch.lotCode} · {formatRawMaterialWeight(batch.remainingKg)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target storage</Label>
              <Select value={transferForm.targetStorageLocationId} onValueChange={(targetStorageLocationId) => setTransferForm((current) => ({ ...current, targetStorageLocationId }))} disabled={source !== "api"}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select target storage" /></SelectTrigger>
                <SelectContent>
                  {workflowReads.storageLocations.map((storage) => <SelectItem key={storage.id} value={storage.id}>{storage.code} · {storage.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rm-transfer-note">Note</Label>
              <Input id="rm-transfer-note" value={transferForm.note} onChange={(event) => setTransferForm((current) => ({ ...current, note: event.target.value }))} disabled={source !== "api"} />
            </div>
            <p className="text-xs leading-5 text-neutral-500">Source: {getStorageLabel(workflowReads.storageLocations.find((storage) => storage.id === selectedTransferBatch?.storageId))}</p>
            <Button type="submit" disabled={!canSubmitWrites}>{submittingAction === "transfer" ? "Transferring..." : "Transfer batch"}</Button>
          </form>

          <form className="space-y-4 rounded-lg border border-neutral-100 p-4" onSubmit={handleConsumeProcessing}>
            <div>
              <p className="font-semibold text-neutral-950">Consume for processing</p>
              <p className="mt-1 text-sm text-neutral-500">Consumes the processing run input batch through the guarded backend ledger.</p>
            </div>
            <div className="space-y-2">
              <Label>Processing run</Label>
              <Select value={consumeForm.processingRunId} onValueChange={(processingRunId) => setConsumeForm((current) => ({ ...current, processingRunId }))} disabled={source !== "api"}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select processing run" /></SelectTrigger>
                <SelectContent>
                  {workflowReads.processingRuns.map((run) => <SelectItem key={run.id} value={run.id}>{run.runNumber} · {run.outputName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rm-consume-note">Note</Label>
              <Input id="rm-consume-note" value={consumeForm.note} onChange={(event) => setConsumeForm((current) => ({ ...current, note: event.target.value }))} disabled={source !== "api"} />
            </div>
            <p className="text-xs leading-5 text-neutral-500">Selected: {getProcessingRunLabel(selectedProcessingRun)}</p>
            <Button type="submit" disabled={!canSubmitWrites}>{submittingAction === "consume" ? "Consuming..." : "Consume processing input"}</Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
