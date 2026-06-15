import { getCurrentBusinessMode } from "@/components/core/business-mode/business-mode-storage";
import { InvoiceGeneratorWorkspace } from "@/features/shared/invoice-generator/dashboard/invoice-generator-workspace";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { renderRetailDashboardMode } from "@/features/shared/retail-bridge/retail-mode-renderer";

export default function InvoiceGeneratorPage() {
  if (getCurrentBusinessMode() === "retail") {
    return renderRetailDashboardMode({
      dashboardId: "invoice-generator",
      mode: "replace",
      children: null,
    });
  }

  return (
    <RawMaterialSharedDashboardBridge dashboardId="invoice-generator">
      <RetailSharedDashboardBridge dashboardId="invoice-generator">
        <InvoiceGeneratorWorkspace />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
