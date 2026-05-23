"use client";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type DataPaginationProps = {
  currentPage: number;

  totalPages: number;

  startItem: number;

  endItem: number;

  totalItems: number;

  onPrevious: () => void;

  onNext: () => void;
};

export function DataPagination({
  currentPage,
  totalPages,
  startItem,
  endItem,
  totalItems,
  onPrevious,
  onNext,
}: DataPaginationProps) {
  return (
    <div className="shrink-0 border-t border-neutral-200 bg-white px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-neutral-500">
          Showing{" "}
          <span className="font-semibold text-neutral-800">
            {startItem}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-neutral-800">
            {endItem}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-neutral-800">
            {totalItems}
          </span>{" "}
          items
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={currentPage === 1}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex h-10 min-w-20 items-center justify-center rounded-xl border border-neutral-200 px-3 text-sm font-semibold">
            {currentPage} / {totalPages}
          </div>

          <button
            type="button"
            onClick={onNext}
            disabled={
              currentPage === totalPages
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}