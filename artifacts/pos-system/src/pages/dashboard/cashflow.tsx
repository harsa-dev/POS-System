import { getCurrentBusinessMode } from "@/components/core/business-mode/business-mode-storage";
import { CashflowWorkspace } from "@/features/shared/cashflow/cashflow-workspace";
import { renderRetailDashboardMode } from "@/features/shared/retail-bridge/retail-mode-renderer";

export default function CashflowPage() {
  if (getCurrentBusinessMode() === "retail") {
    return renderRetailDashboardMode({ dashboardId: "cashflow", mode: "replace", children: null });
  }

  return <CashflowWorkspace />;
}
