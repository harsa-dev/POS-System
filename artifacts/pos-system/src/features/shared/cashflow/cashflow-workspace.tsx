"use client";

import { useState } from "react";

import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";

import { CashflowAccountBalancesPanel } from "./cashflow-account-balances-panel";
import { CashflowDashboard } from "./cashflow-dashboard";
import { CashflowSourceSyncPanel } from "./cashflow-source-sync-panel";
import { CashflowWorkspaceOverview } from "./cashflow-workspace-overview";

export function CashflowWorkspace() {
  const [dashboardReloadKey, setDashboardReloadKey] = useState(0);

  function reloadCashflowWorkspace() {
    setDashboardReloadKey((current) => current + 1);
  }

  return (
    <RetailSharedDashboardBridge dashboardId="cashflow">
      <div className="space-y-5">
        <CashflowWorkspaceOverview />

        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <CashflowAccountBalancesPanel reloadSignal={dashboardReloadKey} />
          <div className="space-y-4 2xl:sticky 2xl:top-4 2xl:self-start">
            <CashflowSourceSyncPanel onSynced={reloadCashflowWorkspace} />
          </div>
        </div>

        <CashflowDashboard key={dashboardReloadKey} />
      </div>
    </RetailSharedDashboardBridge>
  );
}
