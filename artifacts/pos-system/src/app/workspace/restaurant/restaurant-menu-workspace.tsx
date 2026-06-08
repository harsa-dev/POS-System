import { MenuWorkspaceBoard } from "@/app/workspace/restaurant/menu/menu-workspace-board";
import { useMenuWorkspaceCatalog } from "@/app/workspace/restaurant/menu/use-menu-workspace-catalog";
import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";

export default function RestaurantMenuWorkspace() {
  const catalog = useMenuWorkspaceCatalog();

  return (
    <WorkspaceShell
      title="Restaurant Menu Workspace"
      description="Read-only V3 menu catalog workspace for observing menu items, categories, prices, and availability."
      currentRouteLabel="current Menu route"
      currentRoutePath={ROUTES.MENU}
    >
      <MenuWorkspaceBoard
        categories={catalog.categories}
        errorMessage={catalog.errorMessage}
        items={catalog.items}
        status={catalog.status}
      />
    </WorkspaceShell>
  );
}
