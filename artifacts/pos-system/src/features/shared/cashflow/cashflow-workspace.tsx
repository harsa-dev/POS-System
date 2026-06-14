"use client";

import { useState } from "react";

import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";

import { CashflowAccountBalancesPanel } from "./cashflow-account-balances-panel";
import { CashflowDashboard } from "./cashflow-dashboard";
import { CashflowSourceSyncPanel } from "./cashflow-source-sync-panel";

export function CashflowWorkspace() {
  const [dashboardReloadKey, setDashboardReloadKey] = useState(0);

  function reloadCashflowWorkspace() {
    setDashboardReloadKey((current) => current + 1);
  }

  return (
    <RawMaterialSharedDashboardBridge dashboardId="cashflow">
      <RetailSharedDashboardBridge dashboardId="cashflow">
        <div className="space-y-4">
          <CashflowAccountBalancesPanel reloadSignal={dashboardReloadKey} />
          <CashflowSourceSyncPanel onSynced={reloadCashflowWorkspace} />
          <CashflowDashboard key={dashboardReloadKey} />
        </div>
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
