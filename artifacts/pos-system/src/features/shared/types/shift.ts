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
  warehouse: "Warehouse 1" | "Warehouse 2" | "Warehouse 3";
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
  cashier: "All" | "Cashier A" | "Cashier B" | "Cashier C";
  dateRange: DateRangeOption;
  warehouse: "All" | CashierShift["warehouse"];
};
