import { useEffect, useState } from "react";
import { ImageIcon, ShoppingCart } from "lucide-react";

import { resolveMediaUrl } from "@/lib/api";

import type { PosProductItem } from "./pos-workspace-types";

type PosProductCardProps = {
  product: PosProductItem;
  onAddProduct: (product: PosProductItem) => void;
};

export function PosProductCard({
  product,
  onAddProduct,
}: PosProductCardProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const imageUrl = hasImageError ? "" : resolveMediaUrl(product.imageUrl);

  useEffect(() => {
    setHasImageError(false);
  }, [product.imageUrl]);

  return (
    <button
      className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
      onClick={() => onAddProduct(product)}
      type="button"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center bg-neutral-100">
        {imageUrl ? (
          <img
            alt=""
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
            onError={() => setHasImageError(true)}
            src={imageUrl}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-neutral-400">
            <ImageIcon className="h-8 w-8" aria-hidden="true" />
            <span className="text-xs font-semibold">No image</span>
          </div>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur">
          {product.status}
        </span>
      </div>

      <div className="p-4">
        <div className="min-h-14">
          <p className="line-clamp-2 text-sm font-bold text-neutral-950">
            {product.name}
          </p>
          <p className="mt-1 text-xs text-neutral-500">{product.category}</p>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <span className="text-base font-bold text-neutral-950">
            {product.price}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-400 group-hover:text-neutral-600">
            <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
            Add
          </span>
        </div>
      </div>
    </button>
  );
}
