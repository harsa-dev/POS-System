"use client";

import { useState } from "react";

import { CustomersPartnersDashboard } from "./customers-partners-dashboard";
import { CustomersPartnersSalesSyncPanel } from "./customers-partners-sales-sync-panel";

export function CustomersPartnersWorkspace() {
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="space-y-6">
      <CustomersPartnersSalesSyncPanel
        reloadSignal={reloadKey}
        onSynced={() => setReloadKey((current) => current + 1)}
      />
      <CustomersPartnersDashboard key={reloadKey} />
    </div>
  );
}
