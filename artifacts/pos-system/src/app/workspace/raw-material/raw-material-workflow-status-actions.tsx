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
  getRawMaterialWorkflowReadErrorMessage,
  getRawMaterialWorkflowStatusErrorMessage,
  rawMaterialApiClient,
  rawMaterialWorkflowStatusApiClient,
  type RawMaterialBatch,
  type RawMaterialIntake,
  type RawMaterialKandangPen,
  type RawMaterialProcessingRun,
  type RawMaterialWorkflowReadData,
} from "@/features/raw-material/core-system";

import { formatRawMaterialDate } from "./raw-material-workspace.utils";

type RawMaterialWorkflowStatusActionsProps = {
  onNoticeChange: (message: string) => void;
};

type WorkflowStatusSource = "loading" | "api" | "fallback";
type WorkflowStatusAction =
  | "cancel-intake"
  | "batch-quality"
  | "quarantine-batch"
  | "processing-status"
  | "cancel-processing"
  | "pen-health";

type BatchQualityStatus = "ACCEPTED" | "INSPECTION" | "REJECTED";
type ProcessingStatus = "PLANNED" | "RUNNING" | "COMPLETED";
type PenHealthStatus = "STABLE" | "MONITORING" | "CRITICAL";

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

function getSourceBadge(source: WorkflowStatusSource) {
  if (source === "api") return "Backend workflow data";
  if (source === "loading") return "Loading workflow data";
  return "Status actions disabled: API fallback";
}

function getIntakeLabel(intake?: RawMaterialIntake) {
  return intake ? `${intake.referenceNumber} · ${intake.materialName}` : "No intake selected";
}

function getBatchLabel(batch?: RawMaterialBatch) {
  return batch ? `${batch.lotCode} · ${batch.materialName}` : "No batch selected";
}

function getProcessingRunLabel(run?: RawMaterialProcessingRun) {
  return run ? `${run.runNumber} · ${run.outputName}` : "No processing run selected";
}

function getPenLabel(pen?: RawMaterialKandangPen) {
  return pen ? `${pen.code} · ${pen.flockName}` : "No kandang pen selected";
}

export function RawMaterialWorkflowStatusActions({ onNoticeChange }: RawMaterialWorkflowStatusActionsProps) {
  const [workflowReads, setWorkflowReads] = useState<RawMaterialWorkflowReadData>(() => createEmptyWorkflowReads());
  const [source, setSource] = useState<WorkflowStatusSource>("loading");
  const [status, setStatus] = useState("Loading backend workflow data before enabling workflow status actions.");
  const [submittingAction, setSubmittingAction] = useState<WorkflowStatusAction | null>(null);

  const [cancelIntakeId, setCancelIntakeId] = useState("");
  const [batchQualityForm, setBatchQualityForm] = useState({ batchId: "", qualityStatus: "INSPECTION" as BatchQualityStatus });
  const [quarantineBatchId, setQuarantineBatchId] = useState("");
  const [processingStatusForm, setProcessingStatusForm] = useState({ processingRunId: "", status: "RUNNING" as ProcessingStatus });
  const [cancelProcessingRunId, setCancelProcessingRunId] = useState("");
  const [cancelProcessingNote, setCancelProcessingNote] = useState("Cancel processing and reverse consumed input stock when a production usage ledger exists.");
  const [penHealthForm, setPenHealthForm] = useState({ penId: "", healthStatus: "MONITORING" as PenHealthStatus });

  async function loadWorkflowReads() {
    setSource("loading");
    setStatus("Loading backend workflow data before enabling workflow status actions.");

    try {
      const data = await rawMaterialApiClient.getWorkflowReads();
      setWorkflowReads(data);
      setSource("api");
      setStatus(`Backend workflow data loaded. ${data.intakes.length} intakes · ${data.batches.length} batches · ${data.processingRuns.length} processing runs · ${data.kandangPens.length} pens.`);
      setCancelIntakeId((current) => data.intakes.some((intake) => intake.id === current) ? current : data.intakes[0]?.id ?? "");
      setBatchQualityForm((current) => ({
        ...current,
        batchId: data.batches.some((batch) => batch.id === current.batchId) ? current.batchId : data.batches[0]?.id ?? "",
      }));
      setQuarantineBatchId((current) => data.batches.some((batch) => batch.id === current) ? current : data.batches[0]?.id ?? "");
      setProcessingStatusForm((current) => ({
        ...current,
        processingRunId: data.processingRuns.some((run) => run.id === current.processingRunId) ? current.processingRunId : data.processingRuns[0]?.id ?? "",
      }));
      setCancelProcessingRunId((current) => data.processingRuns.some((run) => run.id === current) ? current : data.processingRuns[0]?.id ?? "");
      setPenHealthForm((current) => ({
        ...current,
        penId: data.kandangPens.some((pen) => pen.id === current.penId) ? current.penId : data.kandangPens[0]?.id ?? "",
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

  const selectedIntake = useMemo(
    () => workflowReads.intakes.find((intake) => intake.id === cancelIntakeId),
    [cancelIntakeId, workflowReads.intakes],
  );
  const selectedBatchQualityBatch = useMemo(
    () => workflowReads.batches.find((batch) => batch.id === batchQualityForm.batchId),
    [batchQualityForm.batchId, workflowReads.batches],
  );
  const selectedQuarantineBatch = useMemo(
    () => workflowReads.batches.find((batch) => batch.id === quarantineBatchId),
    [quarantineBatchId, workflowReads.batches],
  );
  const selectedProcessingRun = useMemo(
    () => workflowReads.processingRuns.find((run) => run.id === processingStatusForm.processingRunId),
    [processingStatusForm.processingRunId, workflowReads.processingRuns],
  );
  const selectedCancelProcessingRun = useMemo(
    () => workflowReads.processingRuns.find((run) => run.id === cancelProcessingRunId),
    [cancelProcessingRunId, workflowReads.processingRuns],
  );
  const selectedPen = useMemo(
    () => workflowReads.kandangPens.find((pen) => pen.id === penHealthForm.penId),
    [penHealthForm.penId, workflowReads.kandangPens],
  );

  const canSubmit = source === "api" && submittingAction === null;

  async function runStatusAction(action: WorkflowStatusAction, work: () => Promise<unknown>, successMessage: string) {
    if (!canSubmit) {
      onNoticeChange("Workflow status actions need backend workflow data. Sample fallback cannot be submitted.");
      return;
    }

    setSubmittingAction(action);
    try {
      await work();
      onNoticeChange(successMessage);
      await loadWorkflowReads();
    } catch (error) {
      onNoticeChange(getRawMaterialWorkflowStatusErrorMessage(error));
    } finally {
      setSubmittingAction(null);
    }
  }

  function handleCancelIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedIntake) {
      onNoticeChange("Select an intake before cancelling it.");
      return;
    }

    void runStatusAction(
      "cancel-intake",
      () => rawMaterialWorkflowStatusApiClient.cancelIntake(selectedIntake.id),
      `Intake cancelled. ${getIntakeLabel(selectedIntake)} · ${formatRawMaterialDate(selectedIntake.receivedAt)}.`,
    );
  }

  function handleSetBatchQuality(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBatchQualityBatch) {
      onNoticeChange("Select a batch before changing quality status.");
      return;
    }

    void runStatusAction(
      "batch-quality",
      () => rawMaterialWorkflowStatusApiClient.setBatchQualityStatus(selectedBatchQualityBatch.id, batchQualityForm.qualityStatus),
      `Batch quality updated. ${getBatchLabel(selectedBatchQualityBatch)} → ${batchQualityForm.qualityStatus}.`,
    );
  }

  function handleQuarantineBatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedQuarantineBatch) {
      onNoticeChange("Select a batch before quarantining it.");
      return;
    }

    void runStatusAction(
      "quarantine-batch",
      () => rawMaterialWorkflowStatusApiClient.quarantineBatch(selectedQuarantineBatch.id),
      `Batch quarantined and deactivated. ${getBatchLabel(selectedQuarantineBatch)}.`,
    );
  }

  function handleSetProcessingStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProcessingRun) {
      onNoticeChange("Select a processing run before changing status.");
      return;
    }

    void runStatusAction(
      "processing-status",
      () => rawMaterialWorkflowStatusApiClient.setProcessingStatus(selectedProcessingRun.id, processingStatusForm.status),
      `Processing status updated. ${getProcessingRunLabel(selectedProcessingRun)} → ${processingStatusForm.status}.`,
    );
  }

  function handleCancelProcessingRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCancelProcessingRun) {
      onNoticeChange("Select a processing run before cancelling it.");
      return;
    }

    void runStatusAction(
      "cancel-processing",
      () => rawMaterialWorkflowStatusApiClient.cancelProcessingRun(selectedCancelProcessingRun.id, cancelProcessingNote.trim() || undefined),
      `Processing run cancelled. ${getProcessingRunLabel(selectedCancelProcessingRun)}. Consumed stock is reversed when a production usage ledger exists.`,
    );
  }

  function handleSetPenHealth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPen) {
      onNoticeChange("Select a kandang pen before changing health status.");
      return;
    }

    void runStatusAction(
      "pen-health",
      () => rawMaterialWorkflowStatusApiClient.setPenHealthStatus(selectedPen.id, penHealthForm.healthStatus),
      `Kandang health updated. ${getPenLabel(selectedPen)} → ${penHealthForm.healthStatus}.`,
    );
  }

  return (
    <Card className="rounded-xl bg-white">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Guarded workflow status delegate</CardTitle>
            <CardDescription>
              Executes backend-guarded status changes only when live workflow data is loaded.
            </CardDescription>
          </div>
          <Badge variant="outline" className={source === "api" ? "border-emerald-200 text-emerald-700" : "border-amber-200 text-amber-700"}>
            {getSourceBadge(source)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm leading-6 text-neutral-600">
          {status}
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <form className="space-y-4 rounded-lg border border-neutral-100 p-4" onSubmit={handleCancelIntake}>
            <div>
              <p className="font-semibold text-neutral-950">Cancel intake</p>
              <p className="mt-1 text-sm text-neutral-500">Uses the guarded intake cancellation endpoint.</p>
            </div>
            <div className="space-y-2">
              <Label>Intake</Label>
              <Select value={cancelIntakeId} onValueChange={setCancelIntakeId} disabled={source !== "api"}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select intake" /></SelectTrigger>
                <SelectContent>
                  {workflowReads.intakes.map((intake) => <SelectItem key={intake.id} value={intake.id}>{intake.referenceNumber} · {intake.materialName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" variant="outline" disabled={!canSubmit || !selectedIntake}>Cancel intake</Button>
          </form>

          <form className="space-y-4 rounded-lg border border-neutral-100 p-4" onSubmit={handleSetBatchQuality}>
            <div>
              <p className="font-semibold text-neutral-950">Set batch quality</p>
              <p className="mt-1 text-sm text-neutral-500">Updates accepted, inspection, or rejected quality status.</p>
            </div>
            <div className="space-y-2">
              <Label>Batch</Label>
              <Select value={batchQualityForm.batchId} onValueChange={(batchId) => setBatchQualityForm((current) => ({ ...current, batchId }))} disabled={source !== "api"}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>
                  {workflowReads.batches.map((batch) => <SelectItem key={batch.id} value={batch.id}>{batch.lotCode} · {batch.qualityStatus}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quality status</Label>
              <Select value={batchQualityForm.qualityStatus} onValueChange={(qualityStatus) => setBatchQualityForm((current) => ({ ...current, qualityStatus: qualityStatus as BatchQualityStatus }))} disabled={source !== "api"}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACCEPTED">ACCEPTED</SelectItem>
                  <SelectItem value="INSPECTION">INSPECTION</SelectItem>
                  <SelectItem value="REJECTED">REJECTED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={!canSubmit || !selectedBatchQualityBatch}>Update batch quality</Button>
          </form>

          <form className="space-y-4 rounded-lg border border-neutral-100 p-4" onSubmit={handleQuarantineBatch}>
            <div>
              <p className="font-semibold text-neutral-950">Quarantine batch</p>
              <p className="mt-1 text-sm text-neutral-500">Deactivates the batch through the guarded backend route.</p>
            </div>
            <div className="space-y-2">
              <Label>Batch</Label>
              <Select value={quarantineBatchId} onValueChange={setQuarantineBatchId} disabled={source !== "api"}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>
                  {workflowReads.batches.map((batch) => <SelectItem key={batch.id} value={batch.id}>{batch.lotCode} · {batch.materialName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" variant="outline" disabled={!canSubmit || !selectedQuarantineBatch}>Quarantine batch</Button>
          </form>

          <form className="space-y-4 rounded-lg border border-neutral-100 p-4" onSubmit={handleSetProcessingStatus}>
            <div>
              <p className="font-semibold text-neutral-950">Set processing status</p>
              <p className="mt-1 text-sm text-neutral-500">Uses backend transition guards for processing status.</p>
            </div>
            <div className="space-y-2">
              <Label>Processing run</Label>
              <Select value={processingStatusForm.processingRunId} onValueChange={(processingRunId) => setProcessingStatusForm((current) => ({ ...current, processingRunId }))} disabled={source !== "api"}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select run" /></SelectTrigger>
                <SelectContent>
                  {workflowReads.processingRuns.map((run) => <SelectItem key={run.id} value={run.id}>{run.runNumber} · {run.status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={processingStatusForm.status} onValueChange={(statusValue) => setProcessingStatusForm((current) => ({ ...current, status: statusValue as ProcessingStatus }))} disabled={source !== "api"}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNED">PLANNED</SelectItem>
                  <SelectItem value="RUNNING">RUNNING</SelectItem>
                  <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={!canSubmit || !selectedProcessingRun}>Update processing status</Button>
          </form>

          <form className="space-y-4 rounded-lg border border-neutral-100 p-4" onSubmit={handleCancelProcessingRun}>
            <div>
              <p className="font-semibold text-neutral-950">Cancel processing run</p>
              <p className="mt-1 text-sm text-neutral-500">Cancels a planned or running processing run and reverses consumed stock when a production usage ledger exists.</p>
            </div>
            <div className="space-y-2">
              <Label>Processing run</Label>
              <Select value={cancelProcessingRunId} onValueChange={setCancelProcessingRunId} disabled={source !== "api"}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select run" /></SelectTrigger>
                <SelectContent>
                  {workflowReads.processingRuns.map((run) => <SelectItem key={run.id} value={run.id}>{run.runNumber} · {run.outputName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rm-cancel-processing-note">Cancellation note</Label>
              <Input
                id="rm-cancel-processing-note"
                value={cancelProcessingNote}
                onChange={(event) => setCancelProcessingNote(event.target.value)}
                disabled={source !== "api"}
              />
            </div>
            <Button type="submit" variant="outline" disabled={!canSubmit || !selectedCancelProcessingRun}>Cancel processing</Button>
          </form>

          <form className="space-y-4 rounded-lg border border-neutral-100 p-4" onSubmit={handleSetPenHealth}>
            <div>
              <p className="font-semibold text-neutral-950">Set kandang health</p>
              <p className="mt-1 text-sm text-neutral-500">Updates pen health through backend kandang guards.</p>
            </div>
            <div className="space-y-2">
              <Label>Kandang pen</Label>
              <Select value={penHealthForm.penId} onValueChange={(penId) => setPenHealthForm((current) => ({ ...current, penId }))} disabled={source !== "api"}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select pen" /></SelectTrigger>
                <SelectContent>
                  {workflowReads.kandangPens.map((pen) => <SelectItem key={pen.id} value={pen.id}>{pen.code} · {pen.healthStatus}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Health status</Label>
              <Select value={penHealthForm.healthStatus} onValueChange={(healthStatus) => setPenHealthForm((current) => ({ ...current, healthStatus: healthStatus as PenHealthStatus }))} disabled={source !== "api"}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STABLE">STABLE</SelectItem>
                  <SelectItem value="MONITORING">MONITORING</SelectItem>
                  <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={!canSubmit || !selectedPen}>Update pen health</Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
