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
import { CategoryManagerModal } from "@/components/menu/category-manager-modal";
import type {
  Category,
  MenuItem,
  Recipe,
  ViewMode,
} from "@/components/menu/menu-types";
import { MenuItemModal } from "@/components/menu/menu-item-modal";
import { ITEMS_PER_PAGE, getCategoryColor } from "@/components/menu/menu-utils";
import { RecipeBuilderModal } from "@/components/menu/recipe/recipe-builder-modal";
import { MenuMobileList } from "@/components/menu/menu-mobile-list";

import { MenuTableView } from "@/components/menu/menu-table-view";

import { MenuGridView } from "@/components/menu/menu-grid-view";
import { MenuToolbar } from "@/components/menu/menu-toolbar";
import { DataPagination } from "@/components/shared/data-pagination";
import { useMenuManager } from "@/hooks/use-menu-manager";

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
    if (!file.type.startsWith("image/")) {
      toast.info("File must be an image");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be under 2MB");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    revokeLocalImagePreview();
    setImagePreview(localPreview);
    setImageUrl("");
    setSelectedImageFile(file);
  }

  async function uploadImage(file: File) {
    setIsImageUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await apiFetch("/api/upload", {
        credentials: "include",
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || "Failed to upload image");
        return null;
      }

      const uploadedUrl = data.data?.imageUrl ?? data.imageUrl;

      if (!uploadedUrl) {
        toast.error("Upload succeeded but image URL was not returned");
        return null;
      }

      setImageUrl(uploadedUrl);
      setImagePreview(uploadedUrl);
      setSelectedImageFile(null);

      return uploadedUrl;
    } catch {
      toast.error("Failed to upload image");
      return null;
    } finally {
      setIsImageUploading(false);
    }
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    selectImage(file);

    e.target.value = "";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsLoading(true);

    try {
      const uploadedImageUrl = selectedImageFile
        ? await uploadImage(selectedImageFile)
        : imageUrl;

      if (selectedImageFile && !uploadedImageUrl) {
        return;
      }

      const url = editingId ? `/api/menu-items/${editingId}` : "/api/menu-items";
      const method = editingId ? "PATCH" : "POST";

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

      if (!data.success) {
        toast.error(data.message || "Failed to save menu item");
        return;
      }

      toast.success(editingId ? "Menu item updated" : "Menu item created");

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
        onUploadImage={selectImage}
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
