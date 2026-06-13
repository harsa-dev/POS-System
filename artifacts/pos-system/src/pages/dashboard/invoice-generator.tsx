import { InvoiceGeneratorDashboard } from "@/features/shared/invoice-generator";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";

export default function InvoiceGeneratorPage() {
  return (
    <RetailSharedDashboardBridge dashboardId="invoice-generator">
      <InvoiceGeneratorDashboard />
    </RetailSharedDashboardBridge>
  );
}
