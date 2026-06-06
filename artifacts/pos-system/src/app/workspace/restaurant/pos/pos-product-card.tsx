import { ShoppingCart } from "lucide-react";

type PosProductCardProps = {
  product: {
    name: string;
    category: string;
    price: string;
    status: string;
  };
};

export function PosProductCard({ product }: PosProductCardProps) {
  return (
    <button
      className="group min-h-36 rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600">
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          {product.status}
        </span>
      </div>
      <div className="mt-4">
        <p className="text-sm font-bold text-neutral-950">{product.name}</p>
        <p className="mt-1 text-xs text-neutral-500">{product.category}</p>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <span className="text-base font-bold text-neutral-950">
          {product.price}
        </span>
        <span className="text-xs font-semibold text-neutral-400 group-hover:text-neutral-600">
          Add
        </span>
      </div>
    </button>
  );
}
