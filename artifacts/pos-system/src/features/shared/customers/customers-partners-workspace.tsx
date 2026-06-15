"use client";

import { useState } from "react";

import { CustomersPartnersDashboard } from "./customers-partners-dashboard";
import { CustomersPartnersImportPanel } from "./customers-partners-import-panel";
import { CustomersPartnersSalesSyncPanel } from "./customers-partners-sales-sync-panel";

export function CustomersPartnersWorkspace() {
  const [reloadKey, setReloadKey] = useState(0);
  const reloadDashboard = () => setReloadKey((current) => current + 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <CustomersPartnersSalesSyncPanel
          reloadSignal={reloadKey}
          onSynced={reloadDashboard}
        />
        <CustomersPartnersImportPanel onImported={reloadDashboard} />
      </div>
      <CustomersPartnersDashboard key={reloadKey} />
    </div>
  );
}
