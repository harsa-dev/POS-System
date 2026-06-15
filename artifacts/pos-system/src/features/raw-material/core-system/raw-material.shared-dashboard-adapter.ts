import {
  formatRawMaterialCurrency,
  formatRawMaterialWeight,
  getRawMaterialStorageUsagePercent,
  rawMaterialBatches,
  rawMaterialIntakes,
  rawMaterialKandangPens,
  rawMaterialProcessingRuns,
  rawMaterialScaleFeatures,
  rawMaterialScaleProfiles,
  rawMaterialStorageLocations,
  rawMaterialSuppliers,
  rawMaterialWeighings,
} from "./raw-material.mock-data";
import type { RawMaterialScaleFeatureStatus } from "./raw-material.types";

export type RawMaterialSharedDashboardId =
  | "overview"
  | "sales"
  | "customers"
  | "inventory"
  | "cashflow"
  | "financial-reports"
  | "invoice-generator"
  | "shift-reports"
  | "team-management"
  | "employee-performance"
  | "approvals"
  | "hpp-calculator";

export type RawMaterialSharedMetric = Readonly<{
  label: string;
  value: string;
  helper: string;
}>;

export type RawMaterialSharedRow = Readonly<{
  title: string;
  primary: string;
  secondary: string;
  status: "healthy" | "review" | "blocked" | "planned";
}>;

export type RawMaterialSharedDashboardContext = Readonly<{
  id: RawMaterialSharedDashboardId;
  title: string;
  description: string;
  metrics: readonly RawMaterialSharedMetric[];
  rows: readonly RawMaterialSharedRow[];
  bridgeNote: string;
}>;

const acceptedKg = rawMaterialIntakes.reduce((total, intake) => {
  if (intake.unit !== "kg") return total;
  return total + intake.acceptedQuantity;
}, 0);

const rejectedKg = rawMaterialIntakes.reduce((total, intake) => {
  if (intake.unit !== "kg") return total;
  return total + intake.rejectedQuantity;
}, 0);

const totalRemainingKg = rawMaterialBatches.reduce((total, batch) => total + batch.remainingKg, 0);
const averageStorageUsage = Math.round(
  rawMaterialStorageLocations.reduce(
    (total, location) => total + getRawMaterialStorageUsagePercent(location),
    0,
  ) / rawMaterialStorageLocations.length,
);
const inspectionBatches = rawMaterialBatches.filter((batch) => batch.qualityStatus === "inspection");
const runningProcesses = rawMaterialProcessingRuns.filter((run) => run.status === "running");
const monitoringPens = rawMaterialKandangPens.filter((pen) => pen.healthStatus !== "stable");
const futureProductionFeatures = rawMaterialScaleFeatures.filter(
  (feature) => feature.scale === "factory",
);
const planningPreviewFeatures = rawMaterialScaleFeatures.filter((feature) => feature.status === "planning-preview");
const projectedProcurementSpend = 18_750_000;
const projectedRejectedLoss = Math.round(rejectedKg * 5_250);
const projectedAcceptedUnitCost = acceptedKg > 0 ? Math.round(projectedProcurementSpend / acceptedKg) : 0;

function getStatusFromFeatureStatus(status: RawMaterialScaleFeatureStatus): RawMaterialSharedRow["status"] {
  if (status === "available") return "healthy";
  if (status === "future-production") return "planned";
  return "review";
}

function getIntakeRows(): readonly RawMaterialSharedRow[] {
  return rawMaterialIntakes.map((intake) => ({
    title: intake.referenceNumber,
    primary: `${intake.materialName} · accepted ${intake.acceptedQuantity} ${intake.unit}`,
    secondary: `Rejected ${intake.rejectedQuantity} ${intake.unit} · target storage ${intake.targetStorageId}`,
    status: intake.qualityStatus === "rejected" ? "blocked" : intake.qualityStatus === "inspection" ? "review" : "healthy",
  }));
}

function getBatchRows(): readonly RawMaterialSharedRow[] {
  return rawMaterialBatches.map((batch) => ({
    title: batch.lotCode,
    primary: `${batch.materialName} · remaining ${formatRawMaterialWeight(batch.remainingKg)}`,
    secondary: `Expiry ${batch.expiryDate} · storage ${batch.storageId}`,
    status: batch.qualityStatus === "inspection" ? "review" : "healthy",
  }));
}

function getStorageRows(): readonly RawMaterialSharedRow[] {
  return rawMaterialStorageLocations.map((location) => {
    const usage = getRawMaterialStorageUsagePercent(location);

    return {
      title: location.code,
      primary: `${location.name} · ${location.type}`,
      secondary: `${formatRawMaterialWeight(location.usedKg)} used from ${formatRawMaterialWeight(location.capacityKg)} · ${usage}% usage`,
      status: usage >= 90 ? "blocked" : usage >= 70 ? "review" : "healthy",
    };
  });
}

function getSupplierRows(): readonly RawMaterialSharedRow[] {
  return rawMaterialSuppliers.map((supplier) => ({
    title: supplier.name,
    primary: `${supplier.contactPerson} · lead time ${supplier.leadTimeDays} days`,
    secondary: `${supplier.category} · reliability ${supplier.reliabilityScore}% · ${supplier.phone}`,
    status: supplier.reliabilityScore >= 90 ? "healthy" : "review",
  }));
}

function getProcessingRows(): readonly RawMaterialSharedRow[] {
  return rawMaterialProcessingRuns.map((run) => ({
    title: run.runNumber,
    primary: `${run.outputName} · input ${formatRawMaterialWeight(run.inputKg)}`,
    secondary: `Output ${formatRawMaterialWeight(run.outputKg)} · extra ${formatRawMaterialWeight(run.byproductKg)}`,
    status: run.status === "completed" ? "healthy" : run.status === "running" ? "review" : "planned",
  }));
}

function getKandangRows(): readonly RawMaterialSharedRow[] {
  return rawMaterialKandangPens.map((pen) => ({
    title: pen.code,
    primary: `${pen.flockName} · occupancy ${pen.occupancy}/${pen.capacity}`,
    secondary: `Feed batch ${pen.feedBatchId} · condition ${pen.healthStatus}`,
    status: pen.healthStatus === "critical" ? "blocked" : pen.healthStatus === "monitoring" ? "review" : "healthy",
  }));
}

function getScaleFeatureRows(): readonly RawMaterialSharedRow[] {
  return rawMaterialScaleFeatures.map((feature) => ({
    title: feature.title,
    primary: `${feature.dashboardArea} · ${feature.previewMetric}`,
    secondary: `${feature.scale} scale · ${feature.purpose}`,
    status: getStatusFromFeatureStatus(feature.status),
  }));
}

function getHppRows(): readonly RawMaterialSharedRow[] {
  return [
    ...rawMaterialBatches.map((batch) => ({
      title: batch.lotCode,
      primary: `${batch.materialName} · available ${formatRawMaterialWeight(batch.remainingKg)}`,
      secondary: `Projected unit cost ${formatRawMaterialCurrency(projectedAcceptedUnitCost)}/kg · quality ${batch.qualityStatus}`,
      status: batch.qualityStatus === "inspection" ? "review" as const : "healthy" as const,
    })),
    ...rawMaterialProcessingRuns.map((run) => ({
      title: run.runNumber,
      primary: `${run.outputName} · input ${formatRawMaterialWeight(run.inputKg)}`,
      secondary: `Output ${formatRawMaterialWeight(run.outputKg)} · yield preview needs real costing rules later`,
      status: run.status === "completed" ? "healthy" as const : "planned" as const,
    })),
  ];
}

const contexts: Record<RawMaterialSharedDashboardId, RawMaterialSharedDashboardContext> = {
  overview: {
    id: "overview",
    title: "Raw material overview bridge",
    description: "Raw material mode injects intake, batch, storage, kandang, processing, and scale-readiness signals into the shared overview dashboard.",
    metrics: [
      { label: "Accepted raw material", value: formatRawMaterialWeight(acceptedKg), helper: "Accepted kg from sample intake records" },
      { label: "Remaining batch stock", value: formatRawMaterialWeight(totalRemainingKg), helper: "Sample remaining quantity across traceable lots" },
      { label: "Scale roadmap", value: String(rawMaterialScaleProfiles.length), helper: "Small, medium, and factory profiles" },
    ],
    rows: [...getIntakeRows(), ...getBatchRows(), ...getKandangRows()].slice(0, 8),
    bridgeNote: "Use this as the raw material executive context above the existing shared overview.",
  },
  sales: {
    id: "sales",
    title: "Raw material analytics bridge",
    description: "Raw material mode maps intake volume, rejected quantity, processing output, and batch readiness into the shared sales analytics surface as operational analytics.",
    metrics: [
      { label: "Accepted kg", value: formatRawMaterialWeight(acceptedKg), helper: "Operational intake volume" },
      { label: "Rejected kg", value: formatRawMaterialWeight(rejectedKg), helper: "Quality loss preview" },
      { label: "Running process", value: String(runningProcesses.length), helper: "Processing work still active" },
    ],
    rows: [...getIntakeRows(), ...getProcessingRows()],
    bridgeNote: "Shared analytics stays generic; raw material contributes volume, quality, and processing signals only.",
  },
  customers: {
    id: "customers",
    title: "Raw material partners bridge",
    description: "Supplier and partner signals are mapped into the shared customers and partners dashboard.",
    metrics: [
      { label: "Suppliers", value: String(rawMaterialSuppliers.length), helper: "Sample supplier records" },
      { label: "Avg lead time", value: `${Math.round(rawMaterialSuppliers.reduce((total, supplier) => total + supplier.leadTimeDays, 0) / rawMaterialSuppliers.length)} days`, helper: "Supplier planning signal" },
      { label: "Reliability watch", value: String(rawMaterialSuppliers.filter((supplier) => supplier.reliabilityScore < 90).length), helper: "Suppliers below 90%" },
    ],
    rows: getSupplierRows(),
    bridgeNote: "Customers dashboard becomes supplier/partner context in raw material mode.",
  },
  inventory: {
    id: "inventory",
    title: "Raw material inventory bridge",
    description: "Raw material batches, storage capacity, quality state, and FEFO-ready lot data are mapped into the shared inventory dashboard.",
    metrics: [
      { label: "Active lots", value: String(rawMaterialBatches.length), helper: "Traceable sample batches" },
      { label: "Inspection lots", value: String(inspectionBatches.length), helper: "Quality status needs review" },
      { label: "Storage usage", value: `${averageStorageUsage}%`, helper: "Average sample storage usage" },
    ],
    rows: [...getBatchRows(), ...getStorageRows()],
    bridgeNote: "Inventory dashboard now has raw-material lot, storage, and quality context without stock mutation.",
  },
  cashflow: {
    id: "cashflow",
    title: "Raw material cashflow bridge",
    description: "Raw material procurement pressure, intake volume, and future reorder planning are surfaced beside the shared cashflow dashboard.",
    metrics: [
      { label: "Procurement preview", value: formatRawMaterialCurrency(projectedProcurementSpend), helper: "Projected planned raw-material spend" },
      { label: "Open intake", value: String(rawMaterialIntakes.filter((intake) => intake.qualityStatus === "inspection").length), helper: "Inspection can delay payable readiness" },
      { label: "Reorder signals", value: String(planningPreviewFeatures.length), helper: "Scale features still in planning preview" },
    ],
    rows: [...getSupplierRows(), ...getScaleFeatureRows().slice(0, 3)],
    bridgeNote: "Cashflow remains preview-only; no supplier payable or purchase order record is created.",
  },
  "financial-reports": {
    id: "financial-reports",
    title: "Raw material financial report bridge",
    description: "Raw material mode exposes cost planning, rejection loss, storage pressure, and processing yield as financial-report context.",
    metrics: [
      { label: "Planned spend", value: formatRawMaterialCurrency(projectedProcurementSpend), helper: "Projected procurement estimate" },
      { label: "Quality loss", value: formatRawMaterialWeight(rejectedKg), helper: "Rejected intake quantity" },
      { label: "Yield watch", value: `${rawMaterialProcessingRuns.length} runs`, helper: "Processing output preview" },
    ],
    rows: [...getProcessingRows(), ...getBatchRows()],
    bridgeNote: "Financial reporting gets operational cost context only; accounting export is still out of scope.",
  },
  "invoice-generator": {
    id: "invoice-generator",
    title: "Raw material invoice bridge",
    description: "Supplier deliveries, receiving references, and batch acceptance data are mapped as invoice-ready preview context.",
    metrics: [
      { label: "Receiving refs", value: String(rawMaterialIntakes.length), helper: "Supplier intake references" },
      { label: "Supplier candidates", value: String(rawMaterialSuppliers.length), helper: "Potential billing parties" },
      { label: "Invoice hold", value: String(inspectionBatches.length), helper: "Lots still under quality review" },
    ],
    rows: [...getIntakeRows(), ...getSupplierRows()],
    bridgeNote: "This prepares supplier invoice surfaces without creating invoice records.",
  },
  "shift-reports": {
    id: "shift-reports",
    title: "Raw material shift report bridge",
    description: "Weighing operators, receiving activity, and processing runs are exposed to the shared shift reporting concept.",
    metrics: [
      { label: "Weighing records", value: String(rawMaterialWeighings.length), helper: "Scale station entries" },
      { label: "Operators", value: String(new Set(rawMaterialWeighings.map((item) => item.operatorName)).size), helper: "Sample weighing staff" },
      { label: "Process runs", value: String(rawMaterialProcessingRuns.length), helper: "Production support handoff" },
    ],
    rows: [...rawMaterialWeighings.map((weighing) => ({
      title: weighing.referenceNumber,
      primary: `${weighing.operatorName} · ${weighing.stationName}`,
      secondary: `Net ${formatRawMaterialWeight(weighing.netKg)} · intake ${weighing.intakeId}`,
      status: "healthy" as const,
    })), ...getProcessingRows()],
    bridgeNote: "Shift reporting stays operational and preview-only; no attendance or payroll write exists.",
  },
  "team-management": {
    id: "team-management",
    title: "Raw material team bridge",
    description: "Raw material operators, supplier ownership, and kandang monitoring responsibilities are surfaced in shared team management.",
    metrics: [
      { label: "Operators", value: String(new Set(rawMaterialWeighings.map((item) => item.operatorName)).size), helper: "Sample scale operators" },
      { label: "Supplier contacts", value: String(rawMaterialSuppliers.length), helper: "External responsibility map" },
      { label: "Kandang watch", value: String(monitoringPens.length), helper: "Pens needing review" },
    ],
    rows: [...getKandangRows(), ...getSupplierRows()],
    bridgeNote: "Team dashboard shows responsibility context only; HR schema remains untouched.",
  },
  "employee-performance": {
    id: "employee-performance",
    title: "Raw material performance bridge",
    description: "Weighing accuracy, receiving volume, supplier follow-up, and kandang review signals are mapped into shared performance review.",
    metrics: [
      { label: "Measured net", value: formatRawMaterialWeight(rawMaterialWeighings.reduce((total, item) => total + item.netKg, 0)), helper: "Total net weighing" },
      { label: "Review rows", value: String(inspectionBatches.length + monitoringPens.length), helper: "Operational attention items" },
      { label: "Completed runs", value: String(rawMaterialProcessingRuns.filter((run) => run.status === "completed").length), helper: "Sample processing completion" },
    ],
    rows: [...getProcessingRows(), ...getKandangRows()],
    bridgeNote: "Performance remains operational preview context and must not become payroll logic yet.",
  },
  approvals: {
    id: "approvals",
    title: "Raw material approval bridge",
    description: "Quality inspection, storage pressure, factory planning, and future production controls are surfaced in shared approvals.",
    metrics: [
      { label: "Quality holds", value: String(inspectionBatches.length), helper: "Lots requiring review" },
      { label: "Factory backlog", value: String(futureProductionFeatures.length), helper: "Features marked factory-scale" },
      { label: "Monitoring pens", value: String(monitoringPens.length), helper: "Kandang status review" },
    ],
    rows: [...getBatchRows().filter((row) => row.status !== "healthy"), ...getKandangRows().filter((row) => row.status !== "healthy"), ...getScaleFeatureRows().filter((row) => row.status === "planned")],
    bridgeNote: "Approvals are displayed as review context only; no approval mutation or audit write exists.",
  },
  "hpp-calculator": {
    id: "hpp-calculator",
    title: "Raw material HPP bridge",
    description: "Raw material mode turns HPP into a material-cost, rejection-loss, and processing-yield preview instead of a restaurant recipe costing screen.",
    metrics: [
      { label: "Projected unit cost", value: `${formatRawMaterialCurrency(projectedAcceptedUnitCost)}/kg`, helper: "Planned spend divided by accepted kg" },
      { label: "Rejected loss", value: formatRawMaterialCurrency(projectedRejectedLoss), helper: "Rejected kg multiplied by projected material rate" },
      { label: "Yield inputs", value: String(rawMaterialProcessingRuns.length), helper: "Processing runs available for costing preview" },
    ],
    rows: getHppRows(),
    bridgeNote: "HPP base dashboard is hidden in raw material mode; this bridge only previews costing logic before finance/schema work exists.",
  },
};

export function getRawMaterialSharedDashboardContext(id: RawMaterialSharedDashboardId) {
  return contexts[id];
}

export const rawMaterialSharedDashboardIds = Object.keys(contexts) as RawMaterialSharedDashboardId[];
