"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Landmark, RefreshCw, WalletCards } from "lucide-react";

import { StatCard } from "@/features/shared/cards";
import { DashboardActionButton, DashboardActions, DashboardPanel } from "@/features/shared/dashboard";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import {
  cashflowApi,
  type CashflowAccountBalanceDto,
  type CashflowAccountBalancesDto,
} from "@/lib/api/cashflow-api";
import { getApiErrorMessage } from "@/lib/api/api-client";

function displayEnum(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getPrimaryCashAccount(accounts: CashflowAccountBalanceDto[]) {
  return accounts.find((account) => account.account === "CASH") ?? null;
}

export function CashflowAccountBalancesPanel({ reloadSignal = 0 }: { reloadSignal?: number }) {
  const [balances, setBalances] = useState<CashflowAccountBalancesDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const cashAccount = useMemo(
    () => getPrimaryCashAccount(balances?.accounts ?? []),
    [balances?.accounts],
  );

  const loadBalances = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await cashflowApi.getAccountBalances();
      setBalances(response.data);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Failed to load backend account balances."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBalances();
  }, [loadBalances, reloadSignal]);

  return (
    <DashboardPanel
      title="Backend Account Balances"
      description="Final account balances from posted ledger entries across the authenticated business. This is not calculated from the current table page."
    >
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Total Ledger Balance"
            value={formatCurrency(balances?.totalBalance ?? 0)}
            note={balances ? `Generated ${new Date(balances.generatedAt).toLocaleString("id-ID")}` : "Backend account total"}
            icon={Landmark}
            tone="slate"
          />
          <StatCard
            label="Cash Account Balance"
            value={formatCurrency(cashAccount?.balance ?? 0)}
            note="Posted CASH income, expense, and adjustment"
            icon={WalletCards}
            tone="blue"
          />
          <StatCard
            label="Tracked Accounts"
            value={formatNumber(balances?.accounts.length ?? 0)}
            note={isLoading ? "Loading backend balances" : "Ledger account buckets"}
            icon={RefreshCw}
            tone="green"
          />
        </div>

        <DashboardActions>
          <DashboardActionButton
            icon={RefreshCw}
            onClick={() => void loadBalances()}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh Balances"}
          </DashboardActionButton>
        </DashboardActions>
      </div>

      {message && (
        <div className="border-t border-amber-100 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
          {message}
        </div>
      )}

      <div className="grid gap-3 border-t border-neutral-200 p-4 md:grid-cols-2 xl:grid-cols-3">
        {(balances?.accounts ?? []).map((account) => (
          <div key={account.account} className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-900">{displayEnum(account.account)}</p>
                <p className="mt-1 text-2xl font-bold text-neutral-950">{formatCurrency(account.balance)}</p>
              </div>
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
                {formatNumber(account.postedCount)} posted
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-semibold text-neutral-500">
              <span>Income: {formatCurrency(account.income)}</span>
              <span>Expense: {formatCurrency(account.expense)}</span>
              <span>Adjustment: {formatCurrency(account.adjustment)}</span>
              <span>Pending: {formatNumber(account.pendingCount)}</span>
              <span>Voided: {formatNumber(account.voidedCount)}</span>
            </div>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}
