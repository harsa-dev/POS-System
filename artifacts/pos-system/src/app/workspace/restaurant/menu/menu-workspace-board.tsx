import {
  type ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCheck,
  ImageIcon,
  Loader2,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  Tags,
  UtensilsCrossed,
  X,
} from "lucide-react";

import { resolveMediaUrl } from "@/lib/api";
import { menuAvailabilityTones } from "@/app/workspace/restaurant/shared/restaurant-workspace-status";
import {
  EmptyState,
  InlineErrorNotice,
  LoadErrorState,
  RecipeRequiredBadge,
  RefreshingIndicator,
  StatusBadge,
} from "@/app/workspace/restaurant/shared/workspace-feedback";

import type {
  MenuWorkspaceCategory,
  MenuWorkspaceItem,
} from "./use-menu-workspace-catalog";

type MenuAvailabilityFilter = "all" | "available" | "unavailable";

type MenuWorkspaceBoardProps = {
  items: MenuWorkspaceItem[];
  categories: MenuWorkspaceCategory[];
  status: "loading" | "ready" | "error";
  errorMessage: string | null;
  isRefreshing: boolean;
  updatingItemId: string | null;
  onToggleAvailability: (item: MenuWorkspaceItem) => Promise<void>;
  isSavingItem: boolean;
  onCreateMenuItem: (values: MenuWorkspaceFormValues) => Promise<boolean>;
  onUpdateMenuItem: (
    item: MenuWorkspaceItem,
    values: MenuWorkspaceFormValues,
  ) => Promise<boolean>;
};

export type MenuWorkspaceFormValues = {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  isAvailable: boolean;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  imageUrl: string | null;
};

const supportedImageExtensions = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "avif",
]);

const availabilityFilters: Array<{
  id: MenuAvailabilityFilter;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "unavailable", label: "Unavailable" },
];

const emptyFormValues: MenuWorkspaceFormValues = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
  isAvailable: true,
  imageFile: null,
  imagePreviewUrl: null,
  imageUrl: null,
};

function isSupportedImageFile(file: File) {
  if (file.type.startsWith("image/") && file.type !== "image/svg+xml") {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension ? supportedImageExtensions.has(extension) : false;
}

function getFormValuesFromItem(
  item: MenuWorkspaceItem,
): MenuWorkspaceFormValues {
  return {
    name: item.name,
    description: item.description === "No description yet." ? "" : item.description,
    price: String(item.price),
    categoryId: item.categoryId ?? "",
    isAvailable: item.isAvailable,
    imageFile: null,
    imagePreviewUrl: item.imageUrl,
    imageUrl: item.imageUrl,
  };
}

function matchesAvailabilityFilter(
  item: MenuWorkspaceItem,
  filter: MenuAvailabilityFilter,
) {
  if (filter === "all") return true;
  if (filter === "available") return item.availability === "AVAILABLE";
  return item.availability !== "AVAILABLE";
}

function matchesCategoryFilter(
  item: MenuWorkspaceItem,
  selectedCategoryId: string | null,
) {
  if (selectedCategoryId === null) return true;
  if (selectedCategoryId === "uncategorized") return item.categoryId === null;
  return item.categoryId === selectedCategoryId;
}

function MenuWorkspaceSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading menu" aria-busy="true">
      <div className="grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="h-24 animate-pulse rounded-2xl border bg-white p-4 shadow-sm"
            key={index}
          >
            <div className="h-3 w-24 rounded bg-neutral-100" />
            <div className="mt-3 h-8 w-12 rounded bg-neutral-200" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            className="h-72 animate-pulse rounded-2xl border bg-white p-4 shadow-sm"
            key={index}
          >
            <div className="h-28 rounded-xl bg-neutral-100" />
            <div className="mt-4 h-5 w-32 rounded bg-neutral-200" />
            <div className="mt-3 h-4 w-40 rounded bg-neutral-100" />
            <div className="mt-4 h-10 rounded-xl bg-neutral-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MenuSummary({ items }: { items: MenuWorkspaceItem[] }) {
  const availableCount = items.filter(
    (item) => item.availability === "AVAILABLE",
  ).length;
  const outOfStockCount = items.filter(
    (item) => item.availability === "OUT_OF_STOCK",
  ).length;
  const noRecipeCount = items.filter(
    (item) => item.availability === "NO_RECIPE",
  ).length;
  const disabledCount = items.filter((item) => !item.isAvailable).length;

  return (
    <div className="grid gap-3 sm:grid-cols-5">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Total Items
        </p>
        <p className="mt-2 text-2xl font-bold text-neutral-950">
          {items.length}
        </p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Available
        </p>
        <p className="mt-2 text-2xl font-bold text-green-700">
          {availableCount}
        </p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Out of Stock
        </p>
        <p className="mt-2 text-2xl font-bold text-red-700">
          {outOfStockCount}
        </p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          No Recipe
        </p>
        <p className="mt-2 text-2xl font-bold text-yellow-700">
          {noRecipeCount}
        </p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Disabled
        </p>
        <p className="mt-2 text-2xl font-bold text-neutral-700">
          {disabledCount}
        </p>
      </div>
    </div>
  );
}

function MenuWorkspaceForm({
  categories,
  mode,
  values,
  error,
  isSaving,
  onCancel,
  onChange,
  onImageFileChange,
  onSubmit,
}: {
  categories: MenuWorkspaceCategory[];
  mode: "create" | "edit";
  values: MenuWorkspaceFormValues;
  error: string | null;
  isSaving: boolean;
  onCancel: () => void;
  onChange: (values: MenuWorkspaceFormValues) => void;
  onImageFileChange: (file: File | null) => void;
  onSubmit: () => void;
}) {
  const previewSrc = resolveMediaUrl(
    values.imagePreviewUrl ?? values.imageUrl,
  );

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    onImageFileChange(event.target.files?.[0] ?? null);
    event.target.value = "";
  }

  return (
    <form
      className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-col gap-3 border-b border-neutral-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-950">
            {mode === "create" ? "Create Menu Item" : "Edit Menu Item"}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Basic fields only. Images upload when this form is saved.
          </p>
        </div>
        <button
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50"
          onClick={onCancel}
          type="button"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Close
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold text-neutral-700">
          Name
          <input
            className="h-11 rounded-xl border border-neutral-200 px-3 text-sm font-normal outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
            disabled={isSaving}
            onChange={(event) =>
              onChange({ ...values, name: event.target.value })
            }
            placeholder="Menu item name"
            value={values.name}
          />
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-neutral-700">
          Price
          <input
            className="h-11 rounded-xl border border-neutral-200 px-3 text-sm font-normal outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
            disabled={isSaving}
            min="0"
            onChange={(event) =>
              onChange({ ...values, price: event.target.value })
            }
            placeholder="0"
            step="1"
            type="number"
            value={values.price}
          />
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-neutral-700">
          Category
          <select
            className="h-11 rounded-xl border border-neutral-200 px-3 text-sm font-normal outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
            disabled={isSaving}
            onChange={(event) =>
              onChange({ ...values, categoryId: event.target.value })
            }
            value={values.categoryId}
          >
            <option value="">No category</option>
            {categories
              .filter((category) => category.id !== "uncategorized")
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
        </label>

        <label className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700">
          <span>
            Available in POS
            <span className="block text-xs font-normal text-neutral-500">
              Disabled items stay visible here, but are hidden from POS.
            </span>
          </span>
          <input
            checked={values.isAvailable}
            className="h-5 w-5"
            disabled={isSaving}
            onChange={(event) =>
              onChange({ ...values, isAvailable: event.target.checked })
            }
            type="checkbox"
          />
        </label>
      </div>

      <label className="mt-4 grid gap-1.5 text-sm font-semibold text-neutral-700">
        Description
        <textarea
          className="min-h-24 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-normal outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
          disabled={isSaving}
          onChange={(event) =>
            onChange({ ...values, description: event.target.value })
          }
          placeholder="Optional menu description"
          value={values.description}
        />
      </label>

      <div className="mt-4 grid gap-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 p-3 sm:grid-cols-[160px_minmax(0,1fr)]">
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-neutral-100">
          {previewSrc ? (
            <img
              alt=""
              className="h-full w-full object-cover"
              src={previewSrc}
            />
          ) : (
            <ImageIcon className="h-8 w-8 text-neutral-400" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-col justify-center gap-2">
          <label className="grid gap-1.5 text-sm font-semibold text-neutral-700">
            Menu Image
            <input
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-950 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
              disabled={isSaving}
              onChange={handleImageChange}
              type="file"
            />
          </label>
          <p className="text-xs leading-5 text-neutral-500">
            Choose an image now and it will upload only after Save.
          </p>
          {values.imageFile ? (
            <button
              className="w-fit rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50"
              disabled={isSaving}
              onClick={() => onImageFileChange(null)}
              type="button"
            >
              {values.imageUrl ? "Keep existing image" : "Remove selected image"}
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          className="h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50"
          disabled={isSaving}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving...
            </>
          ) : mode === "create" ? (
            "Create Menu Item"
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}

function MenuWorkspaceCard({
  item,
  isUpdating,
  onToggleAvailability,
  onStartEdit,
}: {
  item: MenuWorkspaceItem;
  isUpdating: boolean;
  onToggleAvailability: (item: MenuWorkspaceItem) => Promise<void>;
  onStartEdit: (item: MenuWorkspaceItem) => void;
}) {
  const imageSrc = resolveMediaUrl(item.imageUrl);
  const toggleLabel = item.isAvailable ? "Make Unavailable" : "Make Available";
  const cannotMakeAvailable = !item.isAvailable && !item.hasRecipe;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:border-neutral-300">
      <div className="flex aspect-[4/3] items-center justify-center bg-neutral-100">
        {imageSrc ? (
          <img
            alt=""
            className="h-full w-full object-cover"
            src={imageSrc}
          />
        ) : (
          <ImageIcon className="h-8 w-8 text-neutral-400" aria-hidden="true" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-neutral-950">
              {item.name}
            </h2>
            <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
              <Tags className="h-3.5 w-3.5" aria-hidden="true" />
              {item.categoryName}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <StatusBadge tone={menuAvailabilityTones[item.availability]}>
              {item.availabilityLabel}
            </StatusBadge>
            {!item.hasRecipe ? <RecipeRequiredBadge /> : null}
          </div>
        </div>

        <p className="mt-3 line-clamp-2 min-h-10 text-sm text-neutral-500">
          {item.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-lg font-bold text-neutral-950">
            {item.priceLabel}
          </p>
          <p className="text-xs font-semibold text-neutral-400">
            Read only
          </p>
        </div>

        <div className="mt-auto grid gap-2 border-t border-neutral-100 pt-4">
          <button
            className={`flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              item.isAvailable
                ? "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
            disabled={isUpdating || cannotMakeAvailable}
            onClick={() => void onToggleAvailability(item)}
            type="button"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Updating...
              </>
            ) : (
              toggleLabel
            )}
          </button>
          {!item.hasRecipe ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800">
              Add at least one recipe ingredient before making this item
              available.
            </p>
          ) : null}
          <div className="grid grid-cols-3 gap-2">
            <button
              className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
              onClick={() => onStartEdit(item)}
              type="button"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </button>
            <button
              className="h-10 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
              onClick={() => onStartEdit(item)}
              type="button"
            >
              Image
            </button>
            <button
              className="h-10 rounded-xl border border-neutral-200 bg-neutral-100 text-sm font-semibold text-neutral-500 disabled:cursor-not-allowed disabled:opacity-70"
              disabled
              type="button"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function validateForm(values: MenuWorkspaceFormValues) {
  if (!values.name.trim()) return "Name is required.";

  const price = Number(values.price);
  if (!Number.isFinite(price) || price < 0) {
    return "Price must be a valid non-negative number.";
  }

  return null;
}

export function MenuWorkspaceBoard({
  items,
  categories,
  status,
  errorMessage,
  isRefreshing,
  updatingItemId,
  onToggleAvailability,
  isSavingItem,
  onCreateMenuItem,
  onUpdateMenuItem,
}: MenuWorkspaceBoardProps) {
  const [availabilityFilter, setAvailabilityFilter] =
    useState<MenuAvailabilityFilter>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingItem, setEditingItem] = useState<MenuWorkspaceItem | null>(
    null,
  );
  const [formValues, setFormValues] =
    useState<MenuWorkspaceFormValues>(emptyFormValues);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const previewUrl = formValues.imagePreviewUrl;

    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [formValues.imagePreviewUrl]);

  function openCreateForm() {
    setFormMode("create");
    setEditingItem(null);
    setFormValues(emptyFormValues);
    setFormError(null);
  }

  function openEditForm(item: MenuWorkspaceItem) {
    setFormMode("edit");
    setEditingItem(item);
    setFormValues(getFormValuesFromItem(item));
    setFormError(null);
  }

  function closeForm() {
    if (isSavingItem) return;
    setFormMode(null);
    setEditingItem(null);
    setFormValues(emptyFormValues);
    setFormError(null);
  }

  function updateImageFile(file: File | null) {
    if (!file) {
      setFormValues((currentValues) => ({
        ...currentValues,
        imageFile: null,
        imagePreviewUrl: currentValues.imageUrl,
      }));
      setFormError(null);
      return;
    }

    if (!isSupportedImageFile(file)) {
      setFormError("File must be a JPG, PNG, WebP, GIF, or AVIF image.");
      return;
    }

    setFormValues((currentValues) => ({
      ...currentValues,
      imageFile: file,
      imagePreviewUrl: URL.createObjectURL(file),
    }));
    setFormError(null);
  }

  async function submitForm() {
    const validationError = validateForm(formValues);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const didSave =
      formMode === "edit" && editingItem
        ? await onUpdateMenuItem(editingItem, formValues)
        : await onCreateMenuItem(formValues);

    if (didSave) {
      closeForm();
    }
  }

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const searchableText = [item.name, item.categoryName, item.description]
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        !normalizedQuery || searchableText.includes(normalizedQuery);

      return (
        matchesSearch &&
        matchesAvailabilityFilter(item, availabilityFilter) &&
        matchesCategoryFilter(item, selectedCategoryId)
      );
    });
  }, [availabilityFilter, items, searchQuery, selectedCategoryId]);

  if (status === "loading") {
    return <MenuWorkspaceSkeleton />;
  }

  if (status === "error") {
    return (
      <LoadErrorState
        description={errorMessage ?? "Please check the connection and try again."}
        icon={AlertTriangle}
        title="Failed to load menu"
      />
    );
  }

  return (
    <div className="space-y-4">
      <MenuSummary items={items} />

      {errorMessage ? (
        <InlineErrorNotice>{errorMessage}</InlineErrorNotice>
      ) : null}

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-950">
              Menu Catalog
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
              <span>
                Read-only V3 menu visibility across categories, stock readiness,
                and recipe readiness.
              </span>
              {isRefreshing ? (
                <RefreshingIndicator />
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-500 lg:w-72">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              aria-label="Search V3 menu"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-neutral-400"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search menu..."
              value={searchQuery}
            />
          </div>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
            onClick={openCreateForm}
            type="button"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Item
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {availabilityFilters.map((filter) => (
            <button
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                availabilityFilter === filter.id
                  ? "bg-neutral-950 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
              key={filter.id}
              onClick={() => setAvailabilityFilter(filter.id)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              selectedCategoryId === null
                ? "bg-blue-950 text-white"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
            onClick={() => setSelectedCategoryId(null)}
            type="button"
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                selectedCategoryId === category.id
                  ? "bg-blue-950 text-white"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              type="button"
            >
              {category.name} ({category.itemCount})
            </button>
          ))}
        </div>
      </div>

      {formMode ? (
        <MenuWorkspaceForm
          categories={categories}
          error={formError}
          isSaving={isSavingItem}
          mode={formMode}
          onCancel={closeForm}
          onChange={(values) => {
            setFormValues(values);
            setFormError(null);
          }}
          onImageFileChange={updateImageFile}
          onSubmit={submitForm}
          values={formValues}
        />
      ) : null}

      <div className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm">
        <PackageCheck className="h-4 w-4 text-neutral-500" aria-hidden="true" />
        Basic create, edit, image, and availability are enabled. Delete remains
        planned; recipes are managed from the Recipes workspace.
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          description={
            items.length === 0
              ? "Restaurant menu items will appear here after they are created."
              : "Try changing the search, availability filter, or category."
          }
          icon={items.length === 0 ? UtensilsCrossed : CheckCheck}
          title={
            items.length === 0 ? "No menu items yet" : "No matching menu items"
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <MenuWorkspaceCard
              isUpdating={updatingItemId === item.id}
              item={item}
              key={item.id}
              onStartEdit={openEditForm}
              onToggleAvailability={onToggleAvailability}
            />
          ))}
        </div>
      )}
    </div>
  );
}
