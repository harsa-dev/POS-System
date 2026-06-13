import { CustomersPartnersDashboard } from "@/features/shared/customers";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";

export default function CustomersPage() {
  return (
    <RawMaterialSharedDashboardBridge dashboardId="customers">
      <RetailSharedDashboardBridge dashboardId="customers">
        <CustomersPartnersDashboard />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
