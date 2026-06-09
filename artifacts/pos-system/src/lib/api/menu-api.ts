import {
  apiClient,
  apiFetch,
  apiJson,
  type ApiEnvelope,
} from "@/lib/api/api-client";

import type {
  Category,
  InventoryItem,
  MenuItem,
  Recipe,
} from "@/features/fnb/core-system/menu/components/menu-types";

export type MenuItemPayload = {
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  categoryId?: string | null;
  isAvailable?: boolean;
};

export type CategoryPayload = {
  name: string;
};

export type RecipePayload = {
  menuItemId: string;
  inventoryItemId: string;
  quantityNeeded: number;
};

export type RecipeUpdatePayload = {
  inventoryItemId?: string;
  quantityNeeded?: number;
};

export type UploadImageResponse = ApiEnvelope<{
  imageUrl?: string;
  url?: string;
}> & {
  imageUrl?: string;
  url?: string;
};

type ApiRecord = Record<string, unknown>;

export type MenuItemAvailabilityPayload = {
  isAvailable: boolean;
};

export type MenuApiResult<T = ApiRecord> = {
  ok: boolean;
  status: number;
  body: ApiEnvelope<T>;
};

type ListMenuItemsOptions = {
  includeUnavailable?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return isRecord(value) && typeof value.success === "boolean";
}

async function readApiEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const rawText = await response.text();

  if (!rawText.trim()) {
    return {
      success: false,
      message: `Empty menu API response (${response.status})`,
    };
  }

  try {
    const parsed: unknown = JSON.parse(rawText);

    if (isApiEnvelope<T>(parsed)) {
      return parsed;
    }

    return {
      success: false,
      message: `Unexpected menu API response (${response.status})`,
    };
  } catch {
    return {
      success: false,
      message: rawText,
    };
  }
}

export const menuApi = {
  listMenuItems() {
    return apiClient.get<ApiEnvelope<MenuItem[]>>("/api/menu-items");
  },

  listMenuItemsWithOptions<T = MenuItem[]>(options?: ListMenuItemsOptions) {
    const endpoint = options?.includeUnavailable
      ? "/api/menu-items?includeUnavailable=true"
      : "/api/menu-items";

    return apiClient.get<ApiEnvelope<T>>(endpoint);
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

  async createMenuItemWithResult<T = ApiRecord>(
    payload: MenuItemPayload,
  ): Promise<MenuApiResult<T>> {
    const response = await apiFetch("/api/menu-items", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await readApiEnvelope<T>(response),
    };
  },

  updateMenuItem(id: string, payload: Partial<MenuItemPayload>) {
    return apiClient.patch<ApiEnvelope<MenuItem>>(`/api/menu-items/${id}`, {
      json: payload,
    });
  },

  async updateMenuItemWithResult<T = ApiRecord>(
    id: string,
    payload: Partial<MenuItemPayload> & Partial<MenuItemAvailabilityPayload>,
  ): Promise<MenuApiResult<T>> {
    const response = await apiFetch(`/api/menu-items/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await readApiEnvelope<T>(response),
    };
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

  listRecipes<T = Recipe[]>() {
    return apiClient.get<ApiEnvelope<T>>("/api/recipes");
  },

  createRecipe(payload: RecipePayload) {
    return apiClient.post<ApiEnvelope<Recipe>>("/api/recipes", {
      json: payload,
    });
  },

  async createRecipeWithResult<T = ApiRecord>(
    payload: RecipePayload,
  ): Promise<MenuApiResult<T>> {
    const response = await apiFetch("/api/recipes", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await readApiEnvelope<T>(response),
    };
  },

  updateRecipe(id: string, payload: RecipeUpdatePayload) {
    return apiClient.patch<ApiEnvelope<Recipe>>(`/api/recipes/${id}`, {
      json: payload,
    });
  },

  async updateRecipeWithResult<T = ApiRecord>(
    id: string,
    payload: RecipeUpdatePayload,
  ): Promise<MenuApiResult<T>> {
    const response = await apiFetch(`/api/recipes/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await readApiEnvelope<T>(response),
    };
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
