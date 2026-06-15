import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

type ApiDataEnvelope<T> = ApiEnvelope<T> & { data: T };

export type ApiShiftStatus = "OPEN" | "CLOSED";

export type ShiftReportsBusinessMode =
  | "restaurant"
  | "retail"
  | "raw-material"
  | "custom-business";

export type CashierShiftReportsCapabilitiesDto = {
  businessId: string;
  businessMode: ShiftReportsBusinessMode;
  canView: boolean;
  canExport: boolean;
  canSyncToCashflow: boolean;
  isPlannedMode: boolean;
  plannedReason: string | null;
};

export type ApiShiftOrderDto = {
  id: string;
  total: number;
  paymentMethod: string;
  status: string;
};

export type ApiShiftDto = {
  id: string;
  userId: string;
  businessId: string;
  restaurantId?: string | null;
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
  getCapabilities() {
    return apiClient.get<ApiDataEnvelope<CashierShiftReportsCapabilitiesDto>>(
      "/api/cashier-shift-reports-capabilities",
    );
  },

  listShifts() {
    return apiClient.get<ApiDataEnvelope<ApiShiftDto[]>>("/api/shifts");
  },
};
