"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DataTableColumn<TData> = {
  key: string;
  header: string;
  className?: string;
  cell: (row: TData) => ReactNode;
  sortable?: boolean;
  sortKey?: string;
};

type DataTablePagination = {
  pageSize?: number;
  label?: string;
  page?: number;
  totalRows?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
};

type DataTableSorting = {
  sortBy: string;
  sortDirection: "asc" | "desc";
  onSortChange: (sortBy: string) => void;
  sortableKeys?: string[];
};

const DEFAULT_PAGE_SIZE = 10;

export function DataTable<TData>({
  columns,
  data,
  getRowKey,
  minWidth = 900,
  emptyMessage = "No data found.",
  pagination = { pageSize: DEFAULT_PAGE_SIZE },
  sorting,
}: {
  columns: DataTableColumn<TData>[];
  data: TData[];
  getRowKey: (row: TData) => string;
  minWidth?: number;
  emptyMessage?: string;
  pagination?: DataTablePagination | false;
  sorting?: DataTableSorting;
}) {
  const [localPage, setLocalPage] = useState(1);

  const pageSize =
    pagination && pagination.pageSize && pagination.pageSize > 0
      ? Math.floor(pagination.pageSize)
      : DEFAULT_PAGE_SIZE;
  const isControlledPagination =
    Boolean(pagination) &&
    typeof pagination !== "boolean" &&
    typeof pagination.page === "number" &&
    typeof pagination.onPageChange === "function";
  const page = isControlledPagination && pagination ? pagination.page ?? 1 : localPage;
  const totalRows =
    isControlledPagination && pagination && pagination.totalRows !== undefined
      ? pagination.totalRows
      : data.length;
  const totalPages =
    isControlledPagination && pagination && pagination.totalPages !== undefined
      ? Math.max(pagination.totalPages, 1)
      : totalRows > pageSize
        ? Math.ceil(totalRows / pageSize)
        : 1;
  const isPaginationEnabled = Boolean(pagination) && totalRows > pageSize;

  useEffect(() => {
    if (!isControlledPagination) setLocalPage(1);
  }, [data, isControlledPagination, pageSize]);

  useEffect(() => {
    if (!isControlledPagination && page > totalPages) setLocalPage(totalPages);
  }, [isControlledPagination, page, totalPages]);

  const visibleRows = useMemo(() => {
    if (!isPaginationEnabled || isControlledPagination) return data;

    const start = (page - 1) * pageSize;

    return data.slice(start, start + pageSize);
  }, [data, isControlledPagination, isPaginationEnabled, page, pageSize]);

  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = isPaginationEnabled ? Math.min(page * pageSize, totalRows) : totalRows;

  const goToPage = (nextPage: number) => {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);

    if (isControlledPagination && pagination && pagination.onPageChange) {
      pagination.onPageChange(safePage);
      return;
    }

    setLocalPage(safePage);
  };

  const isColumnSortable = (column: DataTableColumn<TData>) => {
    const sortKey = column.sortKey ?? column.key;
    if (column.sortable === false) return false;
    if (sorting?.sortableKeys) return sorting.sortableKeys.includes(sortKey);

    return Boolean(sorting) && column.sortable === true;
  };

  const getSortLabel = (column: DataTableColumn<TData>) => {
    if (!sorting) return "";

    const sortKey = column.sortKey ?? column.key;
    if (sorting.sortBy !== sortKey) return "";

    return sorting.sortDirection === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          <thead className="border-b border-border bg-muted text-muted-foreground">
            <tr>
              {columns.map((column) => {
                const sortKey = column.sortKey ?? column.key;
                const sortable = isColumnSortable(column);

                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn("px-4 py-3 font-semibold", column.className)}
                  >
                    {sortable && sorting ? (
                      <button
                        type="button"
                        onClick={() => sorting.onSortChange(sortKey)}
                        className="inline-flex items-center gap-1 rounded-md text-left font-semibold text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        {column.header}
                        <span aria-hidden="true">{getSortLabel(column)}</span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr
                key={getRowKey(row)}
                className="border-b border-border transition-colors hover:bg-muted/50"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn("px-4 py-4", column.className)}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isPaginationEnabled && (
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            {pagination && pagination.label ? `${pagination.label}: ` : ""}
            Showing {firstRow}-{lastRow} of {totalRows}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="rounded-md border border-border bg-card px-3 py-1.5 font-medium text-card-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Previous
            </button>

            <span className="min-w-20 text-center font-medium text-foreground">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className="rounded-md border border-border bg-card px-3 py-1.5 font-medium text-card-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
