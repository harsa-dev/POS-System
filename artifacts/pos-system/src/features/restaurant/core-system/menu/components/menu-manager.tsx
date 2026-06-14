"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { apiFetch } from "@/lib/api";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  ImageIcon,
  LayoutList,
  Loader2,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CategoryManagerModal } from "@/features/restaurant/core-system/menu/components/category-manager-modal";
import type {
  Category,
  MenuItem,
  Recipe,
  ViewMode,
} from "@/features/restaurant/core-system/menu/components/menu-types";
import { MenuItemModal } from "@/features/restaurant/core-system/menu/components/menu-item-modal";
import { ITEMS_PER_PAGE, getCategoryColor } from "@/features/restaurant/core-system/menu/components/menu-utils";
import { RecipeBuilderModal } from "@/features/restaurant/core-system/menu/components/recipe/recipe-builder-modal";
import { MenuMobileList } from "@/features/restaurant/core-system/menu/components/menu-mobile-list";

import { MenuTableView } from "@/features/restaurant/core-system/menu/components/menu-table-view";

import { MenuGridView } from "@/features/restaurant/core-system/menu/components/menu-grid-view";
import { MenuToolbar } from "@/features/restaurant/core-system/menu/components/menu-toolbar";
import { DataPagination } from "@/components/shared/table";
import { useMenuManager } from "@/hooks/use-menu-manager";

type UploadResponse = {
  success?: boolean;
  message?: string;
  imageUrl?: string;
  url?: string;
  data?: {
    imageUrl?: string;
    url?: string;
  };
};

type UploadResponseDebug = {
  data: UploadResponse | null;
  rawText: string;
  parseError: string | null;
};

const UPLOAD_ENDPOINT = "/api/upload";
const UPLOAD_FIELD_NAME = "image";
const UPLOAD_FLOW_VERSION = "menu-upload-debug-2026-05-29-01";

const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "avif",
]);

function isSupportedImageFile(file: File) {
  if (file.type.startsWith("image/") && file.type !== "image/svg+xml") {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension ? SUPPORTED_IMAGE_EXTENSIONS.has(extension) : false;
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function truncateDebugText(value: string, maxLength = 220) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function debugUpload(stage: string, details?: Record<string, unknown>) {
  console.debug(`[${UPLOAD_FLOW_VERSION}] ${stage}`, details ?? {});
}

function toastDebug(message: string) {
  toast.info(`[upload-debug] ${message}`);
}

async function readUploadResponse(res: Response) {
  const rawText = await res.text();

  try {
    return {
      data: rawText ? (JSON.parse(rawText) as UploadResponse) : null,
      rawText,
      parseError: null,
    } satisfies UploadResponseDebug;
  } catch (error) {
    return {
      data: null,
      rawText,
      parseError: getErrorMessage(error),
    } satisfies UploadResponseDebug;
  }
}

function getUploadErrorMessage(res: Response, response: UploadResponseDebug) {
  const { data, rawText, parseError } = response;

  if (res.status === 413) return "Image too large";
  if (res.status === 400 && data?.message) return data.message;
  if (parseError) return `Invalid upload response: ${truncateDebugText(rawText || parseError)}`;
  return data?.message ?? "Failed to upload image";
}

export function MenuManager() {

  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);

  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(
    null,
  );

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeInventoryItemId, setRecipeInventoryItemId] = useState("");
  const [recipeQuantityNeeded, setRecipeQuantityNeeded] = useState("");
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [currentPage, setCurrentPage] = useState(1);

  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryName, setEditingCategoryName] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [categoryId, setCategoryId] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
  } | null>(null);
  const {
  menuItems,
  categories,
  inventoryItems,

  fetchMenuItems,
  fetchCategories,
  fetchRecipes,

  hasRecipe,
} = useMenuManager();


  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    debugUpload("flow mounted", {
      endpoint: UPLOAD_ENDPOINT,
      fieldName: UPLOAD_FIELD_NAME,
    });
    toastDebug(`flow ${UPLOAD_FLOW_VERSION} mounted using ${UPLOAD_ENDPOINT}`);
  }, []);

  function revokeLocalImagePreview() {
    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
  }

  function resetForm() {
    revokeLocalImagePreview();
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setImageUrl("");
    setImagePreview("");
    setSelectedImageFile(null);
    setCategoryId("");
  }

  function openCreateModal() {
    resetForm();
    setIsMenuModalOpen(true);
  }

  function closeModal() {
    resetForm();
    setIsMenuModalOpen(false);
  }

  function startEdit(menuItem: MenuItem) {
    setEditingId(menuItem.id);
    setName(menuItem.name);
    setDescription(menuItem.description ?? "");
    setPrice(String(menuItem.price));
    setImageUrl(menuItem.imageUrl ?? "");
    setImagePreview(menuItem.imageUrl ?? "");
    setSelectedImageFile(null);
    setCategoryId(menuItem.categoryId ?? "");
    setIsMenuModalOpen(true);
  }

  function selectImage(file: File) {
    debugUpload("image selected", {
      name: file.name,
      size: file.size,
      type: file.type,
    });
    toastDebug(
      `image selected: ${file.name} (${file.type || "unknown type"}, ${formatFileSize(file.size)})`,
    );

    if (!isSupportedImageFile(file)) {
      toast.info("File must be a JPG, PNG, WebP, GIF, or AVIF image");
      debugUpload("image rejected before preview", {
        name: file.name,
        size: file.size,
        type: file.type,
      });
      return;
    }

    const localPreview = URL.createObjectURL(file);
    revokeLocalImagePreview();
    setImagePreview(localPreview);
    setImageUrl("");
    setSelectedImageFile(file);
    debugUpload("preview generated", {
      previewUrl: localPreview,
      selectedImageFile: file.name,
    });
    toastDebug(`preview generated for ${file.name}`);
  }

  async function uploadImage(file: File) {
    setIsImageUploading(true);

    try {
      const formData = new FormData();
      formData.append(UPLOAD_FIELD_NAME, file);
      debugUpload("upload started", {
        endpoint: UPLOAD_ENDPOINT,
        fieldName: UPLOAD_FIELD_NAME,
        name: file.name,
        size: file.size,
        type: file.type,
      });
      toastDebug(`upload started: ${UPLOAD_ENDPOINT} field=${UPLOAD_FIELD_NAME}`);

      const res = await apiFetch(UPLOAD_ENDPOINT, {
        credentials: "include",
        method: "POST",
        body: formData,
      });

      const uploadResponse = await readUploadResponse(res);
      debugUpload("backend response body", {
        status: res.status,
        ok: res.ok,
        rawText: uploadResponse.rawText,
        parseError: uploadResponse.parseError,
        data: uploadResponse.data,
      });
      toastDebug(
        `backend response ${res.status}: ${truncateDebugText(uploadResponse.rawText || uploadResponse.parseError || "<empty>")}`,
      );

      if (!res.ok || !uploadResponse.data?.success) {
        const message = getUploadErrorMessage(res, uploadResponse);
        debugUpload("upload failed", {
          status: res.status,
          message,
          response: uploadResponse,
        });
        toast.error(message);
        return null;
      }

      const uploadedUrl =
        uploadResponse.data.data?.imageUrl ?? uploadResponse.data.imageUrl;

      if (!uploadedUrl) {
        const message = `Invalid upload response: ${truncateDebugText(uploadResponse.rawText || "imageUrl missing")}`;
        debugUpload("upload failed", {
          status: res.status,
          message,
          response: uploadResponse,
        });
        toast.error(message);
        return null;
      }

      setImageUrl(uploadedUrl);
      setImagePreview(uploadedUrl);
      setSelectedImageFile(null);
      debugUpload("upload success", {
        imageUrl: uploadedUrl,
        response: uploadResponse.data,
      });
      toast.success(`Upload success: ${uploadedUrl}`);

      return uploadedUrl;
    } catch (error) {
      const message = getErrorMessage(error);
      debugUpload("upload network error", { message, error });
      toast.error(`Upload network error: ${message}`);
      return null;
    } finally {
      setIsImageUploading(false);
    }
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    debugUpload("file input changed", {
      name: file.name,
      size: file.size,
      type: file.type,
    });
    toastDebug("image selected from file input");
    selectImage(file);

    e.target.value = "";
  }

  function handleImageDrop(file: File) {
    debugUpload("image dropped", {
      name: file.name,
      size: file.size,
      type: file.type,
    });
    toastDebug("image selected from drag/drop");
    selectImage(file);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsLoading(true);
    debugUpload("menu save started", {
      editingId,
      hasSelectedImageFile: Boolean(selectedImageFile),
      existingImageUrl: imageUrl,
      endpoint: UPLOAD_ENDPOINT,
    });
    toastDebug(
      `menu save started${selectedImageFile ? " with pending image upload" : " without pending image upload"}`,
    );

    try {
      const uploadedImageUrl = selectedImageFile
        ? await uploadImage(selectedImageFile)
        : imageUrl;

      if (selectedImageFile && !uploadedImageUrl) {
        return;
      }

      const url = editingId ? `/api/menu-items/${editingId}` : "/api/menu-items";
      const method = editingId ? "PATCH" : "POST";
      debugUpload("menu item request started", {
        url,
        method,
        imageUrl: uploadedImageUrl,
      });

      const res = await apiFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          price: Number(price),
          imageUrl: uploadedImageUrl,
          categoryId: categoryId || undefined,
        }),
      });

      const data = await res.json();
      debugUpload("menu item response body", {
        status: res.status,
        ok: res.ok,
        data,
      });

      if (!data.success) {
        toast.error(data.message || "Failed to save menu item");
        return;
      }

      toast.success(editingId ? "Menu item updated" : "Menu item created");
      toastDebug("menu save success");
      debugUpload("menu save success", {
        editingId,
        imageUrl: uploadedImageUrl,
      });

      closeModal();
      fetchMenuItems();
    } finally {
      setIsLoading(false);
    }
  }

  function handleRemoveMenuItem(id: string) {
    setConfirmState({
      title: "Remove menu item?",
      description: "This item will be permanently removed from the menu.",
      variant: "destructive",
      onConfirm: async () => {
        const res = await apiFetch(`/api/menu-items/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (!data.success) {
          toast.error(data.message || "Failed to remove menu item");
          return;
        }
        toast.success("Menu item removed");
        fetchMenuItems();
      },
    });
  }

  async function createCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const cleanName = categoryName.trim();

    if (!cleanName) return;

    setIsCategoryLoading(true);

    const res = await apiFetch("/api/categories", {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: cleanName,
      }),
    });

    const data = await res.json();

    setIsCategoryLoading(false);

    if (!data.success) {
      toast.error(data.message || "Failed to create category");
      return;
    }

    toast.success("Category created");

    setCategoryName("");
    fetchCategories();
  }

  function startEditCategory(category: Category) {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  }

  function cancelEditCategory() {
    setEditingCategoryId(null);
    setEditingCategoryName("");
  }

  async function saveCategory(id: string) {
    const cleanName = editingCategoryName.trim();

    if (!cleanName) return;

    const res = await apiFetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: cleanName,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      toast.error(data.message || "Failed to update category");
      return;
    }

    toast.success("Category updated");

    cancelEditCategory();
    fetchCategories();
    fetchMenuItems();
  }

  function deleteCategory(id: string) {
    setConfirmState({
      title: "Delete this category?",
      description: "Menu items in this category will become uncategorized.",
      variant: "destructive",
      onConfirm: async () => {
        const res = await apiFetch(`/api/categories/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (!data.success) {
          toast.error(data.message || "Failed to delete category");
          return;
        }
        toast.success("Category deleted");
        fetchCategories();
        fetchMenuItems();
      },
    });
  }

  async function openRecipeModal(menuItem: MenuItem) {
    setSelectedMenuItem(menuItem);
    setRecipeInventoryItemId("");
    setRecipeQuantityNeeded("");
    setIsRecipeModalOpen(true);

    const res = await apiFetch("/api/recipes", { credentials: "include" });

    const data = await res.json();

    if (data.success) {
      const filteredRecipes = data.data.filter(
        (recipe: Recipe) => recipe.menuItemId === menuItem.id,
      );

      setRecipes(filteredRecipes);
    }
  }

  function closeRecipeModal() {
    setSelectedMenuItem(null);
    setRecipes([]);
    setRecipeInventoryItemId("");
    setRecipeQuantityNeeded("");
    setIsRecipeModalOpen(false);
  }

  async function handleCreateRecipe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedMenuItem) return;

    setIsRecipeLoading(true);

    const res = await apiFetch("/api/recipes", {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        menuItemId: selectedMenuItem.id,
        inventoryItemId: recipeInventoryItemId,
        quantityNeeded: Number(recipeQuantityNeeded),
      }),
    });

    const data = await res.json();

    setIsRecipeLoading(false);

    if (!data.success) {
      toast.error(data.message || "Failed to save recipe");
      return;
    }

    toast.success("Recipe added");

    setRecipeInventoryItemId("");
    setRecipeQuantityNeeded("");

    await openRecipeModal(selectedMenuItem);
    fetchRecipes();
  }

  function deleteRecipe(id: string) {
    setConfirmState({
      title: "Remove recipe ingredient?",
      description: "This ingredient will be removed from the recipe.",
      variant: "destructive",
      onConfirm: async () => {
        const res = await apiFetch(`/api/recipes/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (!data.success) {
          toast.error(data.message || "Failed to delete recipe item");
          return;
        }
        toast.success("Recipe ingredient removed");
        if (selectedMenuItem) {
          await openRecipeModal(selectedMenuItem);
          fetchRecipes();
        }
      },
    });
  }

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const text = [item.name, item.description, item.category?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [menuItems, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMenuItems.length / ITEMS_PER_PAGE),
  );

  const paginatedMenuItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return filteredMenuItems.slice(startIndex, endIndex);
  }, [filteredMenuItems, currentPage]);

  const startItem =
    filteredMenuItems.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredMenuItems.length,
  );

  function goToPreviousPage() {
    setCurrentPage((page) => Math.max(1, page - 1));
  }

  function goToNextPage() {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
  }

  return (
    <>
      <div className="flex h-[calc(100vh-8rem)] min-h-0 flex-col gap-6 overflow-hidden">

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="shrink-0 border-b border-neutral-200 p-5 sm:p-6">
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Menu List</h2>

                <p className="mt-1 text-sm text-neutral-500">
                  Items shown to cashier and kitchen.
                </p>
              </div>

              <MenuToolbar
                search={search}
                viewMode={viewMode}
                onSearchChange={setSearch}
                onViewModeChange={setViewMode}
                onOpenCategories={() => setIsCategoryModalOpen(true)}
                onOpenCreateModal={openCreateModal}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto overscroll-contain no-scrollbar">
            <MenuMobileList
              menuItems={paginatedMenuItems}
              hasRecipe={hasRecipe}
              onRecipe={openRecipeModal}
              onEdit={startEdit}
              onDelete={handleRemoveMenuItem}
            />

            {viewMode === "table" && (
              <MenuTableView
                menuItems={paginatedMenuItems}
                hasRecipe={hasRecipe}
                onRecipe={openRecipeModal}
                onEdit={startEdit}
                onDelete={handleRemoveMenuItem}
              />
            )}

            {viewMode === "grid" && (
              <MenuGridView
                menuItems={paginatedMenuItems}
                hasRecipe={hasRecipe}
                onRecipe={openRecipeModal}
                onEdit={startEdit}
                onDelete={handleRemoveMenuItem}
              />
            )}
          </div>

          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            startItem={startItem}
            endItem={endItem}
            totalItems={filteredMenuItems.length}
            onPrevious={goToPreviousPage}
            onNext={goToNextPage}
          />
        </section>
      </div>

      <CategoryManagerModal
        open={isCategoryModalOpen}
        categories={categories}
        categoryName={categoryName}
        editingCategoryId={editingCategoryId}
        editingCategoryName={editingCategoryName}
        isCategoryLoading={isCategoryLoading}
        onClose={() => setIsCategoryModalOpen(false)}
        onCreateCategory={createCategory}
        onCategoryNameChange={setCategoryName}
        onStartEditCategory={startEditCategory}
        onCancelEditCategory={cancelEditCategory}
        onEditingCategoryNameChange={setEditingCategoryName}
        onSaveCategory={saveCategory}
        onDeleteCategory={deleteCategory}
      />

      <MenuItemModal
        open={isMenuModalOpen}
        editingId={editingId}
        name={name}
        description={description}
        price={price}
        imagePreview={imagePreview}
        categoryId={categoryId}
        categories={categories}
        isLoading={isLoading}
        isImageUploading={isImageUploading}
        isDraggingImage={isDraggingImage}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        onPriceChange={setPrice}
        onCategoryChange={setCategoryId}
        onImageUpload={handleImageUpload}
        onUploadImage={handleImageDrop}
        setIsDraggingImage={setIsDraggingImage}
      />

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title ?? ""}
        description={confirmState?.description}
        variant={confirmState?.variant}
        onConfirm={() => {
          const action = confirmState?.onConfirm;
          setConfirmState(null);
          action?.();
        }}
        onCancel={() => setConfirmState(null)}
      />

      <RecipeBuilderModal
        open={isRecipeModalOpen}
        selectedMenuItem={selectedMenuItem}
        recipes={recipes}
        inventoryItems={inventoryItems}
        recipeInventoryItemId={recipeInventoryItemId}
        recipeQuantityNeeded={recipeQuantityNeeded}
        isRecipeLoading={isRecipeLoading}
        onClose={closeRecipeModal}
        onSubmit={handleCreateRecipe}
        onDeleteRecipe={deleteRecipe}
        onInventoryItemChange={setRecipeInventoryItemId}
        onQuantityNeededChange={setRecipeQuantityNeeded}
      />
    </>
  );
}
