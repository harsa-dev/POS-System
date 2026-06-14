import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { PosWorkspaceLayout } from "@/app/workspace/restaurant/pos/pos-workspace-layout";
import { ROUTES } from "@/constants/routes";

export default function RestaurantPosWorkspace() {
  return (
    <WorkspaceShell
      title="Restaurant POS Workspace"
      description="V3 Restaurant POS workspace for cashier, checkout, tables, and open-order flow."
      currentRouteLabel="current Cashier route"
      currentRoutePath={ROUTES.CHECKOUT}
    >
      <PosWorkspaceLayout />
    </WorkspaceShell>
  );
}
