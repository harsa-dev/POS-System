import { getCurrentBusinessMode } from "@/components/core/business-mode/business-mode-storage";
import { renderRetailDashboardMode } from "@/features/shared/retail-bridge/retail-mode-renderer";
import { TeamManagementRolePermissionPage as SharedPage } from "@/features/shared/team-management/team-management-page";

export default function TeamManagementPage() {
  if (getCurrentBusinessMode() === "retail") {
    return renderRetailDashboardMode({ dashboardId: "team-management", mode: "replace", children: null });
  }

  return <SharedPage />;
}
