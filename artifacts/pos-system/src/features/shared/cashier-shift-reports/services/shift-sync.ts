import type { CashierShift } from "@/features/shared/types";

export function getReadyToSyncShifts(shifts: CashierShift[]) {
  return shifts.filter(
    (shift) => shift.status === "Completed" && shift.syncStatus === "Not Synced",
  );
}

export function markShiftsAsSynced(shifts: CashierShift[], syncedIds: string[]) {
  return shifts.map((shift) =>
    syncedIds.includes(shift.id) ? { ...shift, syncStatus: "Synced" as const } : shift,
  );
}
