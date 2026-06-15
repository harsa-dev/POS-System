"use client";

import { useState } from "react";

import { CustomersPartnersDashboard } from "./customers-partners-dashboard";
import { CustomersPartnersDetailPanel } from "./customers-partners-detail-panel";
import { CustomersPartnersDetailTable } from "./customers-partners-detail-table";
import { CustomersPartnersImportPanel } from "./customers-partners-import-panel";
import { CustomersPartnersLoyaltyTiersPanel } from "./customers-partners-loyalty-tiers-panel";
import { CustomersPartnersSalesSyncPanel } from "./customers-partners-sales-sync-panel";
import { CustomersPartnersTierAssignmentPanel } from "./customers-partners-tier-assignment-panel";
import { CustomersPartnersWorkflowShortcuts } from "./customers-partners-workflow-shortcuts";

export function CustomersPartnersWorkspace() {
  const [reloadKey, setReloadKey] = useState(0);
  const reloadDashboard = () => setReloadKey((current) => current + 1);

  return (
    <div className="space-y-6">
      <CustomersPartnersWorkflowShortcuts />

      <div className="grid gap-6 xl:grid-cols-2">
        <section id="customers-sales-sync" className="scroll-mt-24">
          <CustomersPartnersSalesSyncPanel
            reloadSignal={reloadKey}
            onSynced={reloadDashboard}
          />
        </section>
        <section id="customers-csv-import" className="scroll-mt-24">
          <CustomersPartnersImportPanel onImported={reloadDashboard} />
        </section>
      </div>

      <section id="customers-loyalty-tiers" className="scroll-mt-24">
        <CustomersPartnersLoyaltyTiersPanel
          reloadSignal={reloadKey}
          onUpdated={reloadDashboard}
        />
      </section>

      <section id="customers-tier-assignment" className="scroll-mt-24">
        <CustomersPartnersTierAssignmentPanel
          reloadSignal={reloadKey}
          onAssigned={reloadDashboard}
        />
      </section>

      <section id="customers-detail-lookup" className="scroll-mt-24">
        <CustomersPartnersDetailTable reloadSignal={reloadKey} />
      </section>

      <section id="customers-detail" className="scroll-mt-24">
        <CustomersPartnersDetailPanel reloadSignal={reloadKey} />
      </section>

      <section id="customers-directory" className="scroll-mt-24">
        <CustomersPartnersDashboard key={reloadKey} />
      </section>
    </div>
  );
}
