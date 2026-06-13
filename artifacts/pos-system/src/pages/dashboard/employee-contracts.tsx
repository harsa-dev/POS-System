import { getCurrentBusinessMode } from "@/components/core/business-mode/business-mode-storage";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { renderRetailDashboardMode } from "@/features/shared/retail-bridge/retail-mode-renderer";
import * as W from "@/features/shared/workforce-operations/workforce-operations-dashboards";

const SharedPage = W.EmployeeContractsDashboard;

export default function EmployeeContractsPage() {
  if (getCurrentBusinessMode() === "retail") {
    return renderRetailDashboardMode({ dashboardId: "employee-contracts", mode: "skip", children: null });
  }

  return (
    <RawMaterialSharedDashboardBridge dashboardId="team-management">
      <RetailSharedDashboardBridge dashboardId="team-management">
        <SharedPage />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
