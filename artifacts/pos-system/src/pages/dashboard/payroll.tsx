import { getCurrentBusinessMode } from "@/components/core/business-mode/business-mode-storage";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { renderRetailDashboardMode } from "@/features/shared/retail-bridge/retail-mode-renderer";
import * as W from "@/features/shared/workforce-operations/workforce-operations-dashboards";

const SharedPage = W.PayrollDashboard;

export default function PayrollPage() {
  if (getCurrentBusinessMode() === "retail") {
    return renderRetailDashboardMode({ dashboardId: "payroll", mode: "skip", children: null });
  }

  return (
    <RawMaterialSharedDashboardBridge dashboardId="employee-performance">
      <RetailSharedDashboardBridge dashboardId="employee-performance">
        <SharedPage />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
