import { RecipesWorkspaceBoard } from "@/app/workspace/restaurant/menu/recipes-workspace-board";
import { useRecipesWorkspaceCatalog } from "@/app/workspace/restaurant/menu/use-recipes-workspace-catalog";
import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";

export default function RestaurantRecipesWorkspace() {
  const catalog = useRecipesWorkspaceCatalog();

  return (
    <WorkspaceShell
      title="Restaurant Recipes Workspace"
      description="V3 recipe workspace for reviewing menu ingredient mappings, stock units, and recipe coverage before recipe editing is migrated."
      currentRouteLabel="current Recipes route"
      currentRoutePath={ROUTES.RECIPES}
    >
      <RecipesWorkspaceBoard
        errorMessage={catalog.errorMessage}
        items={catalog.items}
        status={catalog.status}
      />
    </WorkspaceShell>
  );
}
