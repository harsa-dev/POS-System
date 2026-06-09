import { PosProductCard } from "./pos-product-card";
import type { PosProductItem } from "./pos-workspace-types";
import { InlineErrorNotice } from "@/app/workspace/restaurant/shared/workspace-feedback";

type PosProductGridProps = {
  products: PosProductItem[];
  status: "loading" | "ready" | "error";
  errorMessage: string | null;
  emptyMessage: string;
  isUsingFallback: boolean;
  onAddProduct: (product: PosProductItem) => void;
};

function PosProductGridSkeleton() {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
          key={index}
        >
          <div className="aspect-[4/3] animate-pulse bg-neutral-100" />
          <div className="p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
            <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
            <div className="mt-5 h-4 w-24 animate-pulse rounded bg-neutral-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PosProductGrid({
  products,
  status,
  errorMessage,
  emptyMessage,
  isUsingFallback,
  onAddProduct,
}: PosProductGridProps) {
  const isLoading = status === "loading";
  const itemLabel = isUsingFallback ? "preview items" : "menu items";

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-neutral-950">Product Grid</h3>
          <p className="mt-1 text-xs text-neutral-500">
            Menu catalog is read-only. Adding items updates this local cart only.
          </p>
        </div>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
          {isLoading ? "Loading menu" : `${products.length} ${itemLabel}`}
        </span>
      </div>

      {errorMessage ? (
        <InlineErrorNotice className="mt-4 p-3 text-xs leading-5">
          {errorMessage}
        </InlineErrorNotice>
      ) : null}

      {isLoading ? <PosProductGridSkeleton /> : null}

      {!isLoading && products.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          {emptyMessage}
        </div>
      ) : null}

      {!isLoading && products.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {products.map((product) => (
            <PosProductCard
              key={product.id}
              onAddProduct={onAddProduct}
              product={product}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
