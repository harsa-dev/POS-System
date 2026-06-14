"use client";

import { useState } from "react";

import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";

import { CashflowDashboard } from "./cashflow-dashboard";
import { CashflowSourceSyncPanel } from "./cashflow-source-sync-panel";

export function CashflowWorkspace() {
  const [dashboardReloadKey, setDashboardReloadKey] = useState(0);

  return (
    <RawMaterialSharedDashboardBridge dashboardId="cashflow">
      <RetailSharedDashboardBridge dashboardId="cashflow">
        <div className="space-y-4">
          <CashflowSourceSyncPanel
            onSynced={() => {
              setDashboardReloadKey((current) => current + 1);
            }}
          />
          <CashflowDashboard key={dashboardReloadKey} />
        </div>
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
