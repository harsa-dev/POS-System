import type { DateRangeOption } from "./analytics";

export type ShiftStatus = "Active" | "Completed";

export type CashReconciliationStatus =
  | "Cash Balanced"
  | "Cash Over"
  | "Cash Short";

export type ShiftSyncStatus = "Not Synced" | "Synced" | "Sync Failed";

export type CashierShift = {
  id: string;
  cashierName: string;
  status: ShiftStatus;
  warehouse: string;
  date: string;
  startTime: string;
  endTime?: string;
  totalSales: number;
  transactionCount: number;
  cashOut: number;
  startingCash: number;
  endingCash: number;
  cashDifference: number;
  cashStatus: CashReconciliationStatus;
  syncStatus: ShiftSyncStatus;
};

export type ShiftFilters = {
  status: "All" | ShiftStatus;
  cashier: "All" | string;
  dateRange: DateRangeOption;
  warehouse: "All" | CashierShift["warehouse"];
};
