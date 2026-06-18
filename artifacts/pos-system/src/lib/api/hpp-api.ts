import { apiClient } from "@/lib/api/api-client";

type Env<T> = { success: boolean; data: T; message?: string };

function get<T>(endpoint: string): Promise<T> {
  return apiClient.get<Env<T>>(endpoint).then((r) => r.data);
}

export type HppCostComponent = {
  id: string;
  name: string;
  category: string;
  unitCost: number;
  quantity: number;
  unit: string;
  totalCost: number;
  note: string | null;
};

export type HppBatchSummary = {
  batch: {
    id: string;
    name: string;
    batchDate: string;
    outputUnits: number;
    targetMargin: number;
    notes: string | null;
    createdAt: string;
  };
  components: HppCostComponent[];
  stats: {
    totalCost: number;
    hppPerUnit: number;
    suggestedPrice: number;
    byCategory: Record<string, number>;
  };
};

export type HppBatchListItem = {
  id: string;
  name: string;
  batchDate: string;
  outputUnits: number;
  targetMargin: number;
  componentCount: number;
  totalCost: number;
  hppPerUnit: number;
  suggestedPrice: number;
};

export const hppApi = {
  summary: () => get<HppBatchSummary | null>("/hpp/summary"),
  batches: () => get<{ batches: HppBatchListItem[]; total: number }>("/hpp/batches"),
};
