import { Banknote, ReceiptText, TrendingUp, WalletCards } from "lucide-react";

import { StatCard } from "@/features/shared/cards";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import type { CashierShift } from "@/features/shared/types";

export function ShiftKpis({ shifts }: { shifts: CashierShift[] }) {
  const totalShifts = shifts.length;
  const totalSales = shifts.reduce((total, shift) => total + shift.totalSales, 0);
  const totalTransactions = shifts.reduce(
    (total, shift) => total + shift.transactionCount,
    0,
  );
  const totalCashOut = shifts.reduce((total, shift) => total + shift.cashOut, 0);
  const completedShifts = shifts.filter((shift) => shift.status === "Completed");
  const totalCashDifference = shifts.reduce(
    (total, shift) => total + shift.cashDifference,
    0,
  );
  const averagePerShift = totalShifts > 0 ? totalSales / totalShifts : 0;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <StatCard
        label="Total Shifts"
        value={formatNumber(totalShifts)}
        note="How many active shifts currently exist"
        icon={ReceiptText}
        tone="blue"
      />
      <StatCard
        label="Total Sales"
        value={formatNumber(totalTransactions)}
        note="How many transactions were processed"
        icon={TrendingUp}
        tone="green"
      />
      <StatCard
        label="Total Cash Out"
        value={formatCurrency(totalCashOut)}
        note="Cash withdrawals"
        icon={Banknote}
        tone="rose"
      />
      <StatCard
        label="Average Per Shift"
        value={formatCurrency(averagePerShift)}
        note="Average sales performance"
        icon={WalletCards}
        tone="amber"
      />
      <StatCard
        label="Cash Difference"
        value={formatCurrency(totalCashDifference)}
        note={`${completedShifts.length} completed shifts with discrepancy summary`}
        icon={Banknote}
        tone={totalCashDifference === 0 ? "green" : "slate"}
      />
    </div>
  );
}
