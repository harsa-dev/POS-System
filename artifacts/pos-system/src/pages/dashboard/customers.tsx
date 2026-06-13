import { CustomersPartnersDashboard } from "@/features/shared/customers";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";

export default function CustomersPage() {
  return (
    <RetailSharedDashboardBridge dashboardId="customers">
      <CustomersPartnersDashboard />
    </RetailSharedDashboardBridge>
  );
}
