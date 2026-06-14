import { apiClient, getApiErrorMessage, type ApiEnvelope } from "@/lib/api";

import { formatRawMaterialWeight } from "./raw-material.mock-data";
import type { RawMaterialMetric } from "./raw-material.types";

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

export async function fetchRawMaterialSummary(signal?: AbortSignal) {
  const payload = await apiClient.get<ApiEnvelope<RawMaterialSummaryResponse>>("/raw-material/summary", {
    signal,
  });

  if (!payload.success || !payload.data) {
    throw new Error("Raw Material summary API returned an empty response.");
  }

  return payload.data;
}

export function getRawMaterialSummaryErrorMessage(error: unknown) {
  return getApiErrorMessage(error, "Raw Material summary API is unavailable. Falling back to mock data.");
}

export function createRawMaterialSummaryMetrics(
  summary: RawMaterialSummaryResponse,
): readonly RawMaterialMetric[] {
  return [
    {
      label: "Accepted material",
      value: formatRawMaterialWeight(summary.intakes.acceptedQuantity),
      helper: `Backend summary · ${summary.intakes.acceptanceRate}% acceptance rate`,
    },
    {
      label: "Active batches",
      value: String(summary.batches.active),
      helper: `${formatRawMaterialWeight(summary.batches.remainingQuantity)} remaining across active lots`,
    },
    {
      label: "Storage usage",
      value: `${summary.storage.usageRate}%`,
      helper: `${formatRawMaterialWeight(summary.storage.usedKg)} used from ${formatRawMaterialWeight(summary.storage.capacityKg)}`,
    },
    {
      label: "Processing yield",
      value: `${summary.processing.yieldRate}%`,
      helper: `${summary.processing.totalRuns} runs · ${formatRawMaterialWeight(summary.processing.outputQuantity)} output`,
    },
  ];
}

export const rawMaterialApiClient = {
  getSummary: fetchRawMaterialSummary,
};
