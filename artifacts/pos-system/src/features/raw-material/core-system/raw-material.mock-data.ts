import type {
  RawMaterialBatch,
  RawMaterialIntake,
  RawMaterialKandangPen,
  RawMaterialMetric,
  RawMaterialModuleMetadata,
  RawMaterialProcessingRun,
  RawMaterialStorageLocation,
  RawMaterialSupplier,
  RawMaterialWeighing,
  RawMaterialWorkspaceModuleId,
} from "./raw-material.types";

export const rawMaterialSuppliers: readonly RawMaterialSupplier[] = [
  {
    id: "rms-001",
    name: "Borneo Feed Supply",
    contactPerson: "Ari Wibowo",
    phone: "+62 812-4400-1201",
    category: "Feed",
    reliabilityScore: 94,
    leadTimeDays: 2,
  },
  {
    id: "rms-002",
    name: "Mitra Ternak Sejahtera",
    contactPerson: "Dina Lestari",
    phone: "+62 813-5510-8821",
    category: "Livestock",
    reliabilityScore: 89,
    leadTimeDays: 3,
  },
  {
    id: "rms-003",
    name: "Fresh Raw Nusantara",
    contactPerson: "Rafi Mahendra",
    phone: "+62 857-3200-9988",
    category: "Raw Goods",
    reliabilityScore: 91,
    leadTimeDays: 1,
  },
];

export const rawMaterialStorageLocations: readonly RawMaterialStorageLocation[] = [
  {
    id: "rmsl-001",
    code: "DRY-A1",
    name: "Dry Storage A1",
    type: "Dry",
    capacityKg: 12000,
    usedKg: 7850,
  },
  {
    id: "rmsl-002",
    code: "COLD-B1",
    name: "Cold Room B1",
    type: "Cold",
    capacityKg: 6000,
    usedKg: 4320,
  },
  {
    id: "rmsl-003",
    code: "YARD-C1",
    name: "Open Yard C1",
    type: "Open Yard",
    capacityKg: 16000,
    usedKg: 6300,
  },
];

export const rawMaterialIntakes: readonly RawMaterialIntake[] = [
  {
    id: "rmi-001",
    referenceNumber: "RM-IN-2026-0001",
    supplierId: "rms-001",
    materialName: "Pakan Starter Ayam",
    unit: "kg",
    receivedQuantity: 2400,
    acceptedQuantity: 2360,
    rejectedQuantity: 40,
    qualityStatus: "inspection",
    receivedAt: "2026-06-13T08:10:00.000Z",
    targetStorageId: "rmsl-001",
  },
  {
    id: "rmi-002",
    referenceNumber: "RM-IN-2026-0002",
    supplierId: "rms-003",
    materialName: "Jagung Giling",
    unit: "kg",
    receivedQuantity: 1800,
    acceptedQuantity: 1800,
    rejectedQuantity: 0,
    qualityStatus: "accepted",
    receivedAt: "2026-06-13T09:45:00.000Z",
    targetStorageId: "rmsl-003",
  },
  {
    id: "rmi-003",
    referenceNumber: "RM-IN-2026-0003",
    supplierId: "rms-002",
    materialName: "DOC Broiler",
    unit: "head",
    receivedQuantity: 1200,
    acceptedQuantity: 1188,
    rejectedQuantity: 12,
    qualityStatus: "accepted",
    receivedAt: "2026-06-13T10:35:00.000Z",
    targetStorageId: "rmsl-003",
  },
];

export const rawMaterialWeighings: readonly RawMaterialWeighing[] = [
  {
    id: "rmw-001",
    referenceNumber: "WG-2026-0001",
    intakeId: "rmi-001",
    stationName: "Scale Gate 1",
    grossKg: 2520,
    tareKg: 160,
    netKg: 2360,
    operatorName: "Nadia",
    measuredAt: "2026-06-13T08:25:00.000Z",
  },
  {
    id: "rmw-002",
    referenceNumber: "WG-2026-0002",
    intakeId: "rmi-002",
    stationName: "Scale Gate 2",
    grossKg: 1925,
    tareKg: 125,
    netKg: 1800,
    operatorName: "Reno",
    measuredAt: "2026-06-13T09:57:00.000Z",
  },
];

export const rawMaterialBatches: readonly RawMaterialBatch[] = [
  {
    id: "rmb-001",
    lotCode: "LOT-FEED-260613-A",
    intakeId: "rmi-001",
    materialName: "Pakan Starter Ayam",
    quantityKg: 2360,
    remainingKg: 2100,
    qualityStatus: "inspection",
    expiryDate: "2026-09-13",
    storageId: "rmsl-001",
  },
  {
    id: "rmb-002",
    lotCode: "LOT-CORN-260613-B",
    intakeId: "rmi-002",
    materialName: "Jagung Giling",
    quantityKg: 1800,
    remainingKg: 1450,
    qualityStatus: "accepted",
    expiryDate: "2026-08-28",
    storageId: "rmsl-003",
  },
];

export const rawMaterialProcessingRuns: readonly RawMaterialProcessingRun[] = [
  {
    id: "rmp-001",
    runNumber: "PROC-2026-0001",
    inputBatchId: "rmb-002",
    outputName: "Feed Mix Grower A",
    inputKg: 500,
    outputKg: 472,
    byproductKg: 18,
    status: "completed",
  },
  {
    id: "rmp-002",
    runNumber: "PROC-2026-0002",
    inputBatchId: "rmb-001",
    outputName: "Feed Mix Starter B",
    inputKg: 650,
    outputKg: 0,
    byproductKg: 0,
    status: "running",
  },
];

export const rawMaterialKandangPens: readonly RawMaterialKandangPen[] = [
  {
    id: "rmk-001",
    code: "KDG-A01",
    flockName: "Broiler Batch A",
    capacity: 1500,
    occupancy: 1188,
    feedBatchId: "rmb-001",
    healthStatus: "stable",
  },
  {
    id: "rmk-002",
    code: "KDG-B02",
    flockName: "Broiler Batch B",
    capacity: 1300,
    occupancy: 1165,
    feedBatchId: "rmb-002",
    healthStatus: "monitoring",
  },
];

export const rawMaterialWorkspaceModules: Record<
  RawMaterialWorkspaceModuleId,
  RawMaterialModuleMetadata
> = {
  intake: {
    id: "intake",
    title: "Supplier Intake",
    eyebrow: "Receiving control",
    description: "Mock workspace for supplier delivery intake, accepted quantity, rejected quantity, quality state, and target storage visibility.",
    operationalGoal: "Validate raw-material receiving flow before any real stock movement or database mutation exists.",
    checkpoints: [
      "Supplier relation exists in mock data only",
      "Received, accepted, and rejected quantities are separated",
      "Quality status is visible before inventory mutation",
      "Target storage is selected but not persisted",
    ],
  },
  weighing: {
    id: "weighing",
    title: "Weighing Station",
    eyebrow: "Gross, tare, net",
    description: "Mock weighing workspace for scale station output, operator notes, intake linkage, and net weight calculation visibility.",
    operationalGoal: "Lock the measurement contract before hardware scale integration or audit logging is added.",
    checkpoints: [
      "Gross and tare are visible beside calculated net",
      "Weighing record links back to intake mock ID",
      "Operator name is shown for future audit owner mapping",
      "No scale hardware integration yet",
    ],
  },
  batches: {
    id: "batches",
    title: "Batch & Lot Control",
    eyebrow: "Traceability foundation",
    description: "Mock batch workspace for lot code, material source, remaining weight, expiry date, quality state, and storage mapping.",
    operationalGoal: "Prepare traceability UI before batch tables, expiry rules, and movement history are created.",
    checkpoints: [
      "Lot code is visible and unique in mock data",
      "Batch source points to intake ID",
      "Remaining weight can support future stock deduction",
      "Expiry date exists for future FEFO logic",
    ],
  },
  storage: {
    id: "storage",
    title: "Storage Capacity",
    eyebrow: "Warehouse and cold room",
    description: "Mock storage workspace for location code, location type, capacity, usage, and storage pressure monitoring.",
    operationalGoal: "Validate storage dashboard layout before location and transfer models are added.",
    checkpoints: [
      "Capacity and used weight are separated",
      "Dry, cold, and yard storage types are visible",
      "Utilization percentage is derived locally",
      "No transfer mutation exists yet",
    ],
  },
  processing: {
    id: "processing",
    title: "Processing & Yield",
    eyebrow: "Raw to output transformation",
    description: "Mock processing workspace for input batch, output item, input weight, output weight, byproduct, and processing status.",
    operationalGoal: "Test yield and transformation concepts before production and cost distribution tables exist.",
    checkpoints: [
      "Input batch relation is mock-only",
      "Output and byproduct quantities are visible",
      "Yield can be calculated locally",
      "No finished-good inventory is created yet",
    ],
  },
  kandang: {
    id: "kandang",
    title: "Kandang Operations",
    eyebrow: "Livestock support view",
    description: "Mock kandang workspace for pen capacity, occupancy, flock, feed batch linkage, and simple health state visibility.",
    operationalGoal: "Prepare poultry-specific raw material mode without forcing schema changes into the POS core.",
    checkpoints: [
      "Pen capacity and occupancy are visible",
      "Feed batch relation is mock-only",
      "Health state can be scanned quickly",
      "No livestock event table exists yet",
    ],
  },
  suppliers: {
    id: "suppliers",
    title: "Raw Material Suppliers",
    eyebrow: "Source quality control",
    description: "Mock supplier workspace for source category, contact data, lead time, reliability score, and intake relation planning.",
    operationalGoal: "Define supplier UI before deciding whether to reuse partner/customer models or add raw-material-specific tables.",
    checkpoints: [
      "Supplier category is raw-material specific",
      "Reliability score is display-only",
      "Lead time is ready for purchase planning later",
      "No partner schema is changed yet",
    ],
  },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatWeight(value: number) {
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value)} kg`;
}

const acceptedKgToday = rawMaterialIntakes.reduce(
  (total, intake) => total + (intake.unit === "kg" ? intake.acceptedQuantity : 0),
  0,
);

const averageStorageUsage = Math.round(
  rawMaterialStorageLocations.reduce(
    (total, location) => total + location.usedKg / location.capacityKg,
    0,
  ) / rawMaterialStorageLocations.length * 100,
);

const runningProcessCount = rawMaterialProcessingRuns.filter(
  (run) => run.status === "running",
).length;

export const rawMaterialMetrics: readonly RawMaterialMetric[] = [
  {
    label: "Accepted today",
    value: formatWeight(acceptedKgToday),
    helper: "Calculated from local mock intake rows",
  },
  {
    label: "Active batches",
    value: String(rawMaterialBatches.length),
    helper: "Mock lots ready for traceability UI",
  },
  {
    label: "Storage usage",
    value: `${averageStorageUsage}%`,
    helper: "Average capacity usage across mock locations",
  },
  {
    label: "Running process",
    value: String(runningProcessCount),
    helper: "Frontend-only processing state",
  },
];

export function formatRawMaterialCurrency(value: number) {
  return formatCurrency(value);
}

export function formatRawMaterialWeight(value: number) {
  return formatWeight(value);
}

export function getRawMaterialStorageUsagePercent(location: RawMaterialStorageLocation) {
  return Math.round((location.usedKg / location.capacityKg) * 100);
}
