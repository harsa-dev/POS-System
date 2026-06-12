import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

type ApiDataEnvelope<T> = ApiEnvelope<T> & { data: T };

export type ApiShiftStatus = "OPEN" | "CLOSED";

export type ApiShiftOrderDto = {
  id: string;
  total: number;
  paymentMethod: string;
  status: string;
};

export type ApiShiftDto = {
  id: string;
  userId: string;
  restaurantId: string;
  status: ApiShiftStatus;
  openingCash: number;
  closingCash: number | null;
  expectedCash: number;
  cashDifference: number | null;
  openedAt: string;
  closedAt: string | null;
  cashflowSynced?: boolean;
  user?: {
    name: string;
    email: string;
  };
  orders?: ApiShiftOrderDto[];
};

export const shiftsApi = {
  listShifts() {
    return apiClient.get<ApiDataEnvelope<ApiShiftDto[]>>("/api/shifts");
  },
};
