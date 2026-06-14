import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
}

loadEnvFile();

const { prisma } = await import("../src/lib/prisma.js");

type SupplierSeed = {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  category: "FEED" | "LIVESTOCK" | "PACKAGING" | "RAW_GOODS";
  reliabilityScore: number;
  leadTimeDays: number;
  notes: string;
};

type StorageSeed = {
  id: string;
  code: string;
  name: string;
  type: "DRY" | "COLD" | "OPEN_YARD" | "KANDANG_SUPPORT";
  capacityKg: number;
  usedKg: number;
  temperatureCelsius: number | null;
  notes: string;
};

type IntakeSeed = {
  id: string;
  referenceNumber: string;
  supplierId: string;
  targetStorageId: string;
  materialName: string;
  unit: "KG";
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  qualityStatus: "ACCEPTED" | "PARTIALLY_REJECTED";
  receivedAt: Date;
  notes: string;
};

type WeighingSeed = {
  id: string;
  referenceNumber: string;
  intakeId: string;
  stationName: string;
  grossKg: number;
  tareKg: number;
  netKg: number;
  operatorName: string;
  measuredAt: Date;
  notes: string;
};

type BatchSeed = {
  id: string;
  lotCode: string;
  intakeId: string;
  storageId: string;
  materialName: string;
  unit: "KG";
  quantity: number;
  remainingQuantity: number;
  qualityStatus: "ACCEPTED";
  expiryDate: Date;
  notes: string;
};

type ProcessingRunSeed = {
  id: string;
  runNumber: string;
  inputBatchId: string;
  outputName: string;
  inputQuantity: number;
  outputQuantity: number;
  byproductQuantity: number;
  wasteQuantity: number;
  status: "PLANNED";
  notes: string;
};

type KandangPenSeed = {
  id: string;
  code: string;
  flockName: string;
  capacity: number;
  occupancy: number;
  feedBatchId: string;
  healthStatus: "STABLE" | "MONITORING";
  notes: string;
};

type StockMovementSeed = {
  id: string;
  batchId: string;
  targetStorageId: string;
  sourceId: string;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  note: string;
};

const suppliers: SupplierSeed[] = [
  {
    id: "nusantara-feed-mills",
    name: "Nusantara Feed Mills",
    contactPerson: "Raka Pratama",
    phone: "+62 812-1000-4101",
    email: "supply@nusantarafeed.example",
    address: "Kawasan Industri Pakan Blok A-12",
    category: "FEED",
    reliabilityScore: 96,
    leadTimeDays: 2,
    notes: "Primary supplier for feed-grade raw material.",
  },
  {
    id: "agro-prima-commodities",
    name: "Agro Prima Commodities",
    contactPerson: "Dewi Lestari",
    phone: "+62 812-1000-4102",
    email: "ops@agroprima.example",
    address: "Jl. Gudang Komoditas No. 18",
    category: "RAW_GOODS",
    reliabilityScore: 91,
    leadTimeDays: 3,
    notes: "Corn and grain supplier for raw material processing.",
  },
  {
    id: "cold-chain-protein-supply",
    name: "Cold Chain Protein Supply",
    contactPerson: "Bima Santoso",
    phone: "+62 812-1000-4103",
    email: "orders@coldchainprotein.example",
    address: "Sentra Cold Storage Unit C-04",
    category: "RAW_GOODS",
    reliabilityScore: 88,
    leadTimeDays: 4,
    notes: "Cold-chain supplier for protein meal raw goods.",
  },
];

const storages: StorageSeed[] = [
  {
    id: "feed-dry-storage",
    code: "RM-DRY-01",
    name: "Feed Dry Storage",
    type: "DRY",
    capacityKg: 18_000,
    usedKg: 5_550,
    temperatureCelsius: null,
    notes: "Primary dry storage for feed and grain batches.",
  },
  {
    id: "protein-cold-holding",
    code: "RM-COLD-01",
    name: "Protein Cold Holding",
    type: "COLD",
    capacityKg: 8_000,
    usedKg: 980,
    temperatureCelsius: 4,
    notes: "Cold storage for temperature-sensitive raw material.",
  },
  {
    id: "kandang-support-rack",
    code: "RM-KDG-01",
    name: "Kandang Support Rack",
    type: "KANDANG_SUPPORT",
    capacityKg: 6_000,
    usedKg: 0,
    temperatureCelsius: null,
    notes: "Support staging for kandang operations.",
  },
];

const intakes: IntakeSeed[] = [
  {
    id: "feed-intake-001",
    referenceNumber: "RMI-DEMO-FEED-001",
    supplierId: "nusantara-feed-mills",
    targetStorageId: "feed-dry-storage",
    materialName: "Broiler Starter Feed",
    unit: "KG",
    receivedQuantity: 3_200,
    acceptedQuantity: 3_150,
    rejectedQuantity: 50,
    qualityStatus: "PARTIALLY_REJECTED",
    receivedAt: new Date("2026-06-01T08:30:00.000Z"),
    notes: "Demo intake with small rejection after inspection.",
  },
  {
    id: "corn-intake-001",
    referenceNumber: "RMI-DEMO-CORN-001",
    supplierId: "agro-prima-commodities",
    targetStorageId: "feed-dry-storage",
    materialName: "Ground Corn",
    unit: "KG",
    receivedQuantity: 2_400,
    acceptedQuantity: 2_400,
    rejectedQuantity: 0,
    qualityStatus: "ACCEPTED",
    receivedAt: new Date("2026-06-03T09:15:00.000Z"),
    notes: "Accepted demo grain intake.",
  },
  {
    id: "protein-meal-intake-001",
    referenceNumber: "RMI-DEMO-PROTEIN-001",
    supplierId: "cold-chain-protein-supply",
    targetStorageId: "protein-cold-holding",
    materialName: "Protein Meal",
    unit: "KG",
    receivedQuantity: 980,
    acceptedQuantity: 980,
    rejectedQuantity: 0,
    qualityStatus: "ACCEPTED",
    receivedAt: new Date("2026-06-05T07:45:00.000Z"),
    notes: "Cold-chain accepted protein meal intake.",
  },
];

const weighings: WeighingSeed[] = [
  {
    id: "feed-weighing-001",
    referenceNumber: "RMW-DEMO-FEED-001",
    intakeId: "feed-intake-001",
    stationName: "Scale Station A",
    grossKg: 3_260,
    tareKg: 60,
    netKg: 3_200,
    operatorName: "Operator A",
    measuredAt: new Date("2026-06-01T08:35:00.000Z"),
    notes: "Demo weighing for feed intake.",
  },
  {
    id: "corn-weighing-001",
    referenceNumber: "RMW-DEMO-CORN-001",
    intakeId: "corn-intake-001",
    stationName: "Scale Station A",
    grossKg: 2_455,
    tareKg: 55,
    netKg: 2_400,
    operatorName: "Operator B",
    measuredAt: new Date("2026-06-03T09:20:00.000Z"),
    notes: "Demo weighing for corn intake.",
  },
  {
    id: "protein-meal-weighing-001",
    referenceNumber: "RMW-DEMO-PROTEIN-001",
    intakeId: "protein-meal-intake-001",
    stationName: "Cold Scale Station",
    grossKg: 1_010,
    tareKg: 30,
    netKg: 980,
    operatorName: "Operator C",
    measuredAt: new Date("2026-06-05T07:50:00.000Z"),
    notes: "Demo weighing for protein meal intake.",
  },
];

const batches: BatchSeed[] = [
  {
    id: "feed-batch-001",
    lotCode: "RMB-DEMO-FEED-001",
    intakeId: "feed-intake-001",
    storageId: "feed-dry-storage",
    materialName: "Broiler Starter Feed",
    unit: "KG",
    quantity: 3_150,
    remainingQuantity: 3_150,
    qualityStatus: "ACCEPTED",
    expiryDate: new Date("2026-09-30T00:00:00.000Z"),
    notes: "Demo accepted feed batch.",
  },
  {
    id: "corn-batch-001",
    lotCode: "RMB-DEMO-CORN-001",
    intakeId: "corn-intake-001",
    storageId: "feed-dry-storage",
    materialName: "Ground Corn",
    unit: "KG",
    quantity: 2_400,
    remainingQuantity: 2_400,
    qualityStatus: "ACCEPTED",
    expiryDate: new Date("2026-10-15T00:00:00.000Z"),
    notes: "Demo accepted corn batch.",
  },
  {
    id: "protein-meal-batch-001",
    lotCode: "RMB-DEMO-PROTEIN-001",
    intakeId: "protein-meal-intake-001",
    storageId: "protein-cold-holding",
    materialName: "Protein Meal",
    unit: "KG",
    quantity: 980,
    remainingQuantity: 980,
    qualityStatus: "ACCEPTED",
    expiryDate: new Date("2026-08-30T00:00:00.000Z"),
    notes: "Demo accepted cold-chain protein batch.",
  },
];

const processingRuns: ProcessingRunSeed[] = [
  {
    id: "feed-mix-plan-001",
    runNumber: "RMP-DEMO-MIX-001",
    inputBatchId: "corn-batch-001",
    outputName: "Feed Mix Preview",
    inputQuantity: 200,
    outputQuantity: 0,
    byproductQuantity: 0,
    wasteQuantity: 0,
    status: "PLANNED",
    notes: "Demo planned processing run. No stock consumed yet.",
  },
];

const kandangPens: KandangPenSeed[] = [
  {
    id: "kandang-a01",
    code: "KDG-A01",
    flockName: "Starter Flock A",
    capacity: 1_000,
    occupancy: 820,
    feedBatchId: "feed-batch-001",
    healthStatus: "STABLE",
    notes: "Demo stable kandang pen using feed batch.",
  },
  {
    id: "kandang-b01",
    code: "KDG-B01",
    flockName: "Grower Flock B",
    capacity: 800,
    occupancy: 455,
    feedBatchId: "corn-batch-001",
    healthStatus: "MONITORING",
    notes: "Demo monitoring kandang pen for operational visibility.",
  },
];

const stockMovements: StockMovementSeed[] = batches.map((batch) => ({
  id: `${batch.id}-receiving-movement`,
  batchId: batch.id,
  targetStorageId: batch.storageId,
  sourceId: batch.intakeId,
  quantity: batch.quantity,
  beforeQuantity: 0,
  afterQuantity: batch.quantity,
  note: `Demo receiving movement for ${batch.lotCode}.`,
}));

function scopedId(businessId: string, seedId: string) {
  return `raw-material-${businessId}-${seedId}`;
}

async function seedSupplier(businessId: string, supplier: SupplierSeed) {
  await prisma.$executeRaw`
    INSERT INTO "RawMaterialSupplier" (
      "id", "businessId", "name", "contactPerson", "phone", "email", "address", "category",
      "reliabilityScore", "leadTimeDays", "isActive", "notes", "updatedAt"
    )
    VALUES (
      ${scopedId(businessId, supplier.id)},
      ${businessId},
      ${supplier.name},
      ${supplier.contactPerson},
      ${supplier.phone},
      ${supplier.email},
      ${supplier.address},
      ${supplier.category}::"RawMaterialSupplierCategory",
      ${supplier.reliabilityScore},
      ${supplier.leadTimeDays},
      TRUE,
      ${supplier.notes},
      NOW()
    )
    ON CONFLICT ("businessId", "name") DO UPDATE SET
      "contactPerson" = EXCLUDED."contactPerson",
      "phone" = EXCLUDED."phone",
      "email" = EXCLUDED."email",
      "address" = EXCLUDED."address",
      "category" = EXCLUDED."category",
      "reliabilityScore" = EXCLUDED."reliabilityScore",
      "leadTimeDays" = EXCLUDED."leadTimeDays",
      "isActive" = TRUE,
      "notes" = EXCLUDED."notes",
      "updatedAt" = NOW()
  `;
}

async function seedStorage(businessId: string, storage: StorageSeed) {
  await prisma.$executeRaw`
    INSERT INTO "RawMaterialStorageLocation" (
      "id", "businessId", "code", "name", "type", "capacityKg", "usedKg",
      "temperatureCelsius", "isActive", "notes", "updatedAt"
    )
    VALUES (
      ${scopedId(businessId, storage.id)},
      ${businessId},
      ${storage.code},
      ${storage.name},
      ${storage.type}::"RawMaterialStorageType",
      ${storage.capacityKg},
      ${storage.usedKg},
      ${storage.temperatureCelsius},
      TRUE,
      ${storage.notes},
      NOW()
    )
    ON CONFLICT ("businessId", "code") DO UPDATE SET
      "name" = EXCLUDED."name",
      "type" = EXCLUDED."type",
      "capacityKg" = EXCLUDED."capacityKg",
      "usedKg" = EXCLUDED."usedKg",
      "temperatureCelsius" = EXCLUDED."temperatureCelsius",
      "isActive" = TRUE,
      "notes" = EXCLUDED."notes",
      "updatedAt" = NOW()
  `;
}

async function seedIntake(businessId: string, intake: IntakeSeed) {
  await prisma.$executeRaw`
    INSERT INTO "RawMaterialIntake" (
      "id", "businessId", "referenceNumber", "supplierId", "targetStorageLocationId", "materialName",
      "unit", "receivedQuantity", "acceptedQuantity", "rejectedQuantity", "qualityStatus",
      "receivedAt", "notes", "updatedAt"
    )
    VALUES (
      ${scopedId(businessId, intake.id)},
      ${businessId},
      ${intake.referenceNumber},
      ${scopedId(businessId, intake.supplierId)},
      ${scopedId(businessId, intake.targetStorageId)},
      ${intake.materialName},
      ${intake.unit}::"RawMaterialUnit",
      ${intake.receivedQuantity},
      ${intake.acceptedQuantity},
      ${intake.rejectedQuantity},
      ${intake.qualityStatus}::"RawMaterialIntakeStatus",
      ${intake.receivedAt},
      ${intake.notes},
      NOW()
    )
    ON CONFLICT ("businessId", "referenceNumber") DO UPDATE SET
      "supplierId" = EXCLUDED."supplierId",
      "targetStorageLocationId" = EXCLUDED."targetStorageLocationId",
      "materialName" = EXCLUDED."materialName",
      "unit" = EXCLUDED."unit",
      "receivedQuantity" = EXCLUDED."receivedQuantity",
      "acceptedQuantity" = EXCLUDED."acceptedQuantity",
      "rejectedQuantity" = EXCLUDED."rejectedQuantity",
      "qualityStatus" = EXCLUDED."qualityStatus",
      "receivedAt" = EXCLUDED."receivedAt",
      "notes" = EXCLUDED."notes",
      "updatedAt" = NOW()
  `;
}

async function seedWeighing(businessId: string, weighing: WeighingSeed) {
  await prisma.$executeRaw`
    INSERT INTO "RawMaterialWeighing" (
      "id", "businessId", "referenceNumber", "intakeId", "stationName", "grossKg", "tareKg",
      "netKg", "operatorName", "measuredAt", "notes", "updatedAt"
    )
    VALUES (
      ${scopedId(businessId, weighing.id)},
      ${businessId},
      ${weighing.referenceNumber},
      ${scopedId(businessId, weighing.intakeId)},
      ${weighing.stationName},
      ${weighing.grossKg},
      ${weighing.tareKg},
      ${weighing.netKg},
      ${weighing.operatorName},
      ${weighing.measuredAt},
      ${weighing.notes},
      NOW()
    )
    ON CONFLICT ("businessId", "referenceNumber") DO UPDATE SET
      "intakeId" = EXCLUDED."intakeId",
      "stationName" = EXCLUDED."stationName",
      "grossKg" = EXCLUDED."grossKg",
      "tareKg" = EXCLUDED."tareKg",
      "netKg" = EXCLUDED."netKg",
      "operatorName" = EXCLUDED."operatorName",
      "measuredAt" = EXCLUDED."measuredAt",
      "notes" = EXCLUDED."notes",
      "updatedAt" = NOW()
  `;
}

async function seedBatch(businessId: string, batch: BatchSeed) {
  await prisma.$executeRaw`
    INSERT INTO "RawMaterialBatch" (
      "id", "businessId", "lotCode", "intakeId", "storageLocationId", "materialName", "unit",
      "quantity", "remainingQuantity", "qualityStatus", "expiryDate", "isActive", "notes", "updatedAt"
    )
    VALUES (
      ${scopedId(businessId, batch.id)},
      ${businessId},
      ${batch.lotCode},
      ${scopedId(businessId, batch.intakeId)},
      ${scopedId(businessId, batch.storageId)},
      ${batch.materialName},
      ${batch.unit}::"RawMaterialUnit",
      ${batch.quantity},
      ${batch.remainingQuantity},
      ${batch.qualityStatus}::"RawMaterialBatchQualityStatus",
      ${batch.expiryDate},
      TRUE,
      ${batch.notes},
      NOW()
    )
    ON CONFLICT ("businessId", "lotCode") DO UPDATE SET
      "intakeId" = EXCLUDED."intakeId",
      "storageLocationId" = EXCLUDED."storageLocationId",
      "materialName" = EXCLUDED."materialName",
      "unit" = EXCLUDED."unit",
      "quantity" = EXCLUDED."quantity",
      "remainingQuantity" = EXCLUDED."remainingQuantity",
      "qualityStatus" = EXCLUDED."qualityStatus",
      "expiryDate" = EXCLUDED."expiryDate",
      "isActive" = TRUE,
      "notes" = EXCLUDED."notes",
      "updatedAt" = NOW()
  `;
}

async function seedProcessingRun(businessId: string, run: ProcessingRunSeed) {
  await prisma.$executeRaw`
    INSERT INTO "RawMaterialProcessingRun" (
      "id", "businessId", "runNumber", "inputBatchId", "outputName", "inputQuantity",
      "outputQuantity", "byproductQuantity", "wasteQuantity", "status", "notes", "updatedAt"
    )
    VALUES (
      ${scopedId(businessId, run.id)},
      ${businessId},
      ${run.runNumber},
      ${scopedId(businessId, run.inputBatchId)},
      ${run.outputName},
      ${run.inputQuantity},
      ${run.outputQuantity},
      ${run.byproductQuantity},
      ${run.wasteQuantity},
      ${run.status}::"RawMaterialProcessingStatus",
      ${run.notes},
      NOW()
    )
    ON CONFLICT ("businessId", "runNumber") DO UPDATE SET
      "inputBatchId" = EXCLUDED."inputBatchId",
      "outputName" = EXCLUDED."outputName",
      "inputQuantity" = EXCLUDED."inputQuantity",
      "outputQuantity" = EXCLUDED."outputQuantity",
      "byproductQuantity" = EXCLUDED."byproductQuantity",
      "wasteQuantity" = EXCLUDED."wasteQuantity",
      "status" = EXCLUDED."status",
      "notes" = EXCLUDED."notes",
      "updatedAt" = NOW()
  `;
}

async function seedKandangPen(businessId: string, pen: KandangPenSeed) {
  await prisma.$executeRaw`
    INSERT INTO "RawMaterialKandangPen" (
      "id", "businessId", "code", "flockName", "capacity", "occupancy", "feedBatchId",
      "healthStatus", "isActive", "notes", "updatedAt"
    )
    VALUES (
      ${scopedId(businessId, pen.id)},
      ${businessId},
      ${pen.code},
      ${pen.flockName},
      ${pen.capacity},
      ${pen.occupancy},
      ${scopedId(businessId, pen.feedBatchId)},
      ${pen.healthStatus}::"RawMaterialKandangHealthStatus",
      TRUE,
      ${pen.notes},
      NOW()
    )
    ON CONFLICT ("businessId", "code") DO UPDATE SET
      "flockName" = EXCLUDED."flockName",
      "capacity" = EXCLUDED."capacity",
      "occupancy" = EXCLUDED."occupancy",
      "feedBatchId" = EXCLUDED."feedBatchId",
      "healthStatus" = EXCLUDED."healthStatus",
      "isActive" = TRUE,
      "notes" = EXCLUDED."notes",
      "updatedAt" = NOW()
  `;
}

async function seedStockMovement(businessId: string, movement: StockMovementSeed) {
  await prisma.$executeRaw`
    INSERT INTO "RawMaterialStockMovement" (
      "id", "businessId", "batchId", "sourceStorageLocationId", "targetStorageLocationId",
      "type", "reason", "source", "sourceId", "quantity", "beforeQuantity", "afterQuantity", "note"
    )
    VALUES (
      ${scopedId(businessId, movement.id)},
      ${businessId},
      ${scopedId(businessId, movement.batchId)},
      NULL,
      ${scopedId(businessId, movement.targetStorageId)},
      'IN'::"RawMaterialStockMovementType",
      'RECEIVING'::"RawMaterialStockMovementReason",
      'INTAKE'::"RawMaterialStockMovementSource",
      ${scopedId(businessId, movement.sourceId)},
      ${movement.quantity},
      ${movement.beforeQuantity},
      ${movement.afterQuantity},
      ${movement.note}
    )
    ON CONFLICT ("id") DO UPDATE SET
      "businessId" = EXCLUDED."businessId",
      "batchId" = EXCLUDED."batchId",
      "sourceStorageLocationId" = EXCLUDED."sourceStorageLocationId",
      "targetStorageLocationId" = EXCLUDED."targetStorageLocationId",
      "type" = EXCLUDED."type",
      "reason" = EXCLUDED."reason",
      "source" = EXCLUDED."source",
      "sourceId" = EXCLUDED."sourceId",
      "quantity" = EXCLUDED."quantity",
      "beforeQuantity" = EXCLUDED."beforeQuantity",
      "afterQuantity" = EXCLUDED."afterQuantity",
      "note" = EXCLUDED."note"
  `;
}

async function main() {
  const businesses = await prisma.business.findMany({
    where: {
      mode: "RAW_MATERIAL",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (businesses.length === 0) {
    console.log("No active RAW_MATERIAL business found. Create/select a Raw Material business first.");
    return;
  }

  for (const business of businesses) {
    for (const supplier of suppliers) {
      await seedSupplier(business.id, supplier);
    }

    for (const storage of storages) {
      await seedStorage(business.id, storage);
    }

    for (const intake of intakes) {
      await seedIntake(business.id, intake);
    }

    for (const weighing of weighings) {
      await seedWeighing(business.id, weighing);
    }

    for (const batch of batches) {
      await seedBatch(business.id, batch);
    }

    for (const run of processingRuns) {
      await seedProcessingRun(business.id, run);
    }

    for (const pen of kandangPens) {
      await seedKandangPen(business.id, pen);
    }

    for (const movement of stockMovements) {
      await seedStockMovement(business.id, movement);
    }

    console.log(
      `Seeded Raw Material demo data for ${business.name} (${business.id}): ${suppliers.length} suppliers, ${storages.length} storages, ${intakes.length} intakes, ${batches.length} batches, ${kandangPens.length} kandang pens.`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
