"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DataTableColumn<TData> = {
  key: string;
  header: string;
  className?: string;
  cell: (row: TData) => ReactNode;
};

type DataTablePagination = {
  pageSize?: number;
  label?: string;
};

const DEFAULT_PAGE_SIZE = 10;

export function DataTable<TData>({
  columns,
  data,
  getRowKey,
  minWidth = 900,
  emptyMessage = "No data found.",
  pagination = { pageSize: DEFAULT_PAGE_SIZE },
}: {
  columns: DataTableColumn<TData>[];
  data: TData[];
  getRowKey: (row: TData) => string;
  minWidth?: number;
  emptyMessage?: string;
  pagination?: DataTablePagination | false;
}) {
  const [page, setPage] = useState(1);

  const pageSize =
    pagination && pagination.pageSize && pagination.pageSize > 0
      ? Math.floor(pagination.pageSize)
      : DEFAULT_PAGE_SIZE;
  const isPaginationEnabled = Boolean(pagination) && data.length > pageSize;
  const totalPages = isPaginationEnabled
    ? Math.ceil(data.length / pageSize)
    : 1;

  useEffect(() => {
    setPage(1);
  }, [data, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visibleRows = useMemo(() => {
    if (!isPaginationEnabled) return data;

    const start = (page - 1) * pageSize;

    return data.slice(start, start + pageSize);
  }, [data, isPaginationEnabled, page, pageSize]);

  const firstRow = data.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = isPaginationEnabled
    ? Math.min(page * pageSize, data.length)
    : data.length;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          <thead className="border-b border-border bg-muted text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn("px-4 py-3 font-semibold", column.className)}
                >
                  {column.header}
                </th>
              ))}
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
            Showing {firstRow}-{lastRow} of {data.length}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
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
              onClick={() =>
                setPage((currentPage) => Math.min(currentPage + 1, totalPages))
              }
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
