import { InvoiceGeneratorDashboard } from "@/features/shared/invoice-generator";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";

export default function InvoiceGeneratorPage() {
  return (
    <RawMaterialSharedDashboardBridge dashboardId="invoice-generator">
      <RetailSharedDashboardBridge dashboardId="invoice-generator">
        <InvoiceGeneratorDashboard />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
