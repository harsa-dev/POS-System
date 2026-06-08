import { useRef, useState } from "react";
import { toast } from "sonner";

import { MenuWorkspaceBoard } from "@/app/workspace/restaurant/menu/menu-workspace-board";
import {
  type MenuWorkspaceItem,
  useMenuWorkspaceCatalog,
} from "@/app/workspace/restaurant/menu/use-menu-workspace-catalog";
import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage, menuApi } from "@/lib/api";

export default function RestaurantMenuWorkspace() {
  const catalog = useMenuWorkspaceCatalog();
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const updatingItemIdRef = useRef<string | null>(null);

  async function handleToggleAvailability(item: MenuWorkspaceItem) {
    if (updatingItemIdRef.current !== null) {
      if (import.meta.env.DEV) {
        console.debug("[menu-v3] duplicate availability toggle blocked", {
          activeItemId: updatingItemIdRef.current,
          itemId: item.id,
        });
      }

      return;
    }

    updatingItemIdRef.current = item.id;
    setUpdatingItemId(item.id);

    const nextIsAvailable = !item.isAvailable;

    try {
      const result = await menuApi.updateMenuItemWithResult(item.id, {
        isAvailable: nextIsAvailable,
      });

      if (!result.ok || !result.body.success) {
        toast.error(
          result.body.message ||
            `Failed to update menu availability (${result.status})`,
        );
        return;
      }

      await catalog.reload();

      toast.success(
        nextIsAvailable
          ? "Menu item made available."
          : "Menu item made unavailable.",
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Failed to update menu availability"),
      );
    } finally {
      updatingItemIdRef.current = null;
      setUpdatingItemId(null);
    }
  }

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
        onToggleAvailability={handleToggleAvailability}
        status={catalog.status}
        updatingItemId={updatingItemId}
      />
    </WorkspaceShell>
  );
}
