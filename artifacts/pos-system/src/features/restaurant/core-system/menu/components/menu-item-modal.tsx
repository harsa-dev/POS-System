"use client";

import type {
  ChangeEvent,
  FormEvent,
} from "react";

import {
  Loader2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { resolveMediaUrl } from "@/lib/api";

import type { Category } from "@/features/restaurant/core-system/menu/components/menu-types";

type MenuItemModalProps = {
  open: boolean;

  editingId: string | null;

  name: string;
  description: string;
  price: string;

  imagePreview: string;

  categoryId: string;

  categories: Category[];

  isLoading: boolean;

  isImageUploading: boolean;

  isDraggingImage: boolean;

  onClose: () => void;

  onSubmit: (
    e: FormEvent<HTMLFormElement>,
  ) => void;

  onNameChange: (
    value: string,
  ) => void;

  onDescriptionChange: (
    value: string,
  ) => void;

  onPriceChange: (
    value: string,
  ) => void;

  onCategoryChange: (
    value: string,
  ) => void;

  onImageUpload: (
    e: ChangeEvent<HTMLInputElement>,
  ) => Promise<void>;

  onUploadImage: (
    file: File,
  ) => void;

  setIsDraggingImage: (
    value: boolean,
  ) => void;
};

export function MenuItemModal({
  open,
  editingId,

  name,
  description,
  price,

  imagePreview,

  categoryId,

  categories,

  isLoading,
  isImageUploading,
  isDraggingImage,

  onClose,
  onSubmit,

  onNameChange,
  onDescriptionChange,
  onPriceChange,
  onCategoryChange,

  onImageUpload,
  onUploadImage,

  setIsDraggingImage,
}: MenuItemModalProps) {
  const previewSrc = resolveMediaUrl(imagePreview);

  if (imagePreview) {
    console.debug("[menu-image-debug] modal preview src", {
      imagePreview,
      imageSrc: previewSrc,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        editingId
          ? "Edit Menu Item"
          : "Add Menu Item"
      }
      description={
        editingId
          ? "Update menu details, price, and category."
          : "Create a new sellable item for cashier and kitchen."
      }
    >
      <form
        onSubmit={onSubmit}
        className="mt-6 space-y-4"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Menu Item Name
          </label>

          <input
            required
            value={name}
            onChange={(e) =>
              onNameChange(
                e.target.value,
              )
            }
            placeholder="e.g. Grilled Chicken"
            className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Price
            </label>

            <div className="flex h-11 overflow-hidden rounded-2xl border border-neutral-200 bg-white focus-within:border-neutral-400 focus-within:ring-4 focus-within:ring-neutral-100">
              <div className="flex shrink-0 items-center border-r bg-neutral-50 px-4 text-sm text-neutral-500">
                Rp
              </div>

              <input
                required
                type="number"
                min={0}
                value={price}
                onChange={(e) =>
                  onPriceChange(
                    e.target.value,
                  )
                }
                placeholder="0"
                className="min-w-0 flex-1 px-4 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Category
            </label>

            <select
              value={categoryId}
              onChange={(e) =>
                onCategoryChange(
                  e.target.value,
                )
              }
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
            >
              <option value="">
                No category
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Image
          </label>

          <label
            onDragOver={(e) => {
              e.preventDefault();

              setIsDraggingImage(
                true,
              );
            }}
            onDragLeave={() =>
              setIsDraggingImage(false)
            }
            onDrop={(e) => {
              e.preventDefault();

              setIsDraggingImage(
                false,
              );

              const file =
                e.dataTransfer
                  .files?.[0];

              if (file) {
                onUploadImage(file);
              }
            }}
            className={`group flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed px-6 text-center transition ${
              isDraggingImage
                ? "border-neutral-900 bg-neutral-100"
                : "border-neutral-300 bg-neutral-50 hover:border-neutral-400 hover:bg-neutral-100"
            }`}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={
                onImageUpload
              }
            />

            {previewSrc ? (
              <div className="relative w-full">
                <img
                  src={previewSrc}
                  alt="Preview"
                  className="h-36 w-full rounded-2xl bg-neutral-100 object-contain"
                />

                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                  <span className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-900">
                    Select another image
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                  {isImageUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
                  ) : (
                    <Upload className="h-5 w-5 text-neutral-500" />
                  )}
                </div>

                <p className="mt-3 text-sm font-semibold text-neutral-800">
                  Select image from file
                </p>

                <p className="mt-1 text-sm text-neutral-500">
                  Drag & drop on desktop.
                  Max 2MB.
                </p>
              </>
            )}
          </label>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Description
          </label>

          <textarea
            value={description}
            onChange={(e) =>
              onDescriptionChange(
                e.target.value,
              )
            }
            placeholder="Describe the menu item..."
            className="min-h-[88px] w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            disabled={
              isLoading ||
              isImageUploading
            }
          >
            {isLoading
              ? "Saving..."
              : editingId
                ? "Update Item"
                : "Create Item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
