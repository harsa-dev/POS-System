import type {
  RawMaterialBatch,
  RawMaterialIntake,
  RawMaterialKandangPen,
  RawMaterialMetric,
  RawMaterialModuleMetadata,
  RawMaterialProcessingRun,
  RawMaterialScaleFeature,
  RawMaterialScaleProfile,
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

export const rawMaterialScaleProfiles: readonly RawMaterialScaleProfile[] = [
  {
    scale: "small",
    label: "Kandang kecil",
    businessShape: "1-2 kandang, pencatatan harian masih sederhana, keputusan banyak dari owner langsung.",
    operatingStyle: "Manual-first with simple reminders",
    mustHaveFocus: ["daily feed log", "basic pen condition", "low stock reminder", "supplier contact list"],
    dashboardGoal: "Bikin owner tahu hari ini harus beli apa, pakai batch mana, dan kandang mana yang perlu dicek.",
  },
  {
    scale: "medium",
    label: "Kandang menengah",
    businessShape: "Beberapa kandang, mulai ada operator, supplier lebih dari satu, dan stok harus bisa diaudit sederhana.",
    operatingStyle: "Operational control with alerts",
    mustHaveFocus: ["reorder point", "batch traceability", "feed usage trend", "supplier reliability"],
    dashboardGoal: "Bikin manager bisa lihat stok kritis, konsumsi pakan, batch aktif, dan performa supplier tanpa buka 12 spreadsheet.",
  },
  {
    scale: "factory",
    label: "Pabrik / operasi besar",
    businessShape: "Multi-site, batch besar, planning produksi, QC, audit, supplier score, dan integrasi finance/warehouse.",
    operatingStyle: "MRP/MES-style planning and traceability",
    mustHaveFocus: ["material requirement planning", "quality hold", "multi-site transfer", "production schedule", "audit readiness"],
    dashboardGoal: "Bikin planning material, kualitas, transfer, dan produksi bisa dilacak dari supplier sampai output.",
  },
];

export const rawMaterialScaleFeatures: readonly RawMaterialScaleFeature[] = [
  {
    id: "rmsf-small-001",
    scale: "small",
    title: "Daily feed usage log",
    dashboardArea: "Kandang daily control",
    purpose: "Catat pemakaian pakan per kandang per hari tanpa modul produksi besar.",
    whyItMatters: "Skala kecil butuh tahu stok cukup sampai kapan sebelum uang habis buat beli mendadak.",
    status: "planning-preview",
    previewMetric: "2 kandang logged today",
  },
  {
    id: "rmsf-small-002",
    scale: "small",
    title: "Simple reorder reminder",
    dashboardArea: "Owner action list",
    purpose: "Tampilkan bahan yang mendekati batas beli ulang.",
    whyItMatters: "Lebih murah diingatkan dashboard daripada panik karena pakan habis jam 8 malam.",
    status: "planning-preview",
    previewMetric: "1 item below 7-day cover",
  },
  {
    id: "rmsf-small-003",
    scale: "small",
    title: "Pen condition checklist",
    dashboardArea: "Kandang daily control",
    purpose: "Checklist kondisi kandang, kepadatan, air, dan kebersihan secara ringkas.",
    whyItMatters: "Usaha kecil tidak butuh ERP dulu, butuh kebiasaan catat yang tidak bikin owner menyerah.",
    status: "planning-preview",
    previewMetric: "4/5 checks completed",
  },
  {
    id: "rmsf-medium-001",
    scale: "medium",
    title: "Feed usage trend",
    dashboardArea: "Consumption analytics",
    purpose: "Bandingkan pemakaian pakan antar kandang dan antar batch.",
    whyItMatters: "Begitu kandang bertambah, feeling owner mulai kalah dari angka. Tragis, tapi wajar.",
    status: "planning-preview",
    previewMetric: "+6.4% vs last week",
  },
  {
    id: "rmsf-medium-002",
    scale: "medium",
    title: "Reorder point board",
    dashboardArea: "Procurement planning",
    purpose: "Hitung item yang harus dibeli berdasarkan lead time dan stok berjalan.",
    whyItMatters: "Supplier punya lead time. Ayam tidak peduli alasan procurement telat.",
    status: "planning-preview",
    previewMetric: "3 purchase suggestions",
  },
  {
    id: "rmsf-medium-003",
    scale: "medium",
    title: "Supplier reliability watch",
    dashboardArea: "Supplier control",
    purpose: "Pantau ketepatan supplier, penerimaan ditolak, dan keterlambatan.",
    whyItMatters: "Supplier murah tapi sering telat itu bukan murah, itu cicilan masalah.",
    status: "planning-preview",
    previewMetric: "91% average reliability",
  },
  {
    id: "rmsf-factory-001",
    scale: "factory",
    title: "Material requirement planning preview",
    dashboardArea: "MRP planning",
    purpose: "Preview kebutuhan bahan dari rencana produksi dan stok saat ini.",
    whyItMatters: "Operasi besar harus tahu apa, berapa, dan kapan material dibutuhkan sebelum produksi tersedak.",
    status: "planning-preview",
    previewMetric: "12.4 tons planned demand",
  },
  {
    id: "rmsf-factory-002",
    scale: "factory",
    title: "Quality hold queue",
    dashboardArea: "Quality control",
    purpose: "Pisahkan batch yang belum boleh dipakai karena masih menunggu review kualitas.",
    whyItMatters: "Di pabrik, batch bermasalah bukan cuma masalah stok, tapi masalah audit dan reputasi.",
    status: "planning-preview",
    previewMetric: "2 lots on hold",
  },
  {
    id: "rmsf-factory-003",
    scale: "factory",
    title: "Multi-site transfer planning",
    dashboardArea: "Warehouse network",
    purpose: "Preview perpindahan material antar lokasi sebelum transfer resmi dibuat.",
    whyItMatters: "Satu gudang penuh dan gudang lain kosong adalah komedi mahal bernama poor planning.",
    status: "planning-preview",
    previewMetric: "4 transfer candidates",
  },
  {
    id: "rmsf-factory-004",
    scale: "factory",
    title: "Production schedule readiness",
    dashboardArea: "Factory execution",
    purpose: "Tampilkan apakah jadwal produksi siap dari sisi bahan, storage, dan quality status.",
    whyItMatters: "Jadwal produksi tanpa readiness material itu cuma kalender yang terlalu percaya diri.",
    status: "planning-preview",
    previewMetric: "78% ready for next run",
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
    title: "Processing Runs",
    eyebrow: "Raw to output preview",
    description: "Mock processing workspace for planned/running/completed runs, input batch reference, output quantity, and extra material visibility.",
    operationalGoal: "Shape the processing contract before work orders, material issue, and finished output tables are introduced.",
    checkpoints: [
      "Processing run references input batch",
      "Input and output quantities are separated",
      "Run status is visible",
      "No finished goods write exists yet",
    ],
  },
  kandang: {
    id: "kandang",
    title: "Kandang Support",
    eyebrow: "Pen and feed batch visibility",
    description: "Mock kandang workspace for pen code, flock name, capacity, occupancy, feed batch linkage, and condition status.",
    operationalGoal: "Preview poultry-operation support data before animal-event, feed-consumption, and pen-history models exist.",
    checkpoints: [
      "Pen capacity and occupancy are visible",
      "Feed batch links back to raw-material batch",
      "Condition status is shown as a high-level operational signal",
      "No animal event table exists yet",
    ],
  },
  suppliers: {
    id: "suppliers",
    title: "Supplier Control",
    eyebrow: "Source reliability",
    description: "Mock supplier workspace for category, lead time, contact person, and reliability score visibility.",
    operationalGoal: "Validate supplier monitoring before procurement, purchase order, and supplier scorecard tables are added.",
    checkpoints: [
      "Supplier category is visible",
      "Lead time is available for future reorder planning",
      "Reliability score is mock-only",
      "No purchase order table exists yet",
    ],
  },
};

export function formatRawMaterialCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatRawMaterialWeight(value: number) {
  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(value)} kg`;
}

export function getRawMaterialStorageUsagePercent(location: RawMaterialStorageLocation) {
  if (location.capacityKg <= 0) {
    return 0;
  }

  return Math.round((location.usedKg / location.capacityKg) * 100);
}

export const rawMaterialMetrics: readonly RawMaterialMetric[] = [
  {
    label: "Accepted today",
    value: formatRawMaterialWeight(
      rawMaterialIntakes.reduce((total, intake) => {
        if (intake.unit !== "kg") {
          return total;
        }

        return total + intake.acceptedQuantity;
      }, 0),
    ),
    helper: "Accepted raw-material quantity from mock intake records.",
  },
  {
    label: "Active batches",
    value: String(rawMaterialBatches.length),
    helper: "Traceable lots prepared for future stock movement logic.",
  },
  {
    label: "Storage usage",
    value: `${Math.round(
      rawMaterialStorageLocations.reduce((total, location) => total + getRawMaterialStorageUsagePercent(location), 0) /
        rawMaterialStorageLocations.length,
    )}%`,
    helper: "Average mock storage utilization across configured locations.",
  },
  {
    label: "Running process",
    value: String(rawMaterialProcessingRuns.filter((run) => run.status === "running").length),
    helper: "Processing previews that are not completed yet.",
  },
];
