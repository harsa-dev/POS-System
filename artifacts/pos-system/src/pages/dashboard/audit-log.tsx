import { getCurrentBusinessMode } from "@/components/core/business-mode/business-mode-storage";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { renderRetailDashboardMode } from "@/features/shared/retail-bridge/retail-mode-renderer";
import { AuditLogDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function AuditLogPage() {
  if (getCurrentBusinessMode() === "retail") {
    return renderRetailDashboardMode({ dashboardId: "audit-controls", mode: "replace", children: null });
  }

  return (
    <RawMaterialSharedDashboardBridge dashboardId="approvals">
      <RetailSharedDashboardBridge dashboardId="approvals">
        <AuditLogDashboard />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
