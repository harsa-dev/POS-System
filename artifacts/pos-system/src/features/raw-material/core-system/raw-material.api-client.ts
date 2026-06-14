import { getApiErrorMessage } from "@/lib/api/api-client";

import { formatRawMaterialWeight } from "./raw-material.mock-data";
import {
  rawMaterialGeneratedApiData,
  type RawMaterialGeneratedApiOperationId,
} from "./raw-material.generated-api-client";
import type {
  RawMaterialBatch,
  RawMaterialIntake,
  RawMaterialKandangPen,
  RawMaterialMetric,
  RawMaterialProcessingRun,
  RawMaterialStockMovement,
  RawMaterialStorageLocation,
  RawMaterialSupplier,
  RawMaterialWeighing,
  RawMaterialWorkflowReadData,
} from "./raw-material.types";

type DistributionItem = Readonly<{
  key: string;
  count: number;
}>;

type StockDistributionItem = Readonly<{
  key: string;
  count: number;
  quantity: number;
}>;

type LatestRawMaterialActivity = Readonly<{
  kind: "intake" | "batch" | "processing-run" | "stock-movement";
  id: string;
  label: string;
  occurredAt: string;
}>;

export type RawMaterialSummaryResponse = Readonly<{
  generatedAt: string;
  source: "api-server-prisma-raw-material-summary";
  business: {
    id: string;
    name: string;
    mode: string;
  };
  suppliers: {
    total: number;
    active: number;
    inactive: number;
    averageReliabilityScore: number;
  };
  storage: {
    activeLocations: number;
    capacityKg: number;
    usedKg: number;
    availableKg: number;
    usageRate: number;
  };
  intakes: {
    total: number;
    receivedQuantity: number;
    acceptedQuantity: number;
    rejectedQuantity: number;
    acceptanceRate: number;
    qualityDistribution: DistributionItem[];
  };
  weighings: {
    total: number;
    netKg: number;
  };
  batches: {
    total: number;
    active: number;
    quantity: number;
    remainingQuantity: number;
    consumedQuantity: number;
    nearExpiry: number;
    qualityDistribution: DistributionItem[];
  };
  processing: {
    totalRuns: number;
    inputQuantity: number;
    outputQuantity: number;
    byproductQuantity: number;
    wasteQuantity: number;
    yieldRate: number;
    statusDistribution: DistributionItem[];
  };
  kandang: {
    totalPens: number;
    activePens: number;
    capacity: number;
    occupancy: number;
    occupancyRate: number;
    healthDistribution: DistributionItem[];
  };
  stockMovements: {
    total: number;
    byType: StockDistributionItem[];
    byReason: StockDistributionItem[];
    latest: LatestRawMaterialActivity | null;
  };
  latestActivity: LatestRawMaterialActivity | null;
}>;

type BackendRawMaterialSupplier = Readonly<{
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email?: string | null;
  category: string;
  reliabilityScore: number;
  leadTimeDays: number;
}>;

type BackendRawMaterialStorageLocation = Readonly<{
  id: string;
  code: string;
  name: string;
  type: string;
  capacityKg: number;
  usedKg: number;
}>;

type BackendRawMaterialIntake = Readonly<{
  id: string;
  referenceNumber: string;
  supplierId: string;
  materialName: string;
  unit: string;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  qualityStatus: string;
  receivedAt: string;
  targetStorageLocationId: string;
}>;

type BackendRawMaterialWeighing = Readonly<{
  id: string;
  referenceNumber: string;
  intakeId: string;
  stationName: string;
  grossKg: number;
  tareKg: number;
  netKg: number;
  operatorName: string;
  measuredAt: string;
}>;

type BackendRawMaterialBatch = Readonly<{
  id: string;
  lotCode: string;
  intakeId: string;
  materialName: string;
  quantity: number;
  remainingQuantity: number;
  qualityStatus: string;
  expiryDate: string | null;
  storageLocationId: string;
}>;

type BackendRawMaterialProcessingRun = Readonly<{
  id: string;
  runNumber: string;
  inputBatchId: string;
  outputName: string;
  inputQuantity: number;
  outputQuantity: number;
  byproductQuantity: number;
  status: string;
}>;

type BackendRawMaterialKandangPen = Readonly<{
  id: string;
  code: string;
  flockName: string;
  capacity: number;
  occupancy: number;
  feedBatchId: string | null;
  healthStatus: string;
}>;

type BackendRawMaterialStockMovement = Readonly<{
  id: string;
  batchId: string;
  batchLotCode: string | null;
  materialName: string | null;
  sourceStorageLocationId: string | null;
  sourceStorageCode: string | null;
  targetStorageLocationId: string | null;
  targetStorageCode: string | null;
  type: string;
  reason: string;
  source: string;
  sourceId: string | null;
  quantity: number;
  beforeQuantity: number | null;
  afterQuantity: number | null;
  note: string | null;
  createdAt: string;
}>;

async function fetchRawMaterialData<TData>(operationId: RawMaterialGeneratedApiOperationId, signal?: AbortSignal) {
  return rawMaterialGeneratedApiData<TData>(operationId, { signal });
}

function normalizeUpperSnake(value: string) {
  return value.trim().toUpperCase();
}

function toQualityStatus(value: string): RawMaterialIntake["qualityStatus"] {
  const normalized = normalizeUpperSnake(value);
  if (normalized === "ACCEPTED") return "accepted";
  if (normalized === "REJECTED") return "rejected";
  return "inspection";
}

function toUnit(value: string): RawMaterialIntake["unit"] {
  const normalized = normalizeUpperSnake(value);
  if (normalized === "SACK") return "sack";
  if (normalized === "CRATE") return "crate";
  if (normalized === "HEAD") return "head";
  return "kg";
}

function toSupplierCategory(value: string): RawMaterialSupplier["category"] {
  const normalized = normalizeUpperSnake(value);
  if (normalized === "FEED") return "Feed";
  if (normalized === "LIVESTOCK") return "Livestock";
  if (normalized === "PACKAGING") return "Packaging";
  return "Raw Goods";
}

function toStorageType(value: string): RawMaterialStorageLocation["type"] {
  const normalized = normalizeUpperSnake(value);
  if (normalized === "COLD") return "Cold";
  if (normalized === "OPEN_YARD") return "Open Yard";
  if (normalized === "KANDANG_SUPPORT") return "Kandang Support";
  return "Dry";
}

function toProcessingStatus(value: string): RawMaterialProcessingRun["status"] {
  const normalized = normalizeUpperSnake(value);
  if (normalized === "RUNNING") return "running";
  if (normalized === "COMPLETED") return "completed";
  if (normalized === "CANCELLED") return "cancelled";
  return "planned";
}

function toHealthStatus(value: string): RawMaterialKandangPen["healthStatus"] {
  const normalized = normalizeUpperSnake(value);
  if (normalized === "MONITORING") return "monitoring";
  if (normalized === "CRITICAL") return "critical";
  return "stable";
}

function toRawMaterialSupplier(row: BackendRawMaterialSupplier): RawMaterialSupplier {
  return {
    id: row.id,
    name: row.name,
    contactPerson: row.contactPerson ?? row.email ?? "No contact person",
    phone: row.phone ?? "-",
    category: toSupplierCategory(row.category),
    reliabilityScore: row.reliabilityScore,
    leadTimeDays: row.leadTimeDays,
  };
}

function toRawMaterialStorageLocation(row: BackendRawMaterialStorageLocation): RawMaterialStorageLocation {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    type: toStorageType(row.type),
    capacityKg: row.capacityKg,
    usedKg: row.usedKg,
  };
}

function toRawMaterialIntake(row: BackendRawMaterialIntake): RawMaterialIntake {
  return {
    id: row.id,
    referenceNumber: row.referenceNumber,
    supplierId: row.supplierId,
    materialName: row.materialName,
    unit: toUnit(row.unit),
    receivedQuantity: row.receivedQuantity,
    acceptedQuantity: row.acceptedQuantity,
    rejectedQuantity: row.rejectedQuantity,
    qualityStatus: toQualityStatus(row.qualityStatus),
    receivedAt: row.receivedAt,
    targetStorageId: row.targetStorageLocationId,
  };
}

function toRawMaterialWeighing(row: BackendRawMaterialWeighing): RawMaterialWeighing {
  return {
    id: row.id,
    referenceNumber: row.referenceNumber,
    intakeId: row.intakeId,
    stationName: row.stationName,
    grossKg: row.grossKg,
    tareKg: row.tareKg,
    netKg: row.netKg,
    operatorName: row.operatorName,
    measuredAt: row.measuredAt,
  };
}

function toRawMaterialBatch(row: BackendRawMaterialBatch): RawMaterialBatch {
  return {
    id: row.id,
    lotCode: row.lotCode,
    intakeId: row.intakeId,
    materialName: row.materialName,
    quantityKg: row.quantity,
    remainingKg: row.remainingQuantity,
    qualityStatus: toQualityStatus(row.qualityStatus),
    expiryDate: row.expiryDate ?? "No expiry date",
    storageId: row.storageLocationId,
  };
}

function toRawMaterialProcessingRun(row: BackendRawMaterialProcessingRun): RawMaterialProcessingRun {
  return {
    id: row.id,
    runNumber: row.runNumber,
    inputBatchId: row.inputBatchId,
    outputName: row.outputName,
    inputKg: row.inputQuantity,
    outputKg: row.outputQuantity,
    byproductKg: row.byproductQuantity,
    status: toProcessingStatus(row.status),
  };
}

function toRawMaterialKandangPen(row: BackendRawMaterialKandangPen): RawMaterialKandangPen {
  return {
    id: row.id,
    code: row.code,
    flockName: row.flockName,
    capacity: row.capacity,
    occupancy: row.occupancy,
    feedBatchId: row.feedBatchId,
    healthStatus: toHealthStatus(row.healthStatus),
  };
}

function toRawMaterialStockMovement(row: BackendRawMaterialStockMovement): RawMaterialStockMovement {
  return {
    id: row.id,
    batchId: row.batchId,
    batchLotCode: row.batchLotCode,
    materialName: row.materialName,
    sourceStorageLocationId: row.sourceStorageLocationId,
    sourceStorageCode: row.sourceStorageCode,
    targetStorageLocationId: row.targetStorageLocationId,
    targetStorageCode: row.targetStorageCode,
    type: row.type,
    reason: row.reason,
    source: row.source,
    sourceId: row.sourceId,
    quantity: row.quantity,
    beforeQuantity: row.beforeQuantity,
    afterQuantity: row.afterQuantity,
    note: row.note,
    createdAt: row.createdAt,
  };
}

export async function fetchRawMaterialSummary(signal?: AbortSignal) {
  return fetchRawMaterialData<RawMaterialSummaryResponse>("rawMaterialGetSummary", signal);
}

export function getRawMaterialSummaryErrorMessage(error: unknown) {
  return getApiErrorMessage(error, "Raw Material summary API is unavailable. Using mock fallback data.");
}

export function createRawMaterialSummaryMetrics(summary: RawMaterialSummaryResponse): readonly RawMaterialMetric[] {
  return [
    {
      label: "Accepted material",
      value: formatRawMaterialWeight(summary.intakes.acceptedQuantity),
      helper: `${summary.intakes.acceptanceRate.toFixed(1)}% acceptance rate across ${summary.intakes.total} intakes`,
    },
    {
      label: "Active batches",
      value: String(summary.batches.active),
      helper: `${formatRawMaterialWeight(summary.batches.remainingQuantity)} remaining from ${summary.batches.total} batches`,
    },
    {
      label: "Storage usage",
      value: `${summary.storage.usageRate.toFixed(1)}%`,
      helper: `${formatRawMaterialWeight(summary.storage.availableKg)} available across ${summary.storage.activeLocations} active locations`,
    },
    {
      label: "Processing yield",
      value: `${summary.processing.yieldRate.toFixed(1)}%`,
      helper: `${formatRawMaterialWeight(summary.processing.outputQuantity)} output from ${summary.processing.totalRuns} runs`,
    },
  ];
}

export async function listRawMaterialSuppliers(signal?: AbortSignal) {
  const rows = await fetchRawMaterialData<BackendRawMaterialSupplier[]>("rawMaterialListSuppliers", signal);
  return rows.map(toRawMaterialSupplier);
}

export async function listRawMaterialStorageLocations(signal?: AbortSignal) {
  const rows = await fetchRawMaterialData<BackendRawMaterialStorageLocation[]>("rawMaterialListStorageLocations", signal);
  return rows.map(toRawMaterialStorageLocation);
}

export async function listRawMaterialIntakes(signal?: AbortSignal) {
  const rows = await fetchRawMaterialData<BackendRawMaterialIntake[]>("rawMaterialListIntakes", signal);
  return rows.map(toRawMaterialIntake);
}

export async function listRawMaterialWeighings(signal?: AbortSignal) {
  const rows = await fetchRawMaterialData<BackendRawMaterialWeighing[]>("rawMaterialListWeighings", signal);
  return rows.map(toRawMaterialWeighing);
}

export async function listRawMaterialBatches(signal?: AbortSignal) {
  const rows = await fetchRawMaterialData<BackendRawMaterialBatch[]>("rawMaterialListBatches", signal);
  return rows.map(toRawMaterialBatch);
}

export async function listRawMaterialProcessingRuns(signal?: AbortSignal) {
  const rows = await fetchRawMaterialData<BackendRawMaterialProcessingRun[]>("rawMaterialListProcessingRuns", signal);
  return rows.map(toRawMaterialProcessingRun);
}

export async function listRawMaterialKandangPens(signal?: AbortSignal) {
  const rows = await fetchRawMaterialData<BackendRawMaterialKandangPen[]>("rawMaterialListPens", signal);
  return rows.map(toRawMaterialKandangPen);
}

export async function listRawMaterialStockMovements(signal?: AbortSignal) {
  const rows = await fetchRawMaterialData<BackendRawMaterialStockMovement[]>("rawMaterialListStockMovements", signal);
  return rows.map(toRawMaterialStockMovement);
}

export async function getRawMaterialWorkflowReads(signal?: AbortSignal): Promise<RawMaterialWorkflowReadData> {
  const [
    suppliers,
    storageLocations,
    intakes,
    weighings,
    batches,
    processingRuns,
    kandangPens,
    stockMovements,
  ] = await Promise.all([
    listRawMaterialSuppliers(signal),
    listRawMaterialStorageLocations(signal),
    listRawMaterialIntakes(signal),
    listRawMaterialWeighings(signal),
    listRawMaterialBatches(signal),
    listRawMaterialProcessingRuns(signal),
    listRawMaterialKandangPens(signal),
    listRawMaterialStockMovements(signal),
  ]);

  return {
    suppliers,
    storageLocations,
    intakes,
    weighings,
    batches,
    processingRuns,
    kandangPens,
    stockMovements,
  };
}

export const rawMaterialApiClient = {
  getSummary: fetchRawMaterialSummary,
  getWorkflowReads: getRawMaterialWorkflowReads,
  listSuppliers: listRawMaterialSuppliers,
  listStorageLocations: listRawMaterialStorageLocations,
  listIntakes: listRawMaterialIntakes,
  listWeighings: listRawMaterialWeighings,
  listBatches: listRawMaterialBatches,
  listProcessingRuns: listRawMaterialProcessingRuns,
  listKandangPens: listRawMaterialKandangPens,
  listStockMovements: listRawMaterialStockMovements,
};
