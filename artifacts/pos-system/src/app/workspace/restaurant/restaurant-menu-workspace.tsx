import { useRef, useState } from "react";
import { toast } from "sonner";

import {
  type MenuWorkspaceFormValues,
  MenuWorkspaceBoard,
} from "@/app/workspace/restaurant/menu/menu-workspace-board";
import {
  type MenuWorkspaceItem,
  useMenuWorkspaceCatalog,
} from "@/app/workspace/restaurant/menu/use-menu-workspace-catalog";
import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";
import {
  getApiErrorMessage,
  menuApi,
  type MenuItemPayload,
  type UploadImageResponse,
} from "@/lib/api";

export default function RestaurantMenuWorkspace() {
  const catalog = useMenuWorkspaceCatalog();
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const updatingItemIdRef = useRef<string | null>(null);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const isSavingItemRef = useRef(false);

  function buildMenuItemPayload(
    values: MenuWorkspaceFormValues,
    imageUrl?: string,
  ): MenuItemPayload {
    const payload: MenuItemPayload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      price: Number(values.price),
      categoryId: values.categoryId || null,
      isAvailable: values.isAvailable,
    };

    if (imageUrl !== undefined) {
      payload.imageUrl = imageUrl;
    }

    return payload;
  }

  function getUploadedImageUrl(response: UploadImageResponse) {
    return (
      response.data?.imageUrl ??
      response.data?.url ??
      response.imageUrl ??
      response.url ??
      null
    );
  }

  async function uploadImageForSave(values: MenuWorkspaceFormValues) {
    if (!values.imageFile) return undefined;

    try {
      const response = await menuApi.uploadImage(values.imageFile);

      if (!response.success) {
        toast.error(response.message || "Failed to upload image");
        return null;
      }

      const uploadedImageUrl = getUploadedImageUrl(response);

      if (!uploadedImageUrl) {
        toast.error("Upload completed without an image URL.");
        return null;
      }

      return uploadedImageUrl;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to upload image"));
      return null;
    }
  }

  async function handleCreateMenuItem(values: MenuWorkspaceFormValues) {
    if (isSavingItemRef.current) return false;

    isSavingItemRef.current = true;
    setIsSavingItem(true);

    try {
      const uploadedImageUrl = await uploadImageForSave(values);

      if (uploadedImageUrl === null) {
        return false;
      }

      const result = await menuApi.createMenuItemWithResult(
        buildMenuItemPayload(values, uploadedImageUrl),
      );

      if (!result.ok || !result.body.success) {
        toast.error(
          result.body.message ||
            `Failed to create menu item (${result.status})`,
        );
        return false;
      }

      await catalog.reload();
      toast.success("Menu item created.");
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create menu item"));
      return false;
    } finally {
      isSavingItemRef.current = false;
      setIsSavingItem(false);
    }
  }

  async function handleUpdateMenuItem(
    item: MenuWorkspaceItem,
    values: MenuWorkspaceFormValues,
  ) {
    if (isSavingItemRef.current) return false;

    isSavingItemRef.current = true;
    setIsSavingItem(true);

    try {
      const uploadedImageUrl = await uploadImageForSave(values);

      if (uploadedImageUrl === null) {
        return false;
      }

      const result = await menuApi.updateMenuItemWithResult(
        item.id,
        buildMenuItemPayload(values, uploadedImageUrl),
      );

      if (!result.ok || !result.body.success) {
        toast.error(
          result.body.message ||
            `Failed to update menu item (${result.status})`,
        );
        return false;
      }

      await catalog.reload();
      toast.success("Menu item updated.");
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update menu item"));
      return false;
    } finally {
      isSavingItemRef.current = false;
      setIsSavingItem(false);
    }
  }

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
      description="V3 menu catalog workspace for basic item management, category assignment, prices, and availability."
      currentRouteLabel="current Menu route"
      currentRoutePath={ROUTES.MENU}
    >
      <MenuWorkspaceBoard
        categories={catalog.categories}
        errorMessage={catalog.errorMessage}
        isSavingItem={isSavingItem}
        items={catalog.items}
        onCreateMenuItem={handleCreateMenuItem}
        onToggleAvailability={handleToggleAvailability}
        onUpdateMenuItem={handleUpdateMenuItem}
        status={catalog.status}
        updatingItemId={updatingItemId}
      />
    </WorkspaceShell>
  );
}
