import { apiClient, apiJson, type ApiEnvelope } from "@/lib/api/api-client";

import type {
  Category,
  InventoryItem,
  MenuItem,
  Recipe,
} from "@/components/menu/menu-types";

export type MenuItemPayload = {
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  categoryId?: string | null;
};

export type CategoryPayload = {
  name: string;
};

export type RecipePayload = {
  menuItemId: string;
  inventoryItemId: string;
  quantityNeeded: number;
};

export type UploadImageResponse = ApiEnvelope<{
  imageUrl?: string;
  url?: string;
}> & {
  imageUrl?: string;
  url?: string;
};

export const menuApi = {
  listMenuItems() {
    return apiClient.get<ApiEnvelope<MenuItem[]>>("/api/menu-items");
  },

  listMenuItemsForCheckout() {
    return apiJson<ApiEnvelope<MenuItem[]>>("/api/menu-items", {
      credentials: "include",
    });
  },

  createMenuItem(payload: MenuItemPayload) {
    return apiClient.post<ApiEnvelope<MenuItem>>("/api/menu-items", {
      json: payload,
    });
  },

  updateMenuItem(id: string, payload: Partial<MenuItemPayload>) {
    return apiClient.patch<ApiEnvelope<MenuItem>>(`/api/menu-items/${id}`, {
      json: payload,
    });
  },

  deleteMenuItem(id: string) {
    return apiClient.delete<ApiEnvelope>(`/api/menu-items/${id}`);
  },

  listCategories() {
    return apiClient.get<ApiEnvelope<Category[]>>("/api/categories");
  },

  createCategory(payload: CategoryPayload) {
    return apiClient.post<ApiEnvelope<Category>>("/api/categories", {
      json: payload,
    });
  },

  updateCategory(id: string, payload: CategoryPayload) {
    return apiClient.patch<ApiEnvelope<Category>>(`/api/categories/${id}`, {
      json: payload,
    });
  },

  deleteCategory(id: string) {
    return apiClient.delete<ApiEnvelope>(`/api/categories/${id}`);
  },

  listInventoryItems() {
    return apiClient.get<ApiEnvelope<InventoryItem[]>>("/api/inventory-items");
  },

  listRecipes() {
    return apiClient.get<ApiEnvelope<Recipe[]>>("/api/recipes");
  },

  createRecipe(payload: RecipePayload) {
    return apiClient.post<ApiEnvelope<Recipe>>("/api/recipes", {
      json: payload,
    });
  },

  deleteRecipe(id: string) {
    return apiClient.delete<ApiEnvelope>(`/api/recipes/${id}`);
  },

  uploadImage(file: File) {
    const formData = new FormData();
    formData.append("image", file);

    return apiClient.post<UploadImageResponse>("/api/upload", {
      body: formData,
    });
  },
};
