import type { BusinessContext } from "../../lib/business-context/index.js";
import { prisma } from "../../lib/prisma.js";

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
    mode: BusinessContext["businessMode"];
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

function safeNumber(value: number | null | undefined) {
  return Number.isFinite(value ?? Number.NaN) ? Number(value) : 0;
}

function safeRate(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function toDistribution<T extends string>(rows: Array<{ key: T; count: number }>): DistributionItem[] {
  return rows.map((row) => ({ key: row.key, count: row.count }));
}

function toStockDistribution<T extends string>(
  rows: Array<{ key: T; count: number; quantity: number }>,
): StockDistributionItem[] {
  return rows.map((row) => ({
    key: row.key,
    count: row.count,
    quantity: row.quantity,
  }));
}

function pickLatestActivity(activities: Array<LatestRawMaterialActivity | null>) {
  return activities
    .filter((activity): activity is LatestRawMaterialActivity => Boolean(activity))
    .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt))[0] ?? null;
}

export async function getRawMaterialSummary(
  businessContext: BusinessContext,
): Promise<RawMaterialSummaryResponse> {
  const { businessId } = businessContext;
  const now = new Date();
  const nearExpiryCutoff = new Date(now);
  nearExpiryCutoff.setDate(nearExpiryCutoff.getDate() + 14);

  const [
    supplierTotal,
    supplierActive,
    supplierReliability,
    storageActiveCount,
    storageAggregate,
    intakeTotal,
    intakeAggregate,
    intakeQualityRows,
    weighingTotal,
    weighingAggregate,
    batchTotal,
    batchActive,
    batchAggregate,
    batchNearExpiry,
    batchQualityRows,
    processingTotal,
    processingAggregate,
    processingStatusRows,
    penTotal,
    penActive,
    penAggregate,
    penHealthRows,
    stockMovementTotal,
    stockMovementTypeRows,
    stockMovementReasonRows,
    latestIntake,
    latestBatch,
    latestProcessingRun,
    latestStockMovement,
  ] = await Promise.all([
    prisma.rawMaterialSupplier.count({ where: { businessId } }),
    prisma.rawMaterialSupplier.count({ where: { businessId, isActive: true } }),
    prisma.rawMaterialSupplier.aggregate({
      where: { businessId },
      _avg: { reliabilityScore: true },
    }),
    prisma.rawMaterialStorageLocation.count({ where: { businessId, isActive: true } }),
    prisma.rawMaterialStorageLocation.aggregate({
      where: { businessId, isActive: true },
      _sum: { capacityKg: true, usedKg: true },
    }),
    prisma.rawMaterialIntake.count({ where: { businessId } }),
    prisma.rawMaterialIntake.aggregate({
      where: { businessId },
      _sum: { receivedQuantity: true, acceptedQuantity: true, rejectedQuantity: true },
    }),
    prisma.rawMaterialIntake.groupBy({
      by: ["qualityStatus"],
      where: { businessId },
      _count: { _all: true },
    }),
    prisma.rawMaterialWeighing.count({ where: { businessId } }),
    prisma.rawMaterialWeighing.aggregate({
      where: { businessId },
      _sum: { netKg: true },
    }),
    prisma.rawMaterialBatch.count({ where: { businessId } }),
    prisma.rawMaterialBatch.count({ where: { businessId, isActive: true } }),
    prisma.rawMaterialBatch.aggregate({
      where: { businessId, isActive: true },
      _sum: { quantity: true, remainingQuantity: true },
    }),
    prisma.rawMaterialBatch.count({
      where: {
        businessId,
        isActive: true,
        expiryDate: {
          gte: now,
          lte: nearExpiryCutoff,
        },
      },
    }),
    prisma.rawMaterialBatch.groupBy({
      by: ["qualityStatus"],
      where: { businessId },
      _count: { _all: true },
    }),
    prisma.rawMaterialProcessingRun.count({ where: { businessId } }),
    prisma.rawMaterialProcessingRun.aggregate({
      where: { businessId },
      _sum: {
        inputQuantity: true,
        outputQuantity: true,
        byproductQuantity: true,
        wasteQuantity: true,
      },
    }),
    prisma.rawMaterialProcessingRun.groupBy({
      by: ["status"],
      where: { businessId },
      _count: { _all: true },
    }),
    prisma.rawMaterialKandangPen.count({ where: { businessId } }),
    prisma.rawMaterialKandangPen.count({ where: { businessId, isActive: true } }),
    prisma.rawMaterialKandangPen.aggregate({
      where: { businessId, isActive: true },
      _sum: { capacity: true, occupancy: true },
    }),
    prisma.rawMaterialKandangPen.groupBy({
      by: ["healthStatus"],
      where: { businessId },
      _count: { _all: true },
    }),
    prisma.rawMaterialStockMovement.count({ where: { businessId } }),
    prisma.rawMaterialStockMovement.groupBy({
      by: ["type"],
      where: { businessId },
      _count: { _all: true },
      _sum: { quantity: true },
    }),
    prisma.rawMaterialStockMovement.groupBy({
      by: ["reason"],
      where: { businessId },
      _count: { _all: true },
      _sum: { quantity: true },
    }),
    prisma.rawMaterialIntake.findFirst({
      where: { businessId },
      orderBy: { receivedAt: "desc" },
      select: { id: true, referenceNumber: true, materialName: true, receivedAt: true },
    }),
    prisma.rawMaterialBatch.findFirst({
      where: { businessId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, lotCode: true, materialName: true, updatedAt: true },
    }),
    prisma.rawMaterialProcessingRun.findFirst({
      where: { businessId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, runNumber: true, outputName: true, updatedAt: true },
    }),
    prisma.rawMaterialStockMovement.findFirst({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      select: { id: true, type: true, quantity: true, createdAt: true },
    }),
  ]);

  const supplierAverageReliability = safeNumber(supplierReliability._avg.reliabilityScore);
  const storageCapacityKg = safeNumber(storageAggregate._sum.capacityKg);
  const storageUsedKg = safeNumber(storageAggregate._sum.usedKg);
  const intakeReceivedQuantity = safeNumber(intakeAggregate._sum.receivedQuantity);
  const intakeAcceptedQuantity = safeNumber(intakeAggregate._sum.acceptedQuantity);
  const batchQuantity = safeNumber(batchAggregate._sum.quantity);
  const batchRemainingQuantity = safeNumber(batchAggregate._sum.remainingQuantity);
  const processingInputQuantity = safeNumber(processingAggregate._sum.inputQuantity);
  const processingOutputQuantity = safeNumber(processingAggregate._sum.outputQuantity);
  const processingByproductQuantity = safeNumber(processingAggregate._sum.byproductQuantity);
  const processingWasteQuantity = safeNumber(processingAggregate._sum.wasteQuantity);
  const kandangCapacity = safeNumber(penAggregate._sum.capacity);
  const kandangOccupancy = safeNumber(penAggregate._sum.occupancy);

  const latestActivities: Array<LatestRawMaterialActivity | null> = [
    latestIntake
      ? {
          kind: "intake",
          id: latestIntake.id,
          label: `${latestIntake.referenceNumber} - ${latestIntake.materialName}`,
          occurredAt: latestIntake.receivedAt.toISOString(),
        }
      : null,
    latestBatch
      ? {
          kind: "batch",
          id: latestBatch.id,
          label: `${latestBatch.lotCode} - ${latestBatch.materialName}`,
          occurredAt: latestBatch.updatedAt.toISOString(),
        }
      : null,
    latestProcessingRun
      ? {
          kind: "processing-run",
          id: latestProcessingRun.id,
          label: `${latestProcessingRun.runNumber} - ${latestProcessingRun.outputName}`,
          occurredAt: latestProcessingRun.updatedAt.toISOString(),
        }
      : null,
    latestStockMovement
      ? {
          kind: "stock-movement",
          id: latestStockMovement.id,
          label: `${latestStockMovement.type} ${latestStockMovement.quantity}kg`,
          occurredAt: latestStockMovement.createdAt.toISOString(),
        }
      : null,
  ];

  return {
    generatedAt: now.toISOString(),
    source: "api-server-prisma-raw-material-summary",
    business: {
      id: businessId,
      name: businessContext.businessName,
      mode: businessContext.businessMode,
    },
    suppliers: {
      total: supplierTotal,
      active: supplierActive,
      inactive: supplierTotal - supplierActive,
      averageReliabilityScore: Number(supplierAverageReliability.toFixed(2)),
    },
    storage: {
      activeLocations: storageActiveCount,
      capacityKg: storageCapacityKg,
      usedKg: storageUsedKg,
      availableKg: Math.max(storageCapacityKg - storageUsedKg, 0),
      usageRate: safeRate(storageUsedKg, storageCapacityKg),
    },
    intakes: {
      total: intakeTotal,
      receivedQuantity: intakeReceivedQuantity,
      acceptedQuantity: intakeAcceptedQuantity,
      rejectedQuantity: safeNumber(intakeAggregate._sum.rejectedQuantity),
      acceptanceRate: safeRate(intakeAcceptedQuantity, intakeReceivedQuantity),
      qualityDistribution: toDistribution(
        intakeQualityRows.map((row) => ({ key: row.qualityStatus, count: row._count._all })),
      ),
    },
    weighings: {
      total: weighingTotal,
      netKg: safeNumber(weighingAggregate._sum.netKg),
    },
    batches: {
      total: batchTotal,
      active: batchActive,
      quantity: batchQuantity,
      remainingQuantity: batchRemainingQuantity,
      consumedQuantity: Math.max(batchQuantity - batchRemainingQuantity, 0),
      nearExpiry: batchNearExpiry,
      qualityDistribution: toDistribution(
        batchQualityRows.map((row) => ({ key: row.qualityStatus, count: row._count._all })),
      ),
    },
    processing: {
      totalRuns: processingTotal,
      inputQuantity: processingInputQuantity,
      outputQuantity: processingOutputQuantity,
      byproductQuantity: processingByproductQuantity,
      wasteQuantity: processingWasteQuantity,
      yieldRate: safeRate(processingOutputQuantity, processingInputQuantity),
      statusDistribution: toDistribution(
        processingStatusRows.map((row) => ({ key: row.status, count: row._count._all })),
      ),
    },
    kandang: {
      totalPens: penTotal,
      activePens: penActive,
      capacity: kandangCapacity,
      occupancy: kandangOccupancy,
      occupancyRate: safeRate(kandangOccupancy, kandangCapacity),
      healthDistribution: toDistribution(
        penHealthRows.map((row) => ({ key: row.healthStatus, count: row._count._all })),
      ),
    },
    stockMovements: {
      total: stockMovementTotal,
      byType: toStockDistribution(
        stockMovementTypeRows.map((row) => ({
          key: row.type,
          count: row._count._all,
          quantity: safeNumber(row._sum.quantity),
        })),
      ),
      byReason: toStockDistribution(
        stockMovementReasonRows.map((row) => ({
          key: row.reason,
          count: row._count._all,
          quantity: safeNumber(row._sum.quantity),
        })),
      ),
      latest: latestActivities.find((activity) => activity?.kind === "stock-movement") ?? null,
    },
    latestActivity: pickLatestActivity(latestActivities),
  };
}
